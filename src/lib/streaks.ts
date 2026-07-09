import { getSupabaseAdmin } from "./supabase";

export const DEFAULT_TIMEZONE = "America/Chicago";
const FIXED_MILESTONES = [1, 3, 7, 10, 14, 30, 60, 90, 100, 150, 200, 300, 365];

export type StreakRow = {
  slug: string;
  count: number;
  longest: number;
  last_check_date: string | null;
  longest_start_date: string | null;
  longest_end_date: string | null;
  timezone: string;
  description: string;
};

// IANA zone names double as "closest city" labels (America/Chicago,
// Asia/Kolkata, ...) and already encode each zone's own DST rules, so no
// separate daylight-saving handling is needed here.
export function todayInZone(timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date());
}

// Both dates are YYYY-MM-DD strings for the same timezone, so UTC-midnight
// math gives exact calendar-day arithmetic without DST edge cases.
function daysBetween(dateStrA: string, dateStrB: string): number {
  const [ay, am, ad] = dateStrA.split("-").map(Number);
  const [by, bm, bd] = dateStrB.split("-").map(Number);
  const a = Date.UTC(ay, am - 1, ad);
  const b = Date.UTC(by, bm - 1, bd);
  return Math.round((b - a) / 86400000);
}

function addDays(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().slice(0, 10);
}

export function nextMilestone(count: number): number {
  for (const m of FIXED_MILESTONES) {
    if (m > count) return m;
  }
  let m = FIXED_MILESTONES[FIXED_MILESTONES.length - 1];
  while (m <= count) m += 100;
  return m;
}

function defaultRow(slug: string): StreakRow {
  return {
    slug,
    count: 0,
    longest: 0,
    last_check_date: null,
    longest_start_date: null,
    longest_end_date: null,
    timezone: DEFAULT_TIMEZONE,
    description: "",
  };
}

async function loadStreak(slug: string): Promise<StreakRow> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("streaks").select("*").eq("slug", slug).maybeSingle();
  if (error) throw new Error(`Failed to load streak "${slug}": ${error.message}`);
  if (!data) return defaultRow(slug);
  return { ...defaultRow(slug), ...data } as StreakRow;
}

async function saveStreak(row: StreakRow): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("streaks").upsert(row, { onConflict: "slug" });
  if (error) throw new Error(`Failed to save streak "${row.slug}": ${error.message}`);
}

export type ResolvedStreak = {
  data: StreakRow;
  today: string;
  checkedInToday: boolean;
};

// Resolves the "missed a day" reset against the current date (in the
// streak's own timezone), writing to the DB if a reset is needed. Same
// logic as check-in, minus the increment.
export async function resolveStreak(slug: string): Promise<ResolvedStreak> {
  let data = await loadStreak(slug);
  const today = todayInZone(data.timezone);

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

  // diff > 1: a day was missed, reset the streak (longest record is untouched).
  if (data.count !== 0) {
    data = { ...data, count: 0 };
    await saveStreak(data);
  }
  return { data, today, checkedInToday: false };
}

export type StreakDisplay = {
  slug: string;
  count: number;
  longest: number;
  nextMilestone: number;
  longestStartDate: string | null;
  longestEndDate: string | null;
  longestOngoing: boolean;
  timezone: string;
  description: string;
};

// While the current run is tied with (or has just extended) the record, the
// record's "end date" is today, live — it only freezes once that run breaks.
function toDisplay(data: StreakRow, today: string): StreakDisplay {
  const longestOngoing = data.longest > 0 && data.count === data.longest;
  return {
    slug: data.slug,
    count: data.count,
    longest: data.longest,
    nextMilestone: nextMilestone(data.count),
    longestStartDate: data.longest_start_date,
    longestEndDate: longestOngoing ? today : data.longest_end_date,
    longestOngoing,
    timezone: data.timezone,
    description: data.description,
  };
}

export async function getStreakDisplay(
  slug: string
): Promise<StreakDisplay & { checkedInToday: boolean }> {
  const { data, today, checkedInToday } = await resolveStreak(slug);
  return { ...toDisplay(data, today), checkedInToday };
}

// Lists every dstreak that has been created (i.e. has a row in the DB).
// Runs each through the same reset/resolution logic as a real visit, so the
// home page table's numbers agree with what visiting the page directly
// would show. N+1 queries is fine at personal-tool scale.
export async function listAllStreaks(): Promise<Array<StreakDisplay & { checkedInToday: boolean }>> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("streaks").select("slug").order("slug", { ascending: true });
  if (error) throw new Error(`Failed to list streaks: ${error.message}`);
  const slugs = (data ?? []).map((row) => row.slug as string);
  return Promise.all(slugs.map((slug) => getStreakDisplay(slug)));
}

export async function checkIn(slug: string): Promise<StreakDisplay> {
  const { data, today, checkedInToday } = await resolveStreak(slug);

  if (checkedInToday) {
    return toDisplay(data, today);
  }

  const newCount = data.count + 1;
  let { longest, longest_start_date, longest_end_date } = data;

  // >= (not just >) so a tied run also becomes "the" current record run,
  // picking up the live end-date behavior above.
  if (newCount >= longest) {
    longest = newCount;
    longest_start_date = addDays(today, -(newCount - 1));
    longest_end_date = today;
  }

  const updated: StreakRow = {
    ...data,
    count: newCount,
    longest,
    last_check_date: today,
    longest_start_date,
    longest_end_date,
  };
  await saveStreak(updated);

  return toDisplay(updated, today);
}

export async function setTimezone(
  slug: string,
  timezone: string
): Promise<StreakDisplay & { checkedInToday: boolean }> {
  const data = await loadStreak(slug);
  await saveStreak({ ...data, timezone });
  // Re-resolve: the new timezone can shift what "today" is enough to trigger
  // (or avoid) a missed-day reset, or change whether today is already
  // checked in, so recompute from scratch rather than patching in memory.
  const { data: resolved, today, checkedInToday } = await resolveStreak(slug);
  return { ...toDisplay(resolved, today), checkedInToday };
}

export async function setDescription(
  slug: string,
  description: string
): Promise<StreakDisplay & { checkedInToday: boolean }> {
  const data = await loadStreak(slug);
  await saveStreak({ ...data, description });
  const { data: resolved, today, checkedInToday } = await resolveStreak(slug);
  return { ...toDisplay(resolved, today), checkedInToday };
}
