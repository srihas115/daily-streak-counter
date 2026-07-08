// Daily Streak Counter — single-file Cloudflare Worker.
// Each URL path (e.g. /morning, /night) is an independent streak, keyed in KV by that path.

const TIMEZONE = "America/Chicago";
const FIXED_MILESTONES = [1, 3, 7, 10, 14, 30, 60, 90, 100, 150, 200, 300, 365];

function todayInChicago() {
  // en-CA gives YYYY-MM-DD directly.
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }).format(new Date());
}

// Both dates are YYYY-MM-DD strings for the same timezone, so a UTC-midnight
// diff gives an exact calendar-day difference without DST edge cases.
function daysBetween(dateStrA, dateStrB) {
  const a = Date.UTC(...dateStrA.split("-").map(Number));
  const b = Date.UTC(...dateStrB.split("-").map(Number));
  return Math.round((b - a) / 86400000);
}

function nextMilestone(count) {
  for (const m of FIXED_MILESTONES) {
    if (m > count) return m;
  }
  let m = FIXED_MILESTONES[FIXED_MILESTONES.length - 1];
  while (m <= count) m += 100;
  return m;
}

async function loadStreak(kv, key) {
  const raw = await kv.get(key);
  if (!raw) return { count: 0, longest: 0, lastCheckDate: null };
  try {
    const data = JSON.parse(raw);
    return {
      count: data.count ?? 0,
      longest: data.longest ?? 0,
      lastCheckDate: data.lastCheckDate ?? null,
    };
  } catch {
    return { count: 0, longest: 0, lastCheckDate: null };
  }
}

async function saveStreak(kv, key, data) {
  await kv.put(key, JSON.stringify(data));
}

// Resolves the "missed a day" reset against the current date, mutating KV if needed.
// Returns { data, checkedInToday, canCheckIn }.
async function resolveStreak(kv, key) {
  const today = todayInChicago();
  let data = await loadStreak(kv, key);

  if (!data.lastCheckDate) {
    return { data, today, checkedInToday: false, canCheckIn: true };
  }

  const diff = daysBetween(data.lastCheckDate, today);

  if (diff <= 0) {
    // Already checked in today (diff === 0). A negative diff is a clock
    // anomaly; treat it the same as "already checked in" to avoid double increments.
    return { data, today, checkedInToday: true, canCheckIn: false };
  }

  if (diff === 1) {
    return { data, today, checkedInToday: false, canCheckIn: true };
  }

  // diff > 1: a day was missed, reset the streak.
  if (data.count !== 0) {
    data = { ...data, count: 0 };
    await saveStreak(kv, key, data);
  }
  return { data, today, checkedInToday: false, canCheckIn: true };
}

function renderPage(streakName, state) {
  const { data, checkedInToday } = state;
  const goal = nextMilestone(data.count);
  const initial = {
    count: data.count,
    longest: data.longest,
    nextMilestone: goal,
    checkedInToday,
  };

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<title>${streakName} streak</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    height: 100%;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background: #fff;
    color: #111;
  }
  @media (prefers-color-scheme: dark) {
    html, body { background: #111; color: #f2f2f2; }
  }
  .wrap {
    min-height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 16px;
  }
  .count {
    font-size: clamp(48px, 18vw, 88px);
    font-weight: 700;
    line-height: 1;
    min-width: 1ch;
  }
  .count.pop {
    animation: pop 0.3s ease;
  }
  @keyframes pop {
    0%   { transform: scale(1) translateY(0); opacity: 1; }
    40%  { transform: scale(1.15) translateY(-6px); opacity: 0.6; }
    100% { transform: scale(1) translateY(0); opacity: 1; }
  }
  .label {
    font-size: 13px;
    color: #666;
    margin-top: 2px;
  }
  @media (prefers-color-scheme: dark) {
    .label { color: #aaa; }
  }
  .meta {
    margin-top: 14px;
    font-size: 13px;
    color: #666;
    line-height: 1.6;
  }
  @media (prefers-color-scheme: dark) {
    .meta { color: #aaa; }
  }
  button {
    margin-top: 20px;
    font-size: 16px;
    font-weight: 600;
    padding: 10px 28px;
    border-radius: 999px;
    border: none;
    background: #16a34a;
    color: #fff;
    cursor: pointer;
    transition: background 0.2s, opacity 0.2s, transform 0.1s;
  }
  button:active:not(:disabled) { transform: scale(0.97); }
  button:disabled {
    background: #9ca3af;
    cursor: default;
    opacity: 0.8;
  }
</style>
</head>
<body>
  <div class="wrap">
    <div class="count" id="count">${data.count}</div>
    <div class="label">day streak</div>
    <button id="checkinBtn">${checkedInToday ? "Done for today" : "Check in ✓"}</button>
    <div class="meta">
      <div id="nextGoal">Next goal: ${goal} days</div>
      <div id="longest">Longest streak: ${data.longest} days</div>
    </div>
  </div>
<script>
  const STREAK = ${JSON.stringify(streakName)};
  let state = ${JSON.stringify(initial)};

  const countEl = document.getElementById("count");
  const btn = document.getElementById("checkinBtn");
  const nextGoalEl = document.getElementById("nextGoal");
  const longestEl = document.getElementById("longest");

  function render() {
    countEl.textContent = state.count;
    nextGoalEl.textContent = "Next goal: " + state.nextMilestone + " days";
    longestEl.textContent = "Longest streak: " + state.longest + " days";
    btn.disabled = state.checkedInToday;
    btn.textContent = state.checkedInToday ? "Done for today" : "Check in ✓";
  }

  btn.addEventListener("click", async () => {
    if (state.checkedInToday) return;
    btn.disabled = true;
    try {
      const res = await fetch("/api/" + encodeURIComponent(STREAK) + "/check", { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        state = { ...state, ...json, checkedInToday: true };
        countEl.classList.remove("pop");
        void countEl.offsetWidth;
        countEl.classList.add("pop");
        render();
      } else {
        state.checkedInToday = true;
        render();
      }
    } catch (e) {
      btn.disabled = state.checkedInToday;
    }
  });

  render();
</script>
</body>
</html>`;
}

function renderHome() {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Daily Streak Counter</title>
<style>
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    margin: 0;
    padding: 16px;
    text-align: center;
    color: #111;
  }
  code { background: #f2f2f2; padding: 2px 6px; border-radius: 4px; }
</style>
</head>
<body>
  <div>
    <p>Visit <code>/yourstreakname</code> to start a streak, e.g. <code>/morning</code> or <code>/night</code>.</p>
  </div>
</body>
</html>`;
}

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/" || path === "") {
      return new Response(renderHome(), { headers: { "content-type": "text/html;charset=UTF-8" } });
    }

    const apiMatch = path.match(/^\/api\/([^/]+)\/check$/);
    if (apiMatch) {
      const streakName = decodeURIComponent(apiMatch[1]);
      if (request.method !== "POST") {
        return jsonResponse({ error: "method not allowed" }, 405);
      }

      const key = streakName;
      const { data, today, checkedInToday } = await resolveStreak(env.STREAKS, key);

      if (checkedInToday) {
        return jsonResponse({
          count: data.count,
          longest: data.longest,
          nextMilestone: nextMilestone(data.count),
        });
      }

      const updated = {
        count: data.count + 1,
        longest: Math.max(data.longest, data.count + 1),
        lastCheckDate: today,
      };
      await saveStreak(env.STREAKS, key, updated);

      return jsonResponse({
        count: updated.count,
        longest: updated.longest,
        nextMilestone: nextMilestone(updated.count),
      });
    }

    // Any other single-segment path is a streak name, e.g. /morning
    const streakMatch = path.match(/^\/([^/]+)$/);
    if (streakMatch && request.method === "GET") {
      const streakName = decodeURIComponent(streakMatch[1]);
      const key = streakName;
      const state = await resolveStreak(env.STREAKS, key);
      return new Response(renderPage(streakName, state), {
        headers: { "content-type": "text/html;charset=UTF-8" },
      });
    }

    return new Response("Not found", { status: 404 });
  },
};
