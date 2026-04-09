import Link from "next/link";
import { Trash2 } from "lucide-react";
import { deleteSalaryAction } from "@/app/actions/salaries";
import { SalaryForm } from "@/components/forms/salary-form";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { ServerActionButton } from "@/components/server-action-button";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getEmployeeSalaryPageData } from "@/lib/employee-queries";
import { requireProfile } from "@/lib/auth";
import { getSalariesPageData } from "@/lib/queries";
import type { AsyncSearchParams } from "@/lib/search-params";
import { getParamValue, toUrlSearchParams } from "@/lib/search-params";
import { formatDate, parsePage } from "@/lib/utils";

export default async function SalaryPage({ searchParams }: { searchParams: AsyncSearchParams }) {
  const { profile } = await requireProfile();
  const resolved = await searchParams;
  const page = parsePage(getParamValue(resolved.page));
  const urlSearchParams = toUrlSearchParams(resolved);

  if (profile.role === "employee") {
    const data = await getEmployeeSalaryPageData({ page });

    return (
      <>
        <PageHeader
          eyebrow="Salary"
          title="Your salary records"
          description="Review monthly payouts, bonus, deductions, and payment status."
        />
        <div className="surface-card p-6">
          {data.salaries.length === 0 ? (
            <EmptyState title="No salary records" description="HR has not published salary details yet." />
          ) : (
            <>
              <div className="table-shell">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead>Base Salary</TableHead>
                      <TableHead>Bonus</TableHead>
                      <TableHead>Deduction</TableHead>
                      <TableHead>Net</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.salaries.map((salary) => (
                      <TableRow key={salary.id}>
                        <TableCell>{formatDate(salary.month, "MMM yyyy")}</TableCell>
                        <TableCell>{salary.amount.toFixed(2)}</TableCell>
                        <TableCell>{salary.bonus.toFixed(2)}</TableCell>
                        <TableCell>{salary.deduction.toFixed(2)}</TableCell>
                        <TableCell>{(salary.amount + salary.bonus - salary.deduction).toFixed(2)}</TableCell>
                        <TableCell className="capitalize">{salary.payment_status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Pagination pagination={data.pagination} pathname="/salary" searchParams={urlSearchParams} />
            </>
          )}
        </div>
      </>
    );
  }

  const editId = getParamValue(resolved.edit);
  const data = await getSalariesPageData({ page, editId });

  return (
    <>
      <PageHeader
        eyebrow="Salary"
        title="Payroll and payment tracking"
        description="Track monthly salary, bonus, deductions, and payment status."
      />
      <div className="section-grid">
        <div className="surface-card p-6">
          {data.salaries.length === 0 ? (
            <EmptyState title="No salary records" description="Create your first payroll entry." />
          ) : (
            <>
              <div className="table-shell">
                <Table>
                  <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Month</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {data.salaries.map((salary) => (
                      <TableRow key={salary.id}>
                        <TableCell>{salary.employee?.name ?? "Unknown"}</TableCell>
                        <TableCell>{formatDate(salary.month, "MMM yyyy")}</TableCell>
                        <TableCell>{(salary.amount + salary.bonus - salary.deduction).toFixed(2)}</TableCell>
                        <TableCell className="capitalize">{salary.payment_status}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Link href={`/salary?edit=${salary.id}`} className={buttonVariants({ size: "sm", variant: "outline" })}>Edit</Link>
                            <ServerActionButton action={deleteSalaryAction} actionArgs={[salary.id]} size="sm" variant="ghost"><Trash2 className="h-4 w-4" /></ServerActionButton>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Pagination pagination={data.pagination} pathname="/salary" searchParams={urlSearchParams} />
            </>
          )}
        </div>
        <SalaryForm employees={data.employees} initialData={data.editingSalary} />
      </div>
    </>
  );
}
