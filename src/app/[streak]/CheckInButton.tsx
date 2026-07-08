"use client";

import { useState } from "react";
import { checkInAction } from "./actions";

type Props = {
  slug: string;
  initialCount: number;
  initialLongest: number;
  initialNextMilestone: number;
  initialLongestStartDate: string | null;
  initialLongestEndDate: string | null;
  initialLongestOngoing: boolean;
  initialCheckedInToday: boolean;
};

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

function longestRangeLabel(
  longest: number,
  start: string | null,
  end: string | null,
  ongoing: boolean
): string | null {
  if (longest <= 0 || !start) return null;
  const startLabel = formatDate(start);
  if (ongoing) return `${startLabel} – Present`;
  if (!end || end === start) return startLabel;
  return `${startLabel} – ${formatDate(end)}`;
}

export default function CheckInButton({
  slug,
  initialCount,
  initialLongest,
  initialNextMilestone,
  initialLongestStartDate,
  initialLongestEndDate,
  initialLongestOngoing,
  initialCheckedInToday,
}: Props) {
  const [count, setCount] = useState(initialCount);
  const [longest, setLongest] = useState(initialLongest);
  const [goal, setGoal] = useState(initialNextMilestone);
  const [longestStartDate, setLongestStartDate] = useState(initialLongestStartDate);
  const [longestEndDate, setLongestEndDate] = useState(initialLongestEndDate);
  const [longestOngoing, setLongestOngoing] = useState(initialLongestOngoing);
  const [checkedInToday, setCheckedInToday] = useState(initialCheckedInToday);
  const [pending, setPending] = useState(false);
  const [pop, setPop] = useState(false);

  async function handleClick() {
    if (checkedInToday || pending) return;
    setPending(true);
    try {
      const result = await checkInAction(slug);
      setCount(result.count);
      setLongest(result.longest);
      setGoal(result.nextMilestone);
      setLongestStartDate(result.longestStartDate);
      setLongestEndDate(result.longestEndDate);
      setLongestOngoing(result.longestOngoing);
      setCheckedInToday(true);
      setPop(true);
      setTimeout(() => setPop(false), 300);
    } finally {
      setPending(false);
    }
  }

  const rangeLabel = longestRangeLabel(longest, longestStartDate, longestEndDate, longestOngoing);

  return (
    <div className={`wrap${checkedInToday ? " checked-in" : ""}`}>
      <div className="app-header">
        You are on <span className="app-name">Daily Streak Counter</span> for{" "}
        <span className="streak-path">/{slug}</span>
      </div>
      <div className={`count${pop ? " pop" : ""}`}>{count}</div>
      <div className="label">day streak</div>
      <button onClick={handleClick} disabled={checkedInToday || pending}>
        {checkedInToday ? "Done for today" : "Check in ✓"}
      </button>
      <div className="meta">
        <div>Next goal: {goal} days</div>
        <div>
          Longest streak: {longest} days{rangeLabel ? ` (${rangeLabel})` : ""}
        </div>
      </div>
    </div>
  );
}
