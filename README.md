# daily-streak-counter (Next.js + Supabase + Vercel)

A tiny, self-hosted streak tracker you can embed in Notion. Each streak
lives at its own path — visit `/morning` or `/night`, tap the checkmark
once a day, and it tracks your current streak, your longest streak, and
your next milestone. This app calls each of those paths a **dstreak**
(short for "daily streak") — `/morning` is "the morning dstreak."

Anyone with your deployment's link can **view** your dstreaks — that's the
point, it's meant to be shareable. Only **you** can check them in: a single
password, set up once, gates every check-in and every settings change.
Nobody can see or brute-force it from the browser — see
[How the password is protected](#how-the-password-is-protected) below.

> This is the Next.js/Supabase/Vercel version of the app. There's also a
> Cloudflare Workers version on the `cloudflare-worker` branch, if you'd
> rather use that stack instead.

## Running your own copy

This project is designed to be forked and self-hosted — anyone can click
**Use this template** (or just fork it) on GitHub, follow the steps below,
and end up with their own fully independent deployment: their own Vercel
project, their own Supabase database, their own password. There's no shared
backend, so your dstreaks and someone else's are never in the same database
and never share a password, without either of you writing a single line of
auth code.

This app is a **Next.js 15** app that stores data in **Supabase** (a free
hosted Postgres database) and deploys to **Vercel** (free hosting for
Next.js apps).

## 1. Create a free Supabase project

1. Go to [supabase.com](https://supabase.com) and sign up (free tier, no
   credit card required).
2. Click **New project**, give it any name, pick a region close to you, and
   set a database password (you won't need to remember it — Supabase
   manages the connection for you).
3. Once the project is ready, open the **SQL Editor** in the left sidebar.
4. Paste the contents of [supabase/schema.sql](supabase/schema.sql) and run
   it. This creates the `streaks` table (one row per dstreak) and the
   `app_settings` table (your password hash and site description).
5. Go to **Project Settings → API**. You'll need two values from this page
   in step 3 below:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **service_role key** (under "Project API keys" — click to reveal it).
     This key has full database access, so never put it in frontend code or
     commit it to git — it's only used server-side in this app.

## 2. Install dependencies and run locally (optional, to test first)

1. Install [Node.js](https://nodejs.org) (LTS version) if you don't have
   it — check with `node -v`.
2. In this project folder:
   ```
   npm install
   ```
3. Copy the example env file and fill in your values:
   ```
   cp .env.example .env.local
   ```
   Edit `.env.local` and paste in your `SUPABASE_URL` and
   `SUPABASE_SERVICE_ROLE_KEY` from step 1.5, and generate a
   `SESSION_SECRET` (see the comment in `.env.example` — it's what signs
   your login cookie, and is required).
4. Run the dev server:
   ```
   npm run dev
   ```
5. Visit `http://localhost:3000` — since no password is set yet, you'll see
   a first-run "Set up your password" prompt (see below). Then visit
   `http://localhost:3000/morning` — you should see a `0`, a check-in
   button, "Next goal", and "Longest streak".

## 3. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up free (you can sign up
   with your GitHub account).
2. Click **Add New → Project**, and import this GitHub repository
   (`daily-streak-counter`), selecting the `main` branch.
3. In the **Environment Variables** section of the import screen, add:
   - `SUPABASE_URL` = your Project URL from step 1.5
   - `SUPABASE_SERVICE_ROLE_KEY` = your service_role key from step 1.5
   - `SESSION_SECRET` = a random string, e.g. from `openssl rand -hex 32`
4. Click **Deploy**. After a minute or two, Vercel gives you a live URL like
   `https://daily-streak-counter-yourname.vercel.app`.
5. **Visit that URL immediately** and set your password (see below) before
   sharing the link with anyone — until a password is set, the home page's
   first-run setup screen is open to whoever gets there first.

## 4. Set your password (first-run setup)

The first time anyone visits your home page (`/`) with no password
configured yet, they see a **"Set up your password"** form right there —
no separate admin page, no env var to fill in ahead of time. Enter and
confirm a password; the page logs you in immediately.

From then on, `/` shows a choice instead: **Enter Password** (log in) or
**Continue as Viewer** (browse the public dstreak list without checking
anything in).

### How the password is protected

- Your password is never stored in plain text. It's hashed with Node's
  built-in `scrypt` (a memory-hard, salted hash — the same category of
  algorithm bcrypt/Argon2 use, purpose-built to resist brute-forcing, unlike
  the "plaintext in a `.txt` file" approach). Only the hash and a random
  salt are stored, in the `app_settings` table.
- Logging in doesn't put the password in the URL or expose it in the
  Network tab as a reusable secret: the server verifies it and, on success,
  sets a **signed, `httpOnly` session cookie** — JavaScript in the page
  can't read it (so it can't be scraped via the browser console), and it
  isn't visible in DevTools' Network tab as anything but an opaque cookie
  value. The cookie is valid for a year, which is what makes a Notion embed
  "stay logged in" after you enter your password in it once.
- Change or reset your password any time from **Settings** on the home page
  (gear icon, only visible once you're logged in) — no redeploy needed,
  since it's stored in Supabase, not an environment variable.

## 5. Test it in a browser

Visit your Vercel URL, log in, and confirm the home page shows your dstreak
table. Then visit `/morning`. If you're logged in, tap the check-in
button — confirm the number animates, a soft ding plays, and the button
grays out to "Done for today". Open the same URL in a private/incognito
window (no login) — confirm you can see the streak count but the check-in
button shows 🔒 and asks for your password before it lets you check in.

## 6. Embed in Notion

1. On any Notion page, type `/embed`, press Enter.
2. Paste your dstreak URL, e.g.
   `https://daily-streak-counter-yourname.vercel.app/morning`.
3. Resize the embed block by dragging its edges.
4. The first time, tap the locked check-in button and enter your password
   right there, inline — it checks you in and logs that embed in for a
   year, so you won't be asked again.

## 7. Add a second, separate dstreak

No redeploy needed — every path is its own row in the `streaks` table,
created automatically the first time you check in. Just embed a different
path, e.g. `/night`, `/gym`, `/reading`. It'll also show up automatically
in the home page table.

## The home page

Visiting `/` shows every dstreak that's been created, in a simple table:
name, short description, current streak, whether it's checked in today,
next goal, and longest streak. This table is **public** — the whole point
is you can share your `*.vercel.app` link and let people see your streaks,
they just can't check any of them in without your password. It's a plain
spreadsheet-style table for now; styling it further is a "later" project.

## Descriptions

There are two different description fields:
- **Site description** (Settings on the home page) — one blurb shown once
  under the home page title. Leave it empty to hide it entirely.
- **Per-dstreak description** (Settings gear on each `/streak-name` page,
  next to the time zone selector) — a short line shown as a column in the
  home page table for that specific dstreak.

## Light / dark mode

Settings on the home page (gear icon, logged-in only) has a theme toggle:
System (follows your OS/browser setting, the default), Light, or Dark. Your
choice is saved in a cookie and applies across every dstreak page too.

## 8. (Optional) Add a second layer: hide the deployment URL itself

The password login protects check-ins and settings, but the dstreak list
and each dstreak's numbers are intentionally public if someone has the
link. If you'd rather your `*.vercel.app` URL not respond to strangers at
all (e.g. to keep it out of search engines / random bots), you can add an
extra, independent gate on top:

1. Generate a random secret, e.g. `openssl rand -hex 16`.
2. In Vercel, go to **Settings → Environment Variables** and add:
   - `ACCESS_KEY` = the random string you generated
3. Redeploy (Deployments → ⋯ → Redeploy).
4. From now on, every URL needs `?key=your-secret` appended, e.g.:
   ```
   https://daily-streak-counter-yourname.vercel.app/morning?key=your-secret
   ```
   Without the correct `key`, visitors get a plain "Not authorized" page
   instead of anything else — this check happens before the password login
   even loads.

Leave `ACCESS_KEY` unset if you're fine with the dstreak list being
publicly reachable (just not checkable-in) — the app works exactly the same
either way.

## Troubleshooting

- **Blank page / 500 error on Vercel** — almost always missing or wrong
  environment variables. Go to your Vercel project → Settings →
  Environment Variables and double check `SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY`, and `SESSION_SECRET` are all set, then
  redeploy.
- **"Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" error locally** —
  you forgot to create `.env.local` (step 2.3), or it's missing a value.
- **"Missing SESSION_SECRET environment variable"** — same idea; add a
  random string to `SESSION_SECRET` in `.env.local` or your Vercel env vars.
- **Notion embed shows blank** — test the URL directly in a browser first
  (step 5). If that works but Notion doesn't, remove and re-add the embed
  block.
- **"Not authorized" page** — you set an `ACCESS_KEY` (step 8) but the URL
  you're visiting is missing `?key=...` or has the wrong value. Double
  check the URL matches exactly, including in your Notion embed.
- **Getting asked for the password again after it worked once** — your
  browser or Notion may be clearing cookies, or you're on `http://` in dev
  where the session cookie is intentionally looser (this doesn't happen on
  the real HTTPS Vercel deployment).
- **Streak resets when you didn't expect it to** — the app resets a
  dstreak's streak to 0 if a full calendar day passes with no check-in, in
  *that dstreak's own* time zone (set per-dstreak in its Settings gear,
  default America/Chicago). Time zones are IANA names (e.g.
  `America/Chicago`, `Asia/Kolkata`) which already bake in daylight saving
  rules, so DST is handled automatically — no separate DST logic needed or
  planned.
