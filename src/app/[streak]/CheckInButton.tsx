"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { setThemeAction } from "@/app/actions";
import { checkInAction, loginAndCheckInAction, setDescriptionAction, setTimezoneAction } from "./actions";

type Props = {
  slug: string;
  authenticated: boolean;
  initialCount: number;
  initialLongest: number;
  initialNextMilestone: number;
  initialLongestStartDate: string | null;
  initialLongestEndDate: string | null;
  initialLongestOngoing: boolean;
  initialCheckedInToday: boolean;
  initialTimezone: string;
  initialDescription: string;
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

// A short synthesized "ding" via Web Audio — no binary asset to host.
function playDing() {
  try {
    const AudioContextCtor =
      window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    const ctx = new AudioContextCtor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
    osc.onended = () => ctx.close();
  } catch {
    // Web Audio unsupported or blocked — silently skip the sound.
  }
}

export default function CheckInButton({
  slug,
  authenticated,
  initialCount,
  initialLongest,
  initialNextMilestone,
  initialLongestStartDate,
  initialLongestEndDate,
  initialLongestOngoing,
  initialCheckedInToday,
  initialTimezone,
  initialDescription,
}: Props) {
  const router = useRouter();
  const [count, setCount] = useState(initialCount);
  const [longest, setLongest] = useState(initialLongest);
  const [goal, setGoal] = useState(initialNextMilestone);
  const [longestStartDate, setLongestStartDate] = useState(initialLongestStartDate);
  const [longestEndDate, setLongestEndDate] = useState(initialLongestEndDate);
  const [longestOngoing, setLongestOngoing] = useState(initialLongestOngoing);
  const [checkedInToday, setCheckedInToday] = useState(initialCheckedInToday);
  const [timezone, setTimezone] = useState(initialTimezone);
  const [description, setDescriptionState] = useState(initialDescription);
  const [descDraft, setDescDraft] = useState(initialDescription);
  const [pending, setPending] = useState(false);
  const [tzPending, setTzPending] = useState(false);
  const [descPending, setDescPending] = useState(false);
  const [pop, setPop] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authed, setAuthed] = useState(authenticated);
  const [locked, setLocked] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const timezones = useMemo(listTimezones, []);

  function applyResult(result: {
    count: number;
    longest: number;
    nextMilestone: number;
    longestStartDate: string | null;
    longestEndDate: string | null;
    longestOngoing: boolean;
  }) {
    setCount(result.count);
    setLongest(result.longest);
    setGoal(result.nextMilestone);
    setLongestStartDate(result.longestStartDate);
    setLongestEndDate(result.longestEndDate);
    setLongestOngoing(result.longestOngoing);
  }

  async function handleClick() {
    if (checkedInToday || pending) return;

    if (!authed) {
      setLocked(true);
      setLoginError(null);
      requestAnimationFrame(() => passwordInputRef.current?.focus());
      return;
    }

    setPending(true);
    try {
      const result = await checkInAction(slug);
      applyResult(result);
      setCheckedInToday(true);
      setPop(true);
      playDing();
      setTimeout(() => setPop(false), 300);
    } finally {
      setPending(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setLoginError(null);
    try {
      const outcome = await loginAndCheckInAction(slug, password);
      if (!outcome.ok) {
        setLoginError("Incorrect password");
        return;
      }
      applyResult(outcome.result);
      setCheckedInToday(true);
      setAuthed(true);
      setLocked(false);
      setPassword("");
      setPop(true);
      playDing();
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
      applyResult(result);
      setCheckedInToday(result.checkedInToday);
    } finally {
      setTzPending(false);
    }
  }

  async function handleDescriptionSave() {
    if (descDraft === description) return;
    setDescPending(true);
    try {
      await setDescriptionAction(slug, descDraft);
      setDescriptionState(descDraft);
    } finally {
      setDescPending(false);
    }
  }

  async function handleThemeChange(theme: "light" | "dark" | "system") {
    await setThemeAction(theme);
    router.refresh();
  }

  const rangeLabel = longestRangeLabel(longest, longestStartDate, longestEndDate, longestOngoing);

  return (
    <div className="page">
      {authed ? (
        <button
          type="button"
          className="gear-btn"
          aria-label={settingsOpen ? "Close settings" : "Settings"}
          onClick={() => setSettingsOpen((open) => !open)}
        >
          ⚙
        </button>
      ) : null}

      {settingsOpen && authed ? (
        <div className="wrap page-fade">
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

            <label className="settings-label" htmlFor="desc-input" style={{ marginTop: 16 }}>
              Description
            </label>
            <textarea
              id="desc-input"
              value={descDraft}
              onChange={(e) => setDescDraft(e.target.value)}
              onBlur={handleDescriptionSave}
              disabled={descPending}
              rows={2}
              placeholder="Short description shown on the home page"
            />

            <label className="settings-label" style={{ marginTop: 16 }}>
              Theme
            </label>
            <div className="theme-buttons">
              <button type="button" onClick={() => handleThemeChange("system")}>
                System
              </button>
              <button type="button" onClick={() => handleThemeChange("light")}>
                Light
              </button>
              <button type="button" onClick={() => handleThemeChange("dark")}>
                Dark
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className={`wrap page-fade${checkedInToday ? " checked-in" : ""}`}>
          <div className="app-header">
            You are on <span className="app-name">Daily Streak Counter</span> for{" "}
            <span className="streak-path">/{slug}</span>
          </div>
          {description ? <div className="streak-description">{description}</div> : null}
          <div className={`count${pop ? " pop" : ""}`}>{count}</div>
          <div className="label">day streak</div>

          {locked ? (
            <form className="password-inline" onSubmit={handlePasswordSubmit}>
              <input
                ref={passwordInputRef}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                disabled={pending}
                autoFocus
              />
              <div className="password-inline-actions">
                <button type="submit" disabled={pending || !password}>
                  Check in ✓
                </button>
                <button
                  type="button"
                  className="password-cancel"
                  onClick={() => {
                    setLocked(false);
                    setPassword("");
                    setLoginError(null);
                  }}
                >
                  Cancel
                </button>
              </div>
              {loginError ? <div className="login-error">{loginError}</div> : null}
            </form>
          ) : (
            <button onClick={handleClick} disabled={checkedInToday || pending}>
              {checkedInToday ? "Done for today" : authed ? "Check in ✓" : "🔒 Check in"}
            </button>
          )}

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
