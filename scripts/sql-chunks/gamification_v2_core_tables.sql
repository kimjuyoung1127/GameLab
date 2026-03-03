begin;

create table if not exists public.sst_missions (
  id text primary key,
  scope text not null check (scope in ('daily','weekly')),
  title text not null,
  description text not null,
  target_type text not null check (target_type in ('confirm_count','fix_count','review_count','session_complete','streak_days','score_gain')),
  target_value integer not null,
  reward_points integer not null default 0,
  reward_badge text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.sst_user_mission_progress (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.sst_users(id) on delete cascade,
  mission_id text not null references public.sst_missions(id) on delete cascade,
  period_key text not null,
  progress integer not null default 0,
  completed_at timestamptz,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, mission_id, period_key)
);

create table if not exists public.sst_reward_events (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.sst_users(id) on delete cascade,
  event_type text not null check (event_type in ('score','mission_completed','mission_claimed','achievement_unlocked','streak')),
  ref_type text,
  ref_id text,
  points integer not null default 0,
  message text not null,
  occurred_at timestamptz not null default now()
);

create index if not exists idx_sst_reward_events_user_occurred_at on public.sst_reward_events(user_id, occurred_at desc);

alter table public.sst_suggestions
  add column if not exists reward_granted_at timestamptz,
  add column if not exists reward_points integer not null default 0;

insert into public.sst_missions (id, scope, title, description, target_type, target_value, reward_points, sort_order)
values
  ('daily-review-20', 'daily', 'Daily Review 20', 'Review 20 suggestions in a day', 'review_count', 20, 50, 1),
  ('daily-confirm-10', 'daily', 'Daily Confirm 10', 'Confirm 10 suggestions in a day', 'confirm_count', 10, 40, 2),
  ('daily-fix-5', 'daily', 'Daily Fix 5', 'Apply 5 fixes in a day', 'fix_count', 5, 60, 3),
  ('weekly-review-120', 'weekly', 'Weekly Review 120', 'Review 120 suggestions in a week', 'review_count', 120, 300, 1),
  ('weekly-confirm-80', 'weekly', 'Weekly Confirm 80', 'Confirm 80 suggestions in a week', 'confirm_count', 80, 250, 2),
  ('weekly-fix-30', 'weekly', 'Weekly Fix 30', 'Apply 30 fixes in a week', 'fix_count', 30, 350, 3)
on conflict (id) do nothing;

commit;
