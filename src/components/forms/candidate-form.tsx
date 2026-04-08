"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useTransition } from "react";
import { toast } from "sonner";
import { saveCandidateAction } from "@/app/actions/recruitment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Tables } from "@/lib/supabase/database.types";

export function CandidateForm({
  initialData,
  defaultCallDate,
}: {
  initialData?: Tables<"candidates"> | null;
  defaultCallDate: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await saveCandidateAction(formData);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.push("/recruitment");
      router.refresh();
      form.reset();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {initialData ? "Edit candidate pipeline" : "Add candidate call log"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <input name="id" type="hidden" defaultValue={initialData?.id ?? ""} />
          <div className="space-y-2">
            <Label htmlFor="candidate-name">Candidate name</Label>
            <Input
              id="candidate-name"
              name="name"
              defaultValue={initialData?.name ?? ""}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="candidate-phone">Phone</Label>
            <Input
              id="candidate-phone"
              name="phone"
              defaultValue={initialData?.phone ?? ""}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="candidate-position">Position</Label>
            <Input
              id="candidate-position"
              name="position"
              defaultValue={initialData?.position ?? ""}
              placeholder="Telecaller"
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="call-status">Call status</Label>
              <Select
                id="call-status"
                name="call_status"
                defaultValue={initialData?.call_status ?? "interested"}
              >
                <option value="interested">Interested</option>
                <option value="not_interested">Not interested</option>
                <option value="follow_up">Follow-up</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="final-status">Final status</Label>
              <Select
                id="final-status"
                name="final_status"
                defaultValue={initialData?.final_status ?? "pending"}
              >
                <option value="pending">Pending</option>
                <option value="joined">Joined</option>
                <option value="not_joined">Not joined</option>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="call-date">Call date</Label>
              <Input
                id="call-date"
                name="call_date"
                type="date"
                defaultValue={initialData?.call_date ?? defaultCallDate}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expected-joining">Expected joining</Label>
              <Input
                id="expected-joining"
                name="expected_joining_date"
                type="date"
                defaultValue={initialData?.expected_joining_date ?? ""}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="candidate-response">Response notes</Label>
            <Textarea
              id="candidate-response"
              name="response"
              defaultValue={initialData?.response ?? ""}
              placeholder="Interested but wants salary discussion next week."
            />
          </div>
          <Button disabled={pending} type="submit">
            {pending ? "Saving..." : initialData ? "Update candidate" : "Add candidate"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
