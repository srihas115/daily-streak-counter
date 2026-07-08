"use client";

import { useMemo, useState } from "react";
import { checkInAction, setTimezoneAction } from "./actions";

type Props = {
  slug: string;
  initialCount: number;
  initialLongest: number;
  initialNextMilestone: number;
  initialLongestStartDate: string | null;
  initialLongestEndDate: string | null;
  initialLongestOngoing: boolean;
  initialCheckedInToday: boolean;
  initialTimezone: string;
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

// Falls back to a short, common list if the browser doesn't support
// Intl.supportedValuesOf (older Safari); modern browsers get the full
// IANA set, which doubles as a "closest city" picker with DST already
// baked into each zone's own rules.
function listTimezones(): string[] {
  const intlWithSupportedValues = Intl as typeof Intl & {
    supportedValuesOf?: (key: string) => string[];
  };
  if (typeof intlWithSupportedValues.supportedValuesOf === "function") {
    try {
      return intlWithSupportedValues.supportedValuesOf("timeZone");
    } catch {
      // fall through to the static list below
    }
  }
  return [
    "Pacific/Honolulu",
    "America/Anchorage",
    "America/Los_Angeles",
    "America/Denver",
    "America/Phoenix",
    "America/Chicago",
    "America/New_York",
    "America/Sao_Paulo",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Europe/Moscow",
    "Africa/Cairo",
    "Asia/Dubai",
    "Asia/Kolkata",
    "Asia/Bangkok",
    "Asia/Shanghai",
    "Asia/Tokyo",
    "Australia/Sydney",
    "Pacific/Auckland",
  ];
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
  initialTimezone,
}: Props) {
  const [count, setCount] = useState(initialCount);
  const [longest, setLongest] = useState(initialLongest);
  const [goal, setGoal] = useState(initialNextMilestone);
  const [longestStartDate, setLongestStartDate] = useState(initialLongestStartDate);
  const [longestEndDate, setLongestEndDate] = useState(initialLongestEndDate);
  const [longestOngoing, setLongestOngoing] = useState(initialLongestOngoing);
  const [checkedInToday, setCheckedInToday] = useState(initialCheckedInToday);
  const [timezone, setTimezone] = useState(initialTimezone);
  const [pending, setPending] = useState(false);
  const [tzPending, setTzPending] = useState(false);
  const [pop, setPop] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const timezones = useMemo(listTimezones, []);

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

  async function handleTimezoneChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const nextTimezone = e.target.value;
    setTzPending(true);
    try {
      const result = await setTimezoneAction(slug, nextTimezone);
      setTimezone(nextTimezone);
      setCount(result.count);
      setLongest(result.longest);
      setGoal(result.nextMilestone);
      setLongestStartDate(result.longestStartDate);
      setLongestEndDate(result.longestEndDate);
      setLongestOngoing(result.longestOngoing);
      setCheckedInToday(result.checkedInToday);
    } finally {
      setTzPending(false);
    }
  }

  const rangeLabel = longestRangeLabel(longest, longestStartDate, longestEndDate, longestOngoing);

  return (
    <div className="page">
      <button
        type="button"
        className="gear-btn"
        aria-label="Settings"
        onClick={() => setSettingsOpen(true)}
      >
        ⚙
      </button>

      {settingsOpen ? (
        <div className="wrap">
          <div className="settings-panel">
            <button type="button" className="back-btn" onClick={() => setSettingsOpen(false)}>
              ← Back
            </button>
            <h2 className="settings-title">Settings</h2>
            <label className="settings-label" htmlFor="tz-select">
              Time zone
            </label>
            <select
              id="tz-select"
              value={timezone}
              onChange={handleTimezoneChange}
              disabled={tzPending}
            >
              {timezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
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
      )}
    </div>
  );
}
