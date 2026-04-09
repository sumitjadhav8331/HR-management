create or replace function public.is_hr()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'hr'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_role text;
begin
  assigned_role := case
    when new.raw_user_meta_data ->> 'role' = 'hr' then 'hr'
    when new.raw_user_meta_data ->> 'role' = 'employee' then 'employee'
    else 'employee'
  end;

  insert into public.users (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    new.raw_user_meta_data ->> 'full_name',
    assigned_role
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.users.full_name),
        role = case
          when excluded.role in ('hr', 'employee') then excluded.role
          else public.users.role
        end,
        updated_at = timezone('utc', now());

  return new;
end;
$$;

update public.users as u
set role = case
  when au.raw_user_meta_data ->> 'role' = 'employee' then 'employee'
  when au.raw_user_meta_data ->> 'role' = 'hr' then 'hr'
  else u.role
end
from auth.users as au
where au.id = u.id;

drop policy if exists "users own row" on public.users;
drop policy if exists "users self or hr select" on public.users;
drop policy if exists "users self or hr insert" on public.users;
drop policy if exists "users self or hr update" on public.users;
drop policy if exists "users hr delete" on public.users;

create policy "users self or hr select"
on public.users
for select
using (auth.uid() = id or public.is_hr());

create policy "users self or hr insert"
on public.users
for insert
with check (auth.uid() = id or public.is_hr());

create policy "users self or hr update"
on public.users
for update
using (auth.uid() = id or public.is_hr())
with check (auth.uid() = id or public.is_hr());

create policy "users hr delete"
on public.users
for delete
using (public.is_hr());

drop policy if exists "employees own data" on public.employees;
drop policy if exists "employees hr all" on public.employees;
drop policy if exists "employees own select" on public.employees;
drop policy if exists "employees own update" on public.employees;

create policy "employees hr all"
on public.employees
for all
using (public.is_hr())
with check (public.is_hr());

create policy "employees own select"
on public.employees
for select
using (user_id = auth.uid());

create policy "employees own update"
on public.employees
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "attendance own data" on public.attendance;
drop policy if exists "attendance hr all" on public.attendance;
drop policy if exists "attendance own select" on public.attendance;
drop policy if exists "attendance own insert" on public.attendance;
drop policy if exists "attendance own update" on public.attendance;

create policy "attendance hr all"
on public.attendance
for all
using (public.is_hr())
with check (public.is_hr());

create policy "attendance own select"
on public.attendance
for select
using (
  exists (
    select 1
    from public.employees e
    where e.id = attendance.employee_id
      and e.user_id = auth.uid()
  )
);

create policy "attendance own insert"
on public.attendance
for insert
with check (
  exists (
    select 1
    from public.employees e
    where e.id = attendance.employee_id
      and e.user_id = auth.uid()
  )
);

create policy "attendance own update"
on public.attendance
for update
using (
  exists (
    select 1
    from public.employees e
    where e.id = attendance.employee_id
      and e.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.employees e
    where e.id = attendance.employee_id
      and e.user_id = auth.uid()
  )
);

drop policy if exists "tasks own data" on public.tasks;
drop policy if exists "tasks hr all" on public.tasks;
drop policy if exists "tasks assigned select" on public.tasks;
drop policy if exists "tasks assigned update" on public.tasks;

create policy "tasks hr all"
on public.tasks
for all
using (public.is_hr())
with check (public.is_hr());

create policy "tasks assigned select"
on public.tasks
for select
using (
  exists (
    select 1
    from public.employees e
    where e.id = tasks.assigned_to
      and e.user_id = auth.uid()
  )
);

create policy "tasks assigned update"
on public.tasks
for update
using (
  exists (
    select 1
    from public.employees e
    where e.id = tasks.assigned_to
      and e.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.employees e
    where e.id = tasks.assigned_to
      and e.user_id = auth.uid()
  )
);

drop policy if exists "leaves own data" on public.leaves;
drop policy if exists "leaves hr all" on public.leaves;
drop policy if exists "leaves own select" on public.leaves;
drop policy if exists "leaves own insert" on public.leaves;
drop policy if exists "leaves own update" on public.leaves;

create policy "leaves hr all"
on public.leaves
for all
using (public.is_hr())
with check (public.is_hr());

create policy "leaves own select"
on public.leaves
for select
using (
  exists (
    select 1
    from public.employees e
    where e.id = leaves.employee_id
      and e.user_id = auth.uid()
  )
);

create policy "leaves own insert"
on public.leaves
for insert
with check (
  exists (
    select 1
    from public.employees e
    where e.id = leaves.employee_id
      and e.user_id = auth.uid()
  )
);

create policy "leaves own update"
on public.leaves
for update
using (
  exists (
    select 1
    from public.employees e
    where e.id = leaves.employee_id
      and e.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.employees e
    where e.id = leaves.employee_id
      and e.user_id = auth.uid()
  )
);

drop policy if exists "salaries own data" on public.salaries;
drop policy if exists "salaries hr all" on public.salaries;
drop policy if exists "salaries own select" on public.salaries;

create policy "salaries hr all"
on public.salaries
for all
using (public.is_hr())
with check (public.is_hr());

create policy "salaries own select"
on public.salaries
for select
using (
  exists (
    select 1
    from public.employees e
    where e.id = salaries.employee_id
      and e.user_id = auth.uid()
  )
);
