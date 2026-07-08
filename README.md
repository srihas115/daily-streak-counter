# daily-streak-counter

A tiny, self-hosted streak tracker you can embed in Notion. Visit a URL like
`/morning` or `/night`, tap the checkmark once a day, and it tracks your
current streak, your longest streak, and your next milestone. Each path is
its own independent counter — no login, no settings, nothing fancy.

This app runs as a single **Cloudflare Worker** (a small script that runs on
Cloudflare's servers) and stores data in **Workers KV** (a simple free
key-value database). Both are free for personal use at this scale.

The instructions below assume you've never used a terminal for this kind of
thing before. Follow the numbered steps in order.

## 1. Install Node.js (if you don't have it)

Node.js is the JavaScript runtime the deploy tool needs to run on your
computer — you won't write any Node code yourself.

1. Open a terminal (Terminal.app on Mac, or Command Prompt/PowerShell on
   Windows).
2. Check if you already have it:
   ```
   node -v
   ```
   If you see something like `v18.18.0` or higher, skip to step 2.
3. If you get a "command not found" error, download and install Node.js from
   [nodejs.org](https://nodejs.org) — pick the "LTS" version, run the
   installer, then restart your terminal and re-run `node -v` to confirm.

## 2. Create a free Cloudflare account

Cloudflare is the company whose servers will host this app for free.

1. Go to [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)
   and create a free account (email + password is enough — no credit card
   required for this).

## 3. Install Wrangler and log in

Wrangler is Cloudflare's command-line tool for deploying Workers.

1. In your terminal, navigate to this project folder, e.g.:
   ```
   cd path/to/daily-streak-counter
   ```
2. Install Wrangler:
   ```
   npm install -g wrangler
   ```
3. Log in to your Cloudflare account (this opens a browser window to
   authorize):
   ```
   wrangler login
   ```
   Click "Allow" in the browser tab that opens, then return to your
   terminal.

## 4. Create the KV namespace

A "namespace" here just means a labeled storage bucket for this app's data.

1. Run:
   ```
   wrangler kv namespace create STREAKS
   ```
2. Wrangler will print something like:
   ```
   { binding = "STREAKS", id = "abcd1234ef567890" }
   ```
3. Open `wrangler.toml` in this folder in any text editor. Find this line:
   ```
   { binding = "STREAKS", id = "REPLACE_WITH_YOUR_KV_NAMESPACE_ID" }
   ```
4. Replace `REPLACE_WITH_YOUR_KV_NAMESPACE_ID` with the `id` value Wrangler
   printed (keep the quotes), then save the file.

## 5. Deploy

1. Run:
   ```
   wrangler deploy
   ```
2. When it finishes, you'll see output ending with a URL, something like:
   ```
   https://daily-streak-counter.YOUR-SUBDOMAIN.workers.dev
   ```
   That's your app's base URL. Save it somewhere — you'll use it in the next
   steps.

## 6. Test it in a browser

1. Open your base URL in a browser and add a streak name to the end, e.g.:
   ```
   https://daily-streak-counter.YOUR-SUBDOMAIN.workers.dev/morning
   ```
2. You should see a big `0`, a "Check in ✓" button, and text for "Next goal"
   and "Longest streak". Tap the button — the number should animate to `1`
   and the button should gray out to "Done for today".
3. Reload the page — it should still show `1` and stay disabled (it only
   allows one check-in per day, in the America/Chicago timezone).

## 7. Embed it in Notion

1. In any Notion page, type `/embed` and select the **Embed** block type.
2. Paste your streak's full URL, including the path, e.g.:
   ```
   https://daily-streak-counter.YOUR-SUBDOMAIN.workers.dev/morning
   ```
3. Press Enter/"Embed link". Notion will render the page inside your
   document.
4. Drag the corner/edge handles of the embed block to resize it to a
   comfortable size — the page is designed to look fine both narrow (mobile)
   and wide (desktop).

## 8. Add a second, separate streak (e.g. "night")

No redeploy needed — every path is automatically its own independent
counter.

1. Repeat step 7, but use a different path, e.g.:
   ```
   https://daily-streak-counter.YOUR-SUBDOMAIN.workers.dev/night
   ```
2. This creates a brand-new streak with its own count, completely unrelated
   to `/morning`. Repeat for as many streaks as you want (`/reading`,
   `/gym`, etc.).

## Troubleshooting

- **Deploy fails or data doesn't seem to save** — double check the `id` in
  `wrangler.toml` under `kv_namespaces` exactly matches the `id` Wrangler
  printed in step 4. A typo here is the most common issue.
- **"Not logged in" or authorization errors when running `wrangler deploy`**
  — run `wrangler login` again (step 3) and make sure you clicked "Allow" in
  the browser tab.
- **Notion embed shows blank / won't load** — make sure you're pasting the
  full `https://...workers.dev/yourstreakname` URL (not just the bare
  domain), and that you tested it directly in a browser first (step 6). If
  the browser tab shows the page fine but Notion doesn't, try removing and
  re-adding the embed block.
- **Streak resets when you didn't expect it to** — the app resets your
  streak to 0 if a full calendar day (America/Chicago time) passes with no
  check-in. If you check in very late at night or very early in the
  morning, the "day" boundary is midnight Central Time, not your local
  time.
