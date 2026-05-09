-- ================================================================
-- House of Nuptials — Supabase Database Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ================================================================

-- ── PROFILES TABLE ───────────────────────────────────────────────
-- Extends the built-in auth.users table with wedding-specific data
create table if not exists public.profiles (
  id              uuid references auth.users(id) on delete cascade primary key,
  first_name      text,
  wedding_date    date,
  planning_style  text,
  budget_total    numeric default 20000,
  is_premium      boolean default false,
  stripe_customer_id text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Auto-create profile row when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, first_name, wedding_date, planning_style, budget_total, is_premium)
  values (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    (new.raw_user_meta_data ->> 'wedding_date')::date,
    new.raw_user_meta_data ->> 'planning_style',
    coalesce((new.raw_user_meta_data ->> 'budget_total')::numeric, 20000),
    false
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── TASKS TABLE ──────────────────────────────────────────────────
create table if not exists public.tasks (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references auth.users(id) on delete cascade not null,
  phase_number  integer not null,
  phase_title   text not null,
  title         text not null,
  is_completed  boolean default false,
  completed_at  timestamptz,
  sort_order    integer default 0,
  created_at    timestamptz default now()
);

create index if not exists tasks_user_id_idx on public.tasks(user_id);
create index if not exists tasks_phase_idx on public.tasks(user_id, phase_number);

-- ── BUDGET CATEGORIES TABLE ──────────────────────────────────────
create table if not exists public.budget_categories (
  id             uuid default gen_random_uuid() primary key,
  user_id        uuid references auth.users(id) on delete cascade not null,
  name           text not null,
  icon           text default '📋',
  budget_amount  numeric default 0,
  spent_amount   numeric default 0,
  percentage     numeric default 0,
  sort_order     integer default 0,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

create index if not exists budget_categories_user_id_idx on public.budget_categories(user_id);

-- ── SUPPLIERS TABLE ──────────────────────────────────────────────
create table if not exists public.suppliers (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  category    text not null,
  icon        text default '📋',
  status      text default 'todo' check (status in ('todo','researching','booked')),
  notes       text,
  website     text,
  phone       text,
  email       text,
  price       numeric,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists suppliers_user_id_idx on public.suppliers(user_id);
create index if not exists suppliers_status_idx on public.suppliers(user_id, status);

-- ── ROW LEVEL SECURITY ───────────────────────────────────────────
-- Users can only see and edit their own data

alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.budget_categories enable row level security;
alter table public.suppliers enable row level security;

-- Profiles
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Tasks
create policy "Users can view own tasks"
  on public.tasks for select using (auth.uid() = user_id);
create policy "Users can insert own tasks"
  on public.tasks for insert with check (auth.uid() = user_id);
create policy "Users can update own tasks"
  on public.tasks for update using (auth.uid() = user_id);
create policy "Users can delete own tasks"
  on public.tasks for delete using (auth.uid() = user_id);

-- Budget Categories
create policy "Users can view own budget categories"
  on public.budget_categories for select using (auth.uid() = user_id);
create policy "Users can insert own budget categories"
  on public.budget_categories for insert with check (auth.uid() = user_id);
create policy "Users can update own budget categories"
  on public.budget_categories for update using (auth.uid() = user_id);
create policy "Users can delete own budget categories"
  on public.budget_categories for delete using (auth.uid() = user_id);

-- Suppliers
create policy "Users can view own suppliers"
  on public.suppliers for select using (auth.uid() = user_id);
create policy "Users can insert own suppliers"
  on public.suppliers for insert with check (auth.uid() = user_id);
create policy "Users can update own suppliers"
  on public.suppliers for update using (auth.uid() = user_id);
create policy "Users can delete own suppliers"
  on public.suppliers for delete using (auth.uid() = user_id);

-- ── STRIPE WEBHOOK HELPER ────────────────────────────────────────
-- This function is called by the Stripe webhook Edge Function
-- to upgrade a user to Premium after successful payment
create or replace function public.set_user_premium(user_email text, customer_id text)
returns void as $$
begin
  update public.profiles
  set is_premium = true, stripe_customer_id = customer_id, updated_at = now()
  where id = (select id from auth.users where email = user_email limit 1);
end;
$$ language plpgsql security definer;
