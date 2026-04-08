import Link from "next/link";
import { Trash2 } from "lucide-react";
import { deleteTaskAction, toggleTaskStatusAction } from "@/app/actions/tasks";
import { TaskForm } from "@/components/forms/task-form";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { ServerActionButton } from "@/components/server-action-button";
import { StatusBadge } from "@/components/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getTasksPageData } from "@/lib/queries";
import type { AsyncSearchParams } from "@/lib/search-params";
import { getParamValue, toUrlSearchParams } from "@/lib/search-params";
import { formatDate, parsePage } from "@/lib/utils";
import { AlertTriangle, CheckCheck, ListTodo } from "lucide-react";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: AsyncSearchParams;
}) {
  const resolvedSearchParams = await searchParams;
  const page = parsePage(getParamValue(resolvedSearchParams.page));
  const status = getParamValue(resolvedSearchParams.status) ?? "";
  const editId = getParamValue(resolvedSearchParams.edit);
  const taskData = await getTasksPageData({ page, status, editId });
  const urlSearchParams = toUrlSearchParams(resolvedSearchParams);

  return (
    <>
      <PageHeader
        eyebrow="Tasks"
        title="Track task execution and deadlines"
        description="Create priority-based HR tasks, mark them done, and surface overdue work before it slips."
      >
        <form className="flex flex-wrap gap-3" method="get">
          <Select defaultValue={status} name="status">
            <option value="">All tasks</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </Select>
          <Button type="submit" variant="secondary">
            Apply
          </Button>
        </form>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          helper="Open work still in motion"
          icon={<ListTodo className="h-5 w-5" />}
          label="Pending"
          value={String(taskData.metrics.pending)}
        />
        <MetricCard
          helper="Tasks already closed"
          icon={<CheckCheck className="h-5 w-5" />}
          label="Completed"
          value={String(taskData.metrics.completed)}
        />
        <MetricCard
          helper="Past deadline and not done"
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Overdue"
          value={String(taskData.metrics.overdue)}
        />
      </div>

      <div className="section-grid">
        <div className="surface-card p-6">
          {taskData.tasks.length === 0 ? (
            <EmptyState
              title="No tasks yet"
              description="Create the first task or switch the filter to another status."
            />
          ) : (
            <>
              <div className="table-shell">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taskData.tasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <div>
                            <p className="font-semibold">{task.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {task.description || "No description"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge value={task.priority} />
                        </TableCell>
                        <TableCell>
                          {task.deadline ? formatDate(task.deadline) : "No deadline"}
                        </TableCell>
                        <TableCell>
                          <StatusBadge value={task.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <ServerActionButton
                              action={toggleTaskStatusAction}
                              actionArgs={[
                                task.id,
                                task.status === "completed" ? "pending" : "completed",
                              ]}
                              pendingLabel="Updating..."
                              size="sm"
                              variant="outline"
                            >
                              {task.status === "completed" ? "Reopen" : "Complete"}
                            </ServerActionButton>
                            <Link
                              className={buttonVariants({ size: "sm", variant: "outline" })}
                              href={`/tasks?edit=${task.id}`}
                            >
                              Edit
                            </Link>
                            <ServerActionButton
                              action={deleteTaskAction}
                              actionArgs={[task.id]}
                              confirmMessage="Delete this task?"
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
                pagination={taskData.pagination}
                pathname="/tasks"
                searchParams={urlSearchParams}
              />
            </>
          )}
        </div>

        <TaskForm initialData={taskData.editingTask} />
      </div>
    </>
  );
}
