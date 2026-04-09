drop policy if exists "employees hr all" on public.employees;
drop policy if exists "employees hr own all" on public.employees;

create policy "employees hr own all"
on public.employees
for all
using (
  public.is_hr()
  and created_by = auth.uid()
)
with check (
  public.is_hr()
  and created_by = auth.uid()
);

drop policy if exists "attendance hr all" on public.attendance;
drop policy if exists "attendance hr employee all" on public.attendance;

create policy "attendance hr employee all"
on public.attendance
for all
using (
  public.is_hr()
  and exists (
    select 1
    from public.employees e
    where e.id = attendance.employee_id
      and e.created_by = auth.uid()
  )
)
with check (
  public.is_hr()
  and exists (
    select 1
    from public.employees e
    where e.id = attendance.employee_id
      and e.created_by = auth.uid()
  )
);

drop policy if exists "tasks hr all" on public.tasks;
drop policy if exists "tasks hr employee all" on public.tasks;

create policy "tasks hr employee all"
on public.tasks
for all
using (
  public.is_hr()
  and exists (
    select 1
    from public.employees e
    where e.id = tasks.assigned_to
      and e.created_by = auth.uid()
  )
)
with check (
  public.is_hr()
  and exists (
    select 1
    from public.employees e
    where e.id = tasks.assigned_to
      and e.created_by = auth.uid()
  )
);

drop policy if exists "leaves hr all" on public.leaves;
drop policy if exists "leaves hr employee all" on public.leaves;

create policy "leaves hr employee all"
on public.leaves
for all
using (
  public.is_hr()
  and exists (
    select 1
    from public.employees e
    where e.id = leaves.employee_id
      and e.created_by = auth.uid()
  )
)
with check (
  public.is_hr()
  and exists (
    select 1
    from public.employees e
    where e.id = leaves.employee_id
      and e.created_by = auth.uid()
  )
);

drop policy if exists "salaries hr all" on public.salaries;
drop policy if exists "salaries hr employee all" on public.salaries;

create policy "salaries hr employee all"
on public.salaries
for all
using (
  public.is_hr()
  and exists (
    select 1
    from public.employees e
    where e.id = salaries.employee_id
      and e.created_by = auth.uid()
  )
)
with check (
  public.is_hr()
  and exists (
    select 1
    from public.employees e
    where e.id = salaries.employee_id
      and e.created_by = auth.uid()
  )
);
