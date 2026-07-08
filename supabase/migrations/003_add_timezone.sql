-- Run this in the Supabase SQL Editor if your `streaks` table already
-- exists from before per-streak timezones were added.
alter table streaks add column if not exists timezone text not null default 'America/Chicago';
