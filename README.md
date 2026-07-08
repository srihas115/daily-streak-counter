# daily-streak-counter (Next.js + Supabase + Vercel)

A tiny, self-hosted streak tracker you can embed in Notion. Visit a URL like
`/morning` or `/night`, tap the checkmark once a day, and it tracks your
current streak, your longest streak, and your next milestone. Each path is
its own independent counter — no login, no settings, nothing fancy.

> This is the Next.js/Supabase/Vercel version of the app. There's also a
> Cloudflare Workers version on the `cloudflare-worker` branch, if you'd
> rather use that stack instead.

## Running your own copy

This project is designed to be forked and self-hosted — anyone can click
**Use this template** (or just fork it) on GitHub, follow the steps below,
and end up with their own fully independent deployment: their own Vercel
project, their own Supabase database. There's no shared backend, so your
streaks and someone else's streaks are never in the same database and
can't be seen by each other, without either of you writing a single line
of auth code.

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
   it. This creates the `streaks` table used to store your counters.
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
3. Copy the example env file and fill in your Supabase values from step 1.5:
   ```
   cp .env.example .env.local
   ```
   Edit `.env.local` and paste in your `SUPABASE_URL` and
   `SUPABASE_SERVICE_ROLE_KEY`.
4. Run the dev server:
   ```
   npm run dev
   ```
5. Visit `http://localhost:3000/morning` — you should see a `0`, a check-in
   button, "Next goal", and "Longest streak".

## 3. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up free (you can sign up
   with your GitHub account).
2. Click **Add New → Project**, and import this GitHub repository
   (`daily-streak-counter`), selecting the `main` branch.
3. In the **Environment Variables** section of the import screen, add:
   - `SUPABASE_URL` = your Project URL from step 1.5
   - `SUPABASE_SERVICE_ROLE_KEY` = your service_role key from step 1.5
4. Click **Deploy**. After a minute or two, Vercel gives you a live URL like
   `https://daily-streak-counter-yourname.vercel.app`.

## 4. (Optional) Keep your instance private

By default, anyone who finds your `*.vercel.app` URL can view and check in
on any streak path. This isn't a real account system — it's a single
shared secret baked into the URL, which is enough to keep casual visitors
and search engines out without making you log in every time.

1. Generate a random secret, e.g. run `openssl rand -hex 16` in a terminal
   (any long random string works).
2. In Vercel, go to **Settings → Environment Variables** and add:
   - `ACCESS_KEY` = the random string you generated
3. Redeploy (Deployments → ⋯ → Redeploy).
4. From now on, every URL — including the one you put in Notion — needs
   `?key=your-secret` appended, e.g.:
   ```
   https://daily-streak-counter-yourname.vercel.app/morning?key=your-secret
   ```
   Without the correct `key`, visitors get a plain "Not authorized" page
   instead of your streak data.

Leave `ACCESS_KEY` unset if you don't need this — the app works exactly
the same either way, just open to anyone with the link.

## 5. Test it in a browser

Visit `https://daily-streak-counter-yourname.vercel.app/morning` (add
`?key=your-secret` at the end if you set one up in step 4). Tap the
check-in button — confirm the number animates and the button grays out to
"Done for today". Reload to confirm it stays checked in.

## 6. Embed in Notion

1. On any Notion page, type `/embed`, press Enter.
2. Paste your full streak URL, e.g.
   `https://daily-streak-counter-yourname.vercel.app/morning` (append
   `?key=your-secret` if you set that up).
3. Resize the embed block by dragging its edges.

## 7. Add a second, separate streak

No redeploy needed — every path is its own row in the `streaks` table,
created automatically the first time you check in. Just embed a different
path, e.g. `/night`, `/gym`, `/reading`.

## Troubleshooting

- **Blank page / 500 error on Vercel** — almost always missing or wrong
  environment variables. Go to your Vercel project → Settings →
  Environment Variables and double check `SUPABASE_URL` and
  `SUPABASE_SERVICE_ROLE_KEY` are set exactly as shown in Supabase's API
  settings page, then redeploy.
- **"Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" error locally** —
  you forgot to create `.env.local` (step 2.3), or it's missing a value.
- **Notion embed shows blank** — test the URL directly in a browser first
  (step 5). If that works but Notion doesn't, remove and re-add the embed
  block.
- **"Not authorized" page** — you set an `ACCESS_KEY` (step 4) but the URL
  you're visiting is missing `?key=...` or has the wrong value. Double
  check the URL matches exactly, including in your Notion embed.
- **Streak resets when you didn't expect it to** — the app resets your
  streak to 0 if a full calendar day (America/Chicago time) passes with no
  check-in. The "day" boundary is midnight Central Time, not your local
  time.
