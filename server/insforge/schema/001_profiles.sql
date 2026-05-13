-- 001_profiles.sql
-- 擴展用戶檔案表，與 auth.users 一對一

create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text,
  avatar_url text,
  timezone text default 'Asia/Taipei',
  language text default 'zh-TW' check (language in ('zh-TW', 'zh-CN')),
  theme_preference text default 'system' check (theme_preference in ('dark', 'light', 'system')),
  privacy_enabled boolean default false,
  notification_settings jsonb default '{}',
  onboarding_completed boolean default false,
  user_role text default 'parent',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.profile->>'name',
      new.metadata->>'displayName',
      new.metadata->>'display_name',
      new.email
    )
  )
  on conflict (id) do update set
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
