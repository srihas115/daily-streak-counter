"use server";

import { checkIn, type StreakDisplay } from "@/lib/streaks";

export async function checkInAction(slug: string): Promise<StreakDisplay> {
  return checkIn(slug);
}
