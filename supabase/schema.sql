-- Goal Tracker Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Org settings table (singleton for now)
create table public.org_settings (
  id uuid default uuid_generate_v4() primary key,
  fiscal_year_start_month integer not null default 2 check (fiscal_year_start_month >= 1 and fiscal_year_start_month <= 12),
  checkin_cadence_days integer not null default 7 check (checkin_cadence_days >= 1),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Goals table
create table public.goals (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  owner_id uuid references public.users(id) on delete cascade not null,
  goal_type text not null check (goal_type in ('org', 'team', 'individual')),
  metric_name text not null,
  metric_target numeric not null check (metric_target > 0),
  metric_current numeric not null default 0,
  year integer not null,
  quarter integer not null check (quarter >= 1 and quarter <= 4),
  is_locked boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Updates table (check-ins)
create table public.updates (
  id uuid default uuid_generate_v4() primary key,
  goal_id uuid references public.goals(id) on delete cascade not null,
  metric_value numeric not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for better query performance
create index goals_owner_id_idx on public.goals(owner_id);
create index goals_year_quarter_idx on public.goals(year, quarter);
create index updates_goal_id_idx on public.updates(goal_id);
create index updates_created_at_idx on public.updates(created_at);

-- Enable Row Level Security
alter table public.users enable row level security;
alter table public.org_settings enable row level security;
alter table public.goals enable row level security;
alter table public.updates enable row level security;

-- RLS Policies

-- Users: Everyone can read all users, users can only update their own profile
create policy "Users are viewable by authenticated users" on public.users
  for select using (auth.role() = 'authenticated');

create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

-- Org settings: Everyone can read, only admins can update
create policy "Org settings are viewable by authenticated users" on public.org_settings
  for select using (auth.role() = 'authenticated');

create policy "Admins can update org settings" on public.org_settings
  for update using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'admin'
    )
  );

create policy "Admins can insert org settings" on public.org_settings
  for insert with check (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'admin'
    )
  );

-- Goals: Everyone can read all goals, users can manage their own goals (if not locked)
create policy "Goals are viewable by authenticated users" on public.goals
  for select using (auth.role() = 'authenticated');

create policy "Users can create goals" on public.goals
  for insert with check (auth.uid() = owner_id);

create policy "Users can update own unlocked goals" on public.goals
  for update using (auth.uid() = owner_id and not is_locked);

create policy "Admins can update any goal" on public.goals
  for update using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'admin'
    )
  );

create policy "Users can delete own unlocked goals" on public.goals
  for delete using (auth.uid() = owner_id and not is_locked);

-- Updates: Everyone can read, users can add updates to their own goals
create policy "Updates are viewable by authenticated users" on public.updates
  for select using (auth.role() = 'authenticated');

create policy "Users can create updates for own goals" on public.updates
  for insert with check (
    exists (
      select 1 from public.goals
      where goals.id = goal_id and goals.owner_id = auth.uid()
    )
  );

-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    case
      when (select count(*) from public.users) = 0 then 'admin'
      else 'member'
    end
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to auto-create user profile on signup
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update metric_current when a new update is added
create or replace function public.update_goal_metric()
returns trigger as $$
begin
  update public.goals
  set metric_current = new.metric_value,
      updated_at = now()
  where id = new.goal_id;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to update goal metric on new check-in
create or replace trigger on_update_created
  after insert on public.updates
  for each row execute procedure public.update_goal_metric();

-- Insert default org settings
insert into public.org_settings (fiscal_year_start_month, checkin_cadence_days)
values (2, 7);
