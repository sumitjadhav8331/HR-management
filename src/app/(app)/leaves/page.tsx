import { Trash2 } from "lucide-react";
import { deleteLeaveAction } from "@/app/actions/leaves";
import { LeaveForm } from "@/components/forms/leave-form";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { ServerActionButton } from "@/components/server-action-button";
import { Button } from "@/components/ui/button";
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
import { getLeavesPageData } from "@/lib/queries";
import type { AsyncSearchParams } from "@/lib/search-params";
import { getParamValue, toUrlSearchParams } from "@/lib/search-params";
import { formatDate, parsePage } from "@/lib/utils";

export default async function LeavesPage({
  searchParams,
}: {
  searchParams: AsyncSearchParams;
}) {
  const resolvedSearchParams = await searchParams;
  const page = parsePage(getParamValue(resolvedSearchParams.page));
  const date = getParamValue(resolvedSearchParams.date) ?? "";
  const leaveData = await getLeavesPageData({ page, date });
  const urlSearchParams = toUrlSearchParams(resolvedSearchParams);

  return (
    <>
      <PageHeader
        eyebrow="Leaves"
        title="Leave history and daily absence tracking"
        description="Record time off with employee context so attendance and summary reporting stay accurate."
      >
        <form className="flex flex-wrap gap-3" method="get">
          <Input defaultValue={date} name="date" type="date" />
          <Button type="submit" variant="secondary">
            Filter
          </Button>
        </form>
      </PageHeader>

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
                          <div className="flex justify-end">
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
