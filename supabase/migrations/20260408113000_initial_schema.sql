create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  role text not null default 'hr' check (role in ('hr')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name text not null,
  email text,
  phone text not null,
  role text not null,
  joining_date date not null,
  status text not null check (status in ('active', 'not_joined', 'left')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id) on delete cascade default auth.uid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  attendance_date date not null default current_date,
  login_time timestamptz not null,
  logout_time timestamptz,
  total_hours numeric(6, 2),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.candidates (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name text not null,
  phone text not null,
  position text not null,
  call_status text not null check (call_status in ('interested', 'not_interested', 'follow_up')),
  response text,
  expected_joining_date date,
  final_status text not null default 'pending' check (final_status in ('joined', 'not_joined', 'pending')),
  call_date date not null default current_date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id) on delete cascade default auth.uid(),
  title text not null,
  description text,
  status text not null default 'pending' check (status in ('pending', 'completed')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  deadline date,
  completed_at date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.leaves (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id) on delete cascade default auth.uid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  date date not null,
  reason text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id) on delete cascade default auth.uid(),
  title text not null,
  content text not null,
  kind text not null check (kind in ('daily_note', 'self_task')),
  note_date date not null default current_date,
  status text not null default 'open' check (status in ('open', 'done')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id) on delete cascade default auth.uid(),
  date date not null,
  summary_json jsonb not null,
  pdf_url text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists employees_created_by_idx on public.employees (created_by);
create index if not exists attendance_created_by_idx on public.attendance (created_by, attendance_date desc);
create index if not exists candidates_created_by_idx on public.candidates (created_by, call_date desc);
create index if not exists tasks_created_by_idx on public.tasks (created_by, status);
create index if not exists leaves_created_by_idx on public.leaves (created_by, date desc);
create index if not exists notes_created_by_idx on public.notes (created_by, note_date desc);
create index if not exists reports_created_by_idx on public.reports (created_by, date desc);

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, role)
  values (new.id, coalesce(new.email, ''), new.raw_user_meta_data ->> 'full_name', 'hr')
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.users.full_name),
        updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

drop trigger if exists users_handle_updated_at on public.users;
create trigger users_handle_updated_at before update on public.users
for each row execute procedure public.handle_updated_at();

drop trigger if exists employees_handle_updated_at on public.employees;
create trigger employees_handle_updated_at before update on public.employees
for each row execute procedure public.handle_updated_at();

drop trigger if exists attendance_handle_updated_at on public.attendance;
create trigger attendance_handle_updated_at before update on public.attendance
for each row execute procedure public.handle_updated_at();

drop trigger if exists candidates_handle_updated_at on public.candidates;
create trigger candidates_handle_updated_at before update on public.candidates
for each row execute procedure public.handle_updated_at();

drop trigger if exists tasks_handle_updated_at on public.tasks;
create trigger tasks_handle_updated_at before update on public.tasks
for each row execute procedure public.handle_updated_at();

drop trigger if exists leaves_handle_updated_at on public.leaves;
create trigger leaves_handle_updated_at before update on public.leaves
for each row execute procedure public.handle_updated_at();

drop trigger if exists notes_handle_updated_at on public.notes;
create trigger notes_handle_updated_at before update on public.notes
for each row execute procedure public.handle_updated_at();

drop trigger if exists reports_handle_updated_at on public.reports;
create trigger reports_handle_updated_at before update on public.reports
for each row execute procedure public.handle_updated_at();

alter table public.users enable row level security;
alter table public.employees enable row level security;
alter table public.attendance enable row level security;
alter table public.candidates enable row level security;
alter table public.tasks enable row level security;
alter table public.leaves enable row level security;
alter table public.notes enable row level security;
alter table public.reports enable row level security;

drop policy if exists "users own row" on public.users;
create policy "users own row"
on public.users
for all
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "employees own data" on public.employees;
create policy "employees own data"
on public.employees
for all
using (auth.uid() = created_by)
with check (auth.uid() = created_by);

drop policy if exists "attendance own data" on public.attendance;
create policy "attendance own data"
on public.attendance
for all
using (auth.uid() = created_by)
with check (auth.uid() = created_by);

drop policy if exists "candidates own data" on public.candidates;
create policy "candidates own data"
on public.candidates
for all
using (auth.uid() = created_by)
with check (auth.uid() = created_by);

drop policy if exists "tasks own data" on public.tasks;
create policy "tasks own data"
on public.tasks
for all
using (auth.uid() = created_by)
with check (auth.uid() = created_by);

drop policy if exists "leaves own data" on public.leaves;
create policy "leaves own data"
on public.leaves
for all
using (auth.uid() = created_by)
with check (auth.uid() = created_by);

drop policy if exists "notes own data" on public.notes;
create policy "notes own data"
on public.notes
for all
using (auth.uid() = created_by)
with check (auth.uid() = created_by);

drop policy if exists "reports own data" on public.reports;
create policy "reports own data"
on public.reports
for all
using (auth.uid() = created_by)
with check (auth.uid() = created_by);

insert into storage.buckets (id, name, public)
values ('daily-reports', 'daily-reports', false)
on conflict (id) do nothing;

drop policy if exists "authenticated upload reports" on storage.objects;
create policy "authenticated upload reports"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'daily-reports'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "authenticated read reports" on storage.objects;
create policy "authenticated read reports"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'daily-reports'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "authenticated update reports" on storage.objects;
create policy "authenticated update reports"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'daily-reports'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'daily-reports'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "authenticated delete reports" on storage.objects;
create policy "authenticated delete reports"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'daily-reports'
  and auth.uid()::text = (storage.foldername(name))[1]
);
