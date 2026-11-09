create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 160),
  description text not null default '',
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date date,
  is_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_user_created_at_idx
  on public.tasks (user_id, created_at desc);

alter table public.tasks enable row level security;

create policy "tasks_select_own"
  on public.tasks for select
  using ((select auth.uid()) = user_id);

create policy "tasks_insert_own"
  on public.tasks for insert
  with check ((select auth.uid()) = user_id);

create policy "tasks_update_own"
  on public.tasks for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "tasks_delete_own"
  on public.tasks for delete
  using ((select auth.uid()) = user_id);
