"use server";

import { checkIn, setTimezone, type StreakDisplay } from "@/lib/streaks";

export async function checkInAction(slug: string): Promise<StreakDisplay> {
  return checkIn(slug);
}

export async function setTimezoneAction(
  slug: string,
  timezone: string
): Promise<StreakDisplay & { checkedInToday: boolean }> {
  return setTimezone(slug, timezone);
}
