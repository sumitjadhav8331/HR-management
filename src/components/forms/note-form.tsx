"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useTransition } from "react";
import { toast } from "sonner";
import { saveNoteAction } from "@/app/actions/notes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function NoteForm({ selectedDate }: { selectedDate: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await saveNoteAction(formData);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
      form.reset();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Capture notes and self tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="note-kind">Entry type</Label>
              <Select id="note-kind" name="kind" defaultValue="daily_note">
                <option value="daily_note">Daily note</option>
                <option value="self_task">Self task</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="note-status">Status</Label>
              <Select id="note-status" name="status" defaultValue="open">
                <option value="open">Open</option>
                <option value="done">Done</option>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="note-date">Date</Label>
            <Input
              id="note-date"
              name="note_date"
              type="date"
              defaultValue={selectedDate}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note-title">Title</Label>
            <Input
              id="note-title"
              name="title"
              placeholder="Interview feedback summary"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note-content">Details</Label>
            <Textarea
              id="note-content"
              name="content"
              placeholder="Write key updates that should appear on the dashboard and in the PDF report."
              required
            />
          </div>
          <Button disabled={pending} type="submit">
            {pending ? "Saving..." : "Save note"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
