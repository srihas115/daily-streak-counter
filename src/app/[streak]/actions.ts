"use server";

import { checkIn, type CheckInResult } from "@/lib/streaks";

export async function checkInAction(slug: string): Promise<CheckInResult> {
  return checkIn(slug);
}
