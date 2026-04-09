"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useTransition } from "react";
import { toast } from "sonner";
import { saveTaskCompletionNoteAction } from "@/app/actions/tasks";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Tables } from "@/lib/supabase/database.types";

export function EmployeeTaskNoteForm({
  task,
}: {
  task: Pick<Tables<"tasks">, "id" | "completion_notes" | "status">;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await saveTaskCompletionNoteAction(formData);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <form className="space-y-2" onSubmit={onSubmit}>
      <input name="id" type="hidden" value={task.id} />
      <input
        name="mark_completed"
        type="hidden"
        value={task.status === "completed" ? "false" : "true"}
      />
      <Textarea
        className="min-h-[84px]"
        defaultValue={task.completion_notes ?? ""}
        name="completion_notes"
        placeholder="Add progress or completion notes"
      />
      <Button disabled={pending} size="sm" type="submit" variant="secondary">
        {pending
          ? "Saving..."
          : task.status === "completed"
            ? "Save notes"
            : "Save notes and complete"}
      </Button>
    </form>
  );
}
