create table if not exists streaks (
  slug text primary key,
  count integer not null default 0,
  longest integer not null default 0,
  last_check_date date,
  longest_start_date date,
  longest_end_date date,
  timezone text not null default 'America/Chicago'
);

-- No RLS policies: this table is only ever accessed via the service-role key
-- from server-side code (Server Actions / Server Components), never from
-- the browser. Row Level Security stays on with zero policies, which
-- denies all access except the service role (which bypasses RLS entirely).
alter table streaks enable row level security;
