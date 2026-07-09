-- Run this in the Supabase SQL Editor if your database already exists from
-- before password auth and dstreak descriptions were added.

create table if not exists app_settings (
  id smallint primary key default 1,
  password_hash text,
  password_salt text,
  site_description text not null default '',
  constraint app_settings_singleton check (id = 1)
);

insert into app_settings (id) values (1) on conflict (id) do nothing;

-- Same trust model as `streaks`: service-role only, no policies needed.
alter table app_settings enable row level security;

alter table streaks add column if not exists description text not null default '';
