"use server";

import { requireAuthenticated } from "@/lib/auth";
import { checkIn, setDescription, setTimezone, type StreakDisplay } from "@/lib/streaks";
import { loginAction } from "@/app/actions";

export async function checkInAction(slug: string): Promise<StreakDisplay> {
  await requireAuthenticated();
  return checkIn(slug);
}

export async function setTimezoneAction(
  slug: string,
  timezone: string
): Promise<StreakDisplay & { checkedInToday: boolean }> {
  await requireAuthenticated();
  return setTimezone(slug, timezone);
}

export async function setDescriptionAction(
  slug: string,
  description: string
): Promise<StreakDisplay & { checkedInToday: boolean }> {
  await requireAuthenticated();
  return setDescription(slug, description);
}

// Powers the inline "🔒 Check in" flow: enter the password once, right on
// the locked button, and (if correct) it logs in AND checks in in one shot.
export async function loginAndCheckInAction(
  slug: string,
  password: string
): Promise<{ ok: true; result: StreakDisplay } | { ok: false }> {
  const { ok } = await loginAction(password);
  if (!ok) return { ok: false };
  const result = await checkIn(slug);
  return { ok: true, result };
}
