import Link from "next/link";
import { Trash2 } from "lucide-react";
import { deleteAttendanceAction } from "@/app/actions/attendance";
import { AttendanceForm } from "@/components/forms/attendance-form";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { ServerActionButton } from "@/components/server-action-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAttendancePageData } from "@/lib/queries";
import type { AsyncSearchParams } from "@/lib/search-params";
import { getParamValue, toUrlSearchParams } from "@/lib/search-params";
import { formatDate, formatDateTime, formatHours, parsePage } from "@/lib/utils";
import { ClipboardClock, TimerReset } from "lucide-react";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: AsyncSearchParams;
}) {
  const resolvedSearchParams = await searchParams;
  const page = parsePage(getParamValue(resolvedSearchParams.page));
  const selectedDate = getParamValue(resolvedSearchParams.date);
  const editId = getParamValue(resolvedSearchParams.edit);
  const attendanceData = await getAttendancePageData({
    page,
    date: selectedDate,
    editId,
  });
  const urlSearchParams = toUrlSearchParams(resolvedSearchParams);

  return (
    <>
      <PageHeader
        eyebrow="Attendance"
        title="Track login, logout, and working hours"
        description="Maintain a clean daily attendance ledger with calculated hours and date-based filters."
      >
        <form className="flex flex-wrap gap-3" method="get">
          <Input
            defaultValue={attendanceData.selectedDate}
            name="date"
            type="date"
          />
          <Button type="submit" variant="secondary">
            View day
          </Button>
        </form>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2">
        <MetricCard
          helper={`Employees marked on ${formatDate(attendanceData.selectedDate)}`}
          icon={<ClipboardClock className="h-5 w-5" />}
          label="Present Today"
          value={String(attendanceData.summary.presentToday)}
        />
        <MetricCard
          helper="Average computed from saved logout times"
          icon={<TimerReset className="h-5 w-5" />}
          label="Average Hours"
          value={String(attendanceData.summary.averageHours)}
        />
      </div>

      <div className="section-grid">
        <div className="surface-card p-6">
          {attendanceData.records.length === 0 ? (
            <EmptyState
              title="No attendance records found"
              description="Add a login/logout record or choose another date."
            />
          ) : (
            <>
              <div className="table-shell">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Login</TableHead>
                      <TableHead>Logout</TableHead>
                      <TableHead>Total Hours</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceData.records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div>
                            <p className="font-semibold">
                              {record.employee?.name ?? "Unknown employee"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {record.employee?.role ?? ""}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(record.attendance_date)}</TableCell>
                        <TableCell>{formatDateTime(record.login_time)}</TableCell>
                        <TableCell>{formatDateTime(record.logout_time)}</TableCell>
                        <TableCell>{formatHours(record.total_hours)}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Link
                              className={buttonVariants({ size: "sm", variant: "outline" })}
                              href={`/attendance?date=${attendanceData.selectedDate}&edit=${record.id}`}
                            >
                              Edit
                            </Link>
                            <ServerActionButton
                              action={deleteAttendanceAction}
                              actionArgs={[record.id]}
                              confirmMessage="Delete this attendance entry?"
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
                pagination={attendanceData.pagination}
                pathname="/attendance"
                searchParams={urlSearchParams}
              />
            </>
          )}
        </div>

        <AttendanceForm
          employees={attendanceData.employees}
          initialData={attendanceData.editingRecord}
          selectedDate={attendanceData.selectedDate}
        />
      </div>
    </>
  );
}
