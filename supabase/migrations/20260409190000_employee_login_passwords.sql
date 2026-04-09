alter table public.employees
  add column if not exists password_hash text;

create index if not exists employees_login_email_idx
  on public.employees (lower(email))
  where email is not null;
