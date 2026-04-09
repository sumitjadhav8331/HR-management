import { Check, CircleDashed, CircleOff, Trash2, X } from "lucide-react";
import { deleteLeaveAction, reviewLeaveAction } from "@/app/actions/leaves";
import { LeaveForm } from "@/components/forms/leave-form";
import { EmptyState } from "@/components/empty-state";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { ServerActionButton } from "@/components/server-action-button";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getEmployeeLeavesPageData } from "@/lib/employee-queries";
import { requireProfile } from "@/lib/auth";
import { getLeavesPageData } from "@/lib/queries";
import type { AsyncSearchParams } from "@/lib/search-params";
import { getParamValue, toUrlSearchParams } from "@/lib/search-params";
import { formatDate, parsePage } from "@/lib/utils";

export default async function LeavesPage({
  searchParams,
}: {
  searchParams: AsyncSearchParams;
}) {
  const { profile } = await requireProfile();
  const resolvedSearchParams = await searchParams;
  const page = parsePage(getParamValue(resolvedSearchParams.page));
  const urlSearchParams = toUrlSearchParams(resolvedSearchParams);

  if (profile.role === "employee") {
    const leaveData = await getEmployeeLeavesPageData({ page });

    return (
      <>
        <PageHeader
          eyebrow="Leaves"
          title="Request and track your leave"
          description="Submit leave requests and monitor HR approval status."
        />

        <div className="grid gap-6 md:grid-cols-3">
          <MetricCard
            helper="Awaiting HR review"
            icon={<CircleDashed className="h-5 w-5" />}
            label="Pending"
            value={String(leaveData.metrics.pending)}
          />
          <MetricCard
            helper="Confirmed leave requests"
            icon={<Check className="h-5 w-5" />}
            label="Approved"
            value={String(leaveData.metrics.approved)}
          />
          <MetricCard
            helper="Not approved by HR"
            icon={<CircleOff className="h-5 w-5" />}
            label="Rejected"
            value={String(leaveData.metrics.rejected)}
          />
        </div>

        <div className="section-grid">
          <div className="surface-card p-6">
            {leaveData.leaves.length === 0 ? (
              <EmptyState
                title="No leave requests yet"
                description="Submit your first leave request from the panel."
              />
            ) : (
              <>
                <div className="table-shell">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaveData.leaves.map((leave) => (
                        <TableRow key={leave.id}>
                          <TableCell>{formatDate(leave.date)}</TableCell>
                          <TableCell>{leave.reason}</TableCell>
                          <TableCell>
                            <StatusBadge value={leave.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Pagination
                  pagination={leaveData.pagination}
                  pathname="/leaves"
                  searchParams={urlSearchParams}
                />
              </>
            )}
          </div>

          <LeaveForm />
        </div>
      </>
    );
  }

  const date = getParamValue(resolvedSearchParams.date) ?? "";
  const leaveData = await getLeavesPageData({ page, date });

  return (
    <>
      <PageHeader
        eyebrow="Leaves"
        title="Leave history and approval queue"
        description="Review leave requests and approve or reject employee applications."
      >
        <form className="flex flex-wrap gap-3" method="get">
          <Input defaultValue={date} name="date" type="date" />
          <Button type="submit" variant="secondary">
            Filter
          </Button>
        </form>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-3">
        <MetricCard
          helper="Requests waiting for review"
          icon={<CircleDashed className="h-5 w-5" />}
          label="Pending"
          value={String(leaveData.metrics.pending)}
        />
        <MetricCard
          helper="Approved leave requests"
          icon={<Check className="h-5 w-5" />}
          label="Approved"
          value={String(leaveData.metrics.approved)}
        />
        <MetricCard
          helper="Rejected leave requests"
          icon={<CircleOff className="h-5 w-5" />}
          label="Rejected"
          value={String(leaveData.metrics.rejected)}
        />
      </div>

      <div className="section-grid">
        <div className="surface-card p-6">
          {leaveData.leaves.length === 0 ? (
            <EmptyState
              title="No leave entries found"
              description="Add a leave record or adjust the date filter."
            />
          ) : (
            <>
              <div className="table-shell">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveData.leaves.map((leave) => (
                      <TableRow key={leave.id}>
                        <TableCell>
                          <div>
                            <p className="font-semibold">
                              {leave.employee?.name ?? "Unknown employee"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {leave.employee?.role ?? ""}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(leave.date)}</TableCell>
                        <TableCell>{leave.reason}</TableCell>
                        <TableCell>
                          <StatusBadge value={leave.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            {leave.status === "pending" ? (
                              <>
                                <ServerActionButton
                                  action={reviewLeaveAction}
                                  actionArgs={[leave.id, "approved"]}
                                  pendingLabel="Approving..."
                                  size="sm"
                                  variant="outline"
                                >
                                  <Check className="h-4 w-4" />
                                </ServerActionButton>
                                <ServerActionButton
                                  action={reviewLeaveAction}
                                  actionArgs={[leave.id, "rejected"]}
                                  pendingLabel="Rejecting..."
                                  size="sm"
                                  variant="outline"
                                >
                                  <X className="h-4 w-4" />
                                </ServerActionButton>
                              </>
                            ) : null}
                            <ServerActionButton
                              action={deleteLeaveAction}
                              actionArgs={[leave.id]}
                              confirmMessage="Delete this leave entry?"
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
                pagination={leaveData.pagination}
                pathname="/leaves"
                searchParams={urlSearchParams}
              />
            </>
          )}
        </div>

        <LeaveForm employees={leaveData.employees} />
      </div>
    </>
  );
}
