"use client";

import { useState } from "react";
import { checkInAction } from "./actions";

type Props = {
  slug: string;
  initialCount: number;
  initialLongest: number;
  initialNextMilestone: number;
  initialCheckedInToday: boolean;
};

export default function CheckInButton({
  slug,
  initialCount,
  initialLongest,
  initialNextMilestone,
  initialCheckedInToday,
}: Props) {
  const [count, setCount] = useState(initialCount);
  const [longest, setLongest] = useState(initialLongest);
  const [goal, setGoal] = useState(initialNextMilestone);
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
      setCheckedInToday(true);
      setPop(true);
      setTimeout(() => setPop(false), 300);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="wrap">
      <div className={`count${pop ? " pop" : ""}`}>{count}</div>
      <div className="label">day streak</div>
      <button onClick={handleClick} disabled={checkedInToday || pending}>
        {checkedInToday ? "Done for today" : "Check in ✓"}
      </button>
      <div className="meta">
        <div>Next goal: {goal} days</div>
        <div>Longest streak: {longest} days</div>
      </div>
    </div>
  );
}
