create table if not exists streaks (
  slug text primary key,
  count integer not null default 0,
  longest integer not null default 0,
  last_check_date date,
  longest_start_date date,
  longest_end_date date,
  timezone text not null default 'America/Chicago',
  description text not null default ''
);

-- No RLS policies: this table is only ever accessed via the service-role key
-- from server-side code (Server Actions / Server Components), never from
-- the browser. Row Level Security stays on with zero policies, which
-- denies all access except the service role (which bypasses RLS entirely).
alter table streaks enable row level security;

-- Single-row table holding the site-wide password hash (see src/lib/auth.ts)
-- and the optional site-wide description shown on the home page. No
-- password is set on a fresh install; the app prompts for first-run setup.
create table if not exists app_settings (
  id smallint primary key default 1,
  password_hash text,
  password_salt text,
  site_description text not null default '',
  constraint app_settings_singleton check (id = 1)
);

insert into app_settings (id) values (1) on conflict (id) do nothing;

alter table app_settings enable row level security;
