import Link from "next/link";
import { Trash2 } from "lucide-react";
import { deleteEmployeeAction } from "@/app/actions/employees";
import { EmployeeForm } from "@/components/forms/employee-form";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { ServerActionButton } from "@/components/server-action-button";
import { StatusBadge } from "@/components/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getEmployeesPageData } from "@/lib/queries";
import type { AsyncSearchParams } from "@/lib/search-params";
import { getParamValue, toUrlSearchParams } from "@/lib/search-params";
import { formatDate, parsePage } from "@/lib/utils";

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: AsyncSearchParams;
}) {
  const resolvedSearchParams = await searchParams;
  const page = parsePage(getParamValue(resolvedSearchParams.page));
  const query = getParamValue(resolvedSearchParams.query) ?? "";
  const status = getParamValue(resolvedSearchParams.status) ?? "";
  const editId = getParamValue(resolvedSearchParams.edit);
  const employeeData = await getEmployeesPageData({
    page,
    query,
    status,
    editId,
  });
  const urlSearchParams = toUrlSearchParams(resolvedSearchParams);

  return (
    <>
      <PageHeader
        eyebrow="Employees"
        title="Employee records and joining status"
        description="Manage contact details, employment role, and onboarding state from a single HR-owned source of truth."
      >
        <form className="flex flex-wrap gap-3" method="get">
          <Input defaultValue={query} name="query" placeholder="Search employees" />
          <Select defaultValue={status} name="status">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="not_joined">Not joined</option>
            <option value="left">Left</option>
          </Select>
          <Button type="submit" variant="secondary">
            Filter
          </Button>
        </form>
      </PageHeader>

      <div className="section-grid">
        <div className="surface-card p-6">
          {employeeData.employees.length === 0 ? (
            <EmptyState
              title="No employees found"
              description="Add the first employee or change the current filters."
            />
          ) : (
            <>
              <div className="table-shell w-full max-w-full">
                <Table className="min-w-[1320px] [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Salary</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Joining Date</TableHead>
                      <TableHead>Access</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeeData.employees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className="whitespace-normal">
                          <div>
                            <p className="font-semibold">{employee.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {employee.email || "No email added"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{employee.role}</TableCell>
                        <TableCell>{employee.department}</TableCell>
                        <TableCell>{Number(employee.salary ?? 0).toFixed(2)}</TableCell>
                        <TableCell>{employee.phone}</TableCell>
                        <TableCell>{formatDate(employee.joining_date)}</TableCell>
                        <TableCell>
                          {employee.email && employee.password_hash ? "Ready" : "Needs setup"}
                        </TableCell>
                        <TableCell>
                          <StatusBadge value={employee.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Link
                              className={buttonVariants({ size: "sm", variant: "outline" })}
                              href={`/employees?edit=${employee.id}`}
                            >
                              Edit
                            </Link>
                            <ServerActionButton
                              action={deleteEmployeeAction}
                              actionArgs={[employee.id]}
                              confirmMessage="Delete this employee record?"
                              pendingLabel="Deleting..."
                              size="sm"
                              variant="ghost"
                            >
                              <Trash2 className="h-4 w-4" />
                            </ServerActionButton>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Pagination
                pagination={employeeData.pagination}
                pathname="/employees"
                searchParams={urlSearchParams}
              />
            </>
          )}
        </div>

        <EmployeeForm initialData={employeeData.editingEmployee} />
      </div>
    </>
  );
}
