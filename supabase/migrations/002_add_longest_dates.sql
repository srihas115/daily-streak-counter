-- Run this in the Supabase SQL Editor if your `streaks` table already
-- exists from before longest-streak date tracking was added.
alter table streaks add column if not exists longest_start_date date;
alter table streaks add column if not exists longest_end_date date;
