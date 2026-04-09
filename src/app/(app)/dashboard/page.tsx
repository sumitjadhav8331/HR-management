import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  PhoneCall,
  UsersRound,
  UserX,
} from "lucide-react";
import { deleteNoteAction, toggleNoteStatusAction } from "@/app/actions/notes";
import { ReportGenerator } from "@/components/forms/report-generator";
import { NoteForm } from "@/components/forms/note-form";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { ServerActionButton } from "@/components/server-action-button";
import { StatusBadge } from "@/components/status-badge";
import { getEmployeeDashboardData } from "@/lib/employee-queries";
import { getDashboardData } from "@/lib/queries";
import type { AsyncSearchParams } from "@/lib/search-params";
import { getParamValue } from "@/lib/search-params";
import { formatDate, formatHours } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireProfile } from "@/lib/auth";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: AsyncSearchParams;
}) {
  const { profile } = await requireProfile();

  if (profile.role === "employee") {
    const employeeData = await getEmployeeDashboardData();

    return (
      <>
        <PageHeader
          eyebrow="Dashboard"
          title="Your workday overview"
          description="Track attendance, assigned tasks, leave progress, and your latest salary status."
        />

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            helper="Tasks waiting for completion"
            icon={<ClipboardList className="h-5 w-5" />}
            label="Pending Tasks"
            value={String(employeeData.metrics.pendingTasks)}
          />
          <MetricCard
            helper="Completed assigned tasks"
            icon={<CheckCircle2 className="h-5 w-5" />}
            label="Completed Tasks"
            value={String(employeeData.metrics.completedTasks)}
          />
          <MetricCard
            helper="Leave requests awaiting HR review"
            icon={<AlertTriangle className="h-5 w-5" />}
            label="Pending Leaves"
            value={String(employeeData.metrics.pendingLeaves)}
          />
          <MetricCard
            helper={employeeData.todayAttendance ? "Checked in today" : "No check-in yet"}
            icon={<ClipboardCheck className="h-5 w-5" />}
            label="Today's Attendance"
            value={
              employeeData.todayAttendance
                ? employeeData.todayAttendance.logout_time
                  ? "Checked out"
                  : "Checked in"
                : "Absent"
            }
          />
        </div>

        <div className="section-grid">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Today&apos;s attendance</CardTitle>
              </CardHeader>
              <CardContent>
                {employeeData.todayAttendance ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border/70 bg-white/65 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Check in</p>
                      <p className="pt-2 text-lg font-semibold">
                        {formatDate(employeeData.todayAttendance.login_time, "dd MMM yyyy, hh:mm a")}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-white/65 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Check out</p>
                      <p className="pt-2 text-lg font-semibold">
                        {employeeData.todayAttendance.logout_time
                          ? formatDate(employeeData.todayAttendance.logout_time, "dd MMM yyyy, hh:mm a")
                          : "In progress"}
                      </p>
                      <p className="pt-1 text-xs text-muted-foreground">
                        Total: {formatHours(employeeData.todayAttendance.total_hours)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    You have not checked in yet today.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Assigned tasks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {employeeData.tasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No tasks assigned yet.
                  </p>
                ) : (
                  employeeData.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start justify-between gap-3 rounded-2xl border border-border/70 bg-white/70 p-3"
                    >
                      <div>
                        <p className="font-semibold">{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Deadline: {task.deadline ? formatDate(task.deadline) : "No deadline"}
                        </p>
                      </div>
                      <StatusBadge value={task.status} />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Latest salary record</CardTitle>
              </CardHeader>
              <CardContent>
                {employeeData.latestSalary ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Month: {formatDate(employeeData.latestSalary.month, "MMM yyyy")}
                    </p>
                    <p className="text-3xl font-semibold">
                      {(employeeData.latestSalary.amount + employeeData.latestSalary.bonus - employeeData.latestSalary.deduction).toFixed(2)}
                    </p>
                    <StatusBadge value={employeeData.latestSalary.payment_status} />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Salary information is not available yet.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent leave requests</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {employeeData.recentLeaves.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No leave requests yet.</p>
                ) : (
                  employeeData.recentLeaves.map((leave) => (
                    <div
                      key={leave.id}
                      className="flex items-center justify-between rounded-2xl border border-border/70 bg-white/70 p-3"
                    >
                      <div>
                        <p className="font-medium">{formatDate(leave.date)}</p>
                        <p className="text-xs text-muted-foreground">{leave.reason}</p>
                      </div>
                      <StatusBadge value={leave.status} />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  const resolvedSearchParams = await searchParams;
  const selectedDate = getParamValue(resolvedSearchParams.date);
  const dashboard = await getDashboardData(selectedDate);

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title="Daily HR command center"
        description="See what was accomplished today, what still needs movement, and generate a polished report for your boss."
      >
        <form className="flex flex-wrap gap-3" method="get">
          <Input defaultValue={dashboard.selectedDate} name="date" type="date" />
          <Button type="submit" variant="secondary">
            Apply
          </Button>
        </form>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          helper="Employees tracked in the system"
          icon={<UsersRound className="h-5 w-5" />}
          label="Total Employees"
          value={String(dashboard.metrics.totalEmployees)}
        />
        <MetricCard
          helper={`Attendance on ${formatDate(dashboard.selectedDate)}`}
          icon={<ClipboardList className="h-5 w-5" />}
          label="Present Today"
          value={String(dashboard.metrics.presentToday)}
        />
        <MetricCard
          helper={`No check-in on ${formatDate(dashboard.selectedDate)}`}
          icon={<UserX className="h-5 w-5" />}
          label="Absent Today"
          value={String(dashboard.metrics.absentToday)}
        />
        <MetricCard
          helper="Candidate conversations logged"
          icon={<PhoneCall className="h-5 w-5" />}
          label="Calls Made Today"
          value={String(dashboard.metrics.callsMadeToday)}
        />
        <MetricCard
          helper="Completed on the selected day"
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Tasks Completed"
          value={String(dashboard.metrics.tasksCompleted)}
        />
      </div>

      <div className="section-grid">
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <TrendChart
              color="#245c63"
              data={dashboard.callsTrend}
              title="Daily calls trend"
            />
            <TrendChart
              color="#c18c43"
              data={dashboard.attendanceTrend}
              title="Attendance trend"
            />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s summary</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-2">
              <div className="grid gap-3 sm:grid-cols-2">
                {dashboard.summaryItems.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-3xl border border-border/70 bg-white/65 p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="pt-2 text-3xl font-semibold">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-3xl border border-border/70 bg-white/65 p-4">
                <p className="eyebrow">Recent tasks</p>
                <div className="space-y-3 pt-3">
                  {dashboard.recentTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No tasks have been added yet.
                    </p>
                  ) : (
                    dashboard.recentTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-start justify-between gap-3 rounded-2xl border border-border/60 bg-background/70 p-3"
                      >
                        <div>
                          <p className="font-medium">{task.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Deadline: {task.deadline ? formatDate(task.deadline) : "No deadline"}
                          </p>
                        </div>
                        <StatusBadge value={task.status} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes and self tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dashboard.notes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No notes recorded for {formatDate(dashboard.selectedDate)} yet.
                </p>
              ) : (
                dashboard.notes.map((note) => (
                  <div
                    key={note.id}
                    className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-white/70 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold">{note.title}</h3>
                          <StatusBadge value={note.kind} />
                          <StatusBadge value={note.status} />
                        </div>
                        <p className="text-sm leading-6 text-muted-foreground">
                          {note.content}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <ServerActionButton
                          action={toggleNoteStatusAction}
                          actionArgs={[
                            note.id,
                            note.status === "done" ? "open" : "done",
                          ]}
                          pendingLabel="Updating..."
                          size="sm"
                          variant="outline"
                        >
                          {note.status === "done" ? "Reopen" : "Mark done"}
                        </ServerActionButton>
                        <ServerActionButton
                          action={deleteNoteAction}
                          actionArgs={[note.id]}
                          confirmMessage="Delete this note?"
                          pendingLabel="Deleting..."
                          size="sm"
                          variant="ghost"
                        >
                          Delete
                        </ServerActionButton>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <ReportGenerator selectedDate={dashboard.selectedDate} />
          <NoteForm selectedDate={dashboard.selectedDate} />
        </div>
      </div>
    </>
  );
}
