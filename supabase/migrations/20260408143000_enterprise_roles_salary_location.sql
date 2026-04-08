alter table public.users
  drop constraint if exists users_role_check;

alter table public.users
  alter column role drop default,
  alter column role type text,
  alter column role set default 'employee';

alter table public.users
  add constraint users_role_check check (role in ('hr', 'employee'));

alter table public.employees
  add column if not exists user_id uuid references auth.users (id) on delete set null,
  add column if not exists salary numeric(12,2) not null default 0,
  add column if not exists department text not null default 'General',
  add column if not exists profile_photo_url text;

alter table public.attendance
  add column if not exists latitude numeric(10,7),
  add column if not exists longitude numeric(10,7),
  add column if not exists address text;

alter table public.tasks
  add column if not exists assigned_to uuid references public.employees (id) on delete set null,
  add column if not exists completion_notes text;

alter table public.leaves
  add column if not exists status text not null default 'pending' check (status in ('pending', 'approved', 'rejected'));

create table if not exists public.salaries (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id) on delete cascade default auth.uid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  amount numeric(12,2) not null,
  bonus numeric(12,2) not null default 0,
  deduction numeric(12,2) not null default 0,
  month date not null,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid')),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists employees_user_id_idx on public.employees (user_id);
create index if not exists salaries_created_by_idx on public.salaries (created_by, month desc);
create index if not exists attendance_location_idx on public.attendance (attendance_date, employee_id);

alter table public.salaries enable row level security;

drop trigger if exists salaries_handle_updated_at on public.salaries;
create trigger salaries_handle_updated_at before update on public.salaries
for each row execute procedure public.handle_updated_at();

drop policy if exists "salaries own data" on public.salaries;
create policy "salaries own data"
on public.salaries
for all
using (auth.uid() = created_by)
with check (auth.uid() = created_by);
