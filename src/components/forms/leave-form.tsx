"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useTransition } from "react";
import { toast } from "sonner";
import { saveLeaveAction } from "@/app/actions/leaves";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Tables } from "@/lib/supabase/database.types";

export function LeaveForm({
  employees,
}: {
  employees?: Array<Pick<Tables<"employees">, "id" | "name" | "role" | "status">>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await saveLeaveAction(formData);

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
        <CardTitle>{employees ? "Add leave entry" : "Apply for leave"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          {employees ? (
            <div className="space-y-2">
              <Label htmlFor="leave-employee">Employee</Label>
              <Select id="leave-employee" name="employee_id" required>
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} - {employee.role}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="leave-date">Leave date</Label>
            <Input id="leave-date" name="date" type="date" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="leave-reason">Reason</Label>
            <Textarea
              id="leave-reason"
              name="reason"
              placeholder="Family emergency / planned leave"
              required
            />
          </div>
          <Button disabled={pending} type="submit">
            {pending ? "Saving..." : employees ? "Add leave" : "Submit request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
