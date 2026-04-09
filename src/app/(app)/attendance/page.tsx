import Link from "next/link";
import { ClipboardClock, TimerReset, Trash2 } from "lucide-react";
import {
  deleteAttendanceAction,
} from "@/app/actions/attendance";
import { AttendanceForm } from "@/components/forms/attendance-form";
import { EmployeeAttendanceActions } from "@/components/forms/employee-attendance-actions";
import { EmptyState } from "@/components/empty-state";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { ServerActionButton } from "@/components/server-action-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getEmployeeAttendancePageData } from "@/lib/employee-queries";
import { requireProfile } from "@/lib/auth";
import { getAttendancePageData } from "@/lib/queries";
import type { AsyncSearchParams } from "@/lib/search-params";
import { getParamValue, toUrlSearchParams } from "@/lib/search-params";
import { formatDate, formatDateTime, formatHours, parsePage } from "@/lib/utils";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: AsyncSearchParams;
}) {
  const { profile } = await requireProfile();
  const resolvedSearchParams = await searchParams;
  const page = parsePage(getParamValue(resolvedSearchParams.page));
  const urlSearchParams = toUrlSearchParams(resolvedSearchParams);

  if (profile.role === "employee") {
    const attendanceData = await getEmployeeAttendancePageData({ page });
    const todayDate = attendanceData.todayDate;
    const todayRecord = attendanceData.todayRecord;
    const canCheckIn = !todayRecord || Boolean(todayRecord.logout_time);
    const canCheckOut = Boolean(todayRecord && !todayRecord.logout_time);

    return (
      <>
        <PageHeader
          eyebrow="Attendance"
          title="Check in and check out with location"
          description="Use one-click attendance actions. Location is captured with your browser permission."
        />

        <div className="grid gap-6 md:grid-cols-2">
          <MetricCard
            helper={`Attendance on ${formatDate(todayDate)}`}
            icon={<ClipboardClock className="h-5 w-5" />}
            label="Today's Status"
            value={
              todayRecord
                ? todayRecord.logout_time
                  ? "Checked out"
                  : "Checked in"
                : "Not checked in"
            }
          />
          <MetricCard
            helper="Calculated from today's record"
            icon={<TimerReset className="h-5 w-5" />}
            label="Today's Hours"
            value={formatHours(todayRecord?.total_hours)}
          />
        </div>

        <div className="section-grid">
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s attendance actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <EmployeeAttendanceActions
                canCheckIn={canCheckIn}
                canCheckOut={canCheckOut}
                todayDate={todayDate}
              />
              {todayRecord?.latitude && todayRecord?.longitude ? (
                <a
                  className="inline-block text-sm text-primary underline"
                  href={`https://www.google.com/maps?q=${todayRecord.latitude},${todayRecord.longitude}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  View today&apos;s check-in map
                </a>
              ) : null}
            </CardContent>
          </Card>

          <div className="surface-card p-6">
            {attendanceData.records.length === 0 ? (
              <EmptyState
                title="No attendance records yet"
                description="Your previous check-ins and check-outs will appear here."
              />
            ) : (
              <>
                <div className="table-shell">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Login</TableHead>
                        <TableHead>Logout</TableHead>
                        <TableHead>Total Hours</TableHead>
                        <TableHead>Location</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceData.records.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{formatDate(record.attendance_date)}</TableCell>
                          <TableCell>{formatDateTime(record.login_time)}</TableCell>
                          <TableCell>{formatDateTime(record.logout_time)}</TableCell>
                          <TableCell>{formatHours(record.total_hours)}</TableCell>
                          <TableCell>
                            {record.latitude && record.longitude ? (
                              <a
                                className="text-xs text-primary underline"
                                href={`https://www.google.com/maps?q=${record.latitude},${record.longitude}`}
                                rel="noreferrer"
                                target="_blank"
                              >
                                View map
                              </a>
                            ) : (
                              <span className="text-xs text-muted-foreground">Not captured</span>
                            )}
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
        </div>
      </>
    );
  }

  const selectedDate = getParamValue(resolvedSearchParams.date);
  const editId = getParamValue(resolvedSearchParams.edit);
  const attendanceData = await getAttendancePageData({
    page,
    date: selectedDate,
    editId,
  });

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
                      <TableHead>Location</TableHead>
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
                          {record.latitude && record.longitude ? (
                            <a
                              className="text-xs text-primary underline"
                              href={`https://www.google.com/maps?q=${record.latitude},${record.longitude}`}
                              rel="noreferrer"
                              target="_blank"
                            >
                              View map
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">Not captured</span>
                          )}
                        </TableCell>
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
