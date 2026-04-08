"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useTransition } from "react";
import { toast } from "sonner";
import { saveTaskAction } from "@/app/actions/tasks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Tables } from "@/lib/supabase/database.types";

export function TaskForm({
  initialData,
}: {
  initialData?: Tables<"tasks"> | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await saveTaskAction(formData);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.push("/tasks");
      router.refresh();
      form.reset();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? "Edit task" : "Create HR task"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <input name="id" type="hidden" defaultValue={initialData?.id ?? ""} />
          <div className="space-y-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              name="title"
              defaultValue={initialData?.title ?? ""}
              placeholder="Schedule candidate follow-up calls"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              name="description"
              defaultValue={initialData?.description ?? ""}
              placeholder="Mention any dependencies or manager context."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="task-priority">Priority</Label>
              <Select
                id="task-priority"
                name="priority"
                defaultValue={initialData?.priority ?? "medium"}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-status">Status</Label>
              <Select
                id="task-status"
                name="status"
                defaultValue={initialData?.status ?? "pending"}
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-deadline">Deadline</Label>
            <Input
              id="task-deadline"
              name="deadline"
              type="date"
              defaultValue={initialData?.deadline ?? ""}
            />
          </div>
          <Button disabled={pending} type="submit">
            {pending ? "Saving..." : initialData ? "Update task" : "Create task"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
