import { getSupabaseAdmin } from "./supabase";

const TIMEZONE = "America/Chicago";
const FIXED_MILESTONES = [1, 3, 7, 10, 14, 30, 60, 90, 100, 150, 200, 300, 365];

export type StreakRow = {
  slug: string;
  count: number;
  longest: number;
  last_check_date: string | null;
};

export function todayInChicago(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }).format(new Date());
}

// Both dates are YYYY-MM-DD strings for the same timezone, so a UTC-midnight
// diff gives an exact calendar-day difference without DST edge cases.
function daysBetween(dateStrA: string, dateStrB: string): number {
  const [ay, am, ad] = dateStrA.split("-").map(Number);
  const [by, bm, bd] = dateStrB.split("-").map(Number);
  const a = Date.UTC(ay, am - 1, ad);
  const b = Date.UTC(by, bm - 1, bd);
  return Math.round((b - a) / 86400000);
}

export function nextMilestone(count: number): number {
  for (const m of FIXED_MILESTONES) {
    if (m > count) return m;
  }
  let m = FIXED_MILESTONES[FIXED_MILESTONES.length - 1];
  while (m <= count) m += 100;
  return m;
}

async function loadStreak(slug: string): Promise<StreakRow> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from("streaks").select("*").eq("slug", slug).maybeSingle();
  if (!data) return { slug, count: 0, longest: 0, last_check_date: null };
  return data as StreakRow;
}

async function saveStreak(row: StreakRow): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase.from("streaks").upsert(row, { onConflict: "slug" });
}

export type ResolvedStreak = {
  data: StreakRow;
  today: string;
  checkedInToday: boolean;
};

// Resolves the "missed a day" reset against the current date, writing to the
// DB if a reset is needed. Same logic as check-in, minus the increment.
export async function resolveStreak(slug: string): Promise<ResolvedStreak> {
  const today = todayInChicago();
  let data = await loadStreak(slug);

  if (!data.last_check_date) {
    return { data, today, checkedInToday: false };
  }

  const diff = daysBetween(data.last_check_date, today);

  if (diff <= 0) {
    // Already checked in today. A negative diff is a clock anomaly; treat it
    // the same way to avoid double increments.
    return { data, today, checkedInToday: true };
  }

  if (diff === 1) {
    return { data, today, checkedInToday: false };
  }

  // diff > 1: a day was missed, reset the streak.
  if (data.count !== 0) {
    data = { ...data, count: 0 };
    await saveStreak(data);
  }
  return { data, today, checkedInToday: false };
}

export type CheckInResult = {
  count: number;
  longest: number;
  nextMilestone: number;
};

export async function checkIn(slug: string): Promise<CheckInResult> {
  const { data, today, checkedInToday } = await resolveStreak(slug);

  if (checkedInToday) {
    return { count: data.count, longest: data.longest, nextMilestone: nextMilestone(data.count) };
  }

  const updated: StreakRow = {
    slug,
    count: data.count + 1,
    longest: Math.max(data.longest, data.count + 1),
    last_check_date: today,
  };
  await saveStreak(updated);

  return { count: updated.count, longest: updated.longest, nextMilestone: nextMilestone(updated.count) };
}
