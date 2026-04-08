"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useTransition } from "react";
import { toast } from "sonner";
import { saveSalaryAction } from "@/app/actions/salaries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Tables } from "@/lib/supabase/database.types";

export function SalaryForm({
  employees,
  initialData,
}: {
  employees: Array<Pick<Tables<"employees">, "id" | "name">>;
  initialData?: Tables<"salaries"> | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await saveSalaryAction(formData);
      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.push("/salary");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? "Edit salary" : "Add salary"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <input type="hidden" name="id" defaultValue={initialData?.id ?? ""} />
          <div className="space-y-2">
            <Label htmlFor="employee_id">Employee</Label>
            <Select id="employee_id" name="employee_id" defaultValue={initialData?.employee_id ?? ""} required>
              <option value="">Select employee</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>{employee.name}</option>
              ))}
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2"><Label>Amount</Label><Input name="amount" type="number" step="0.01" defaultValue={initialData?.amount ?? ""} required /></div>
            <div className="space-y-2"><Label>Bonus</Label><Input name="bonus" type="number" step="0.01" defaultValue={initialData?.bonus ?? 0} /></div>
            <div className="space-y-2"><Label>Deduction</Label><Input name="deduction" type="number" step="0.01" defaultValue={initialData?.deduction ?? 0} /></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2"><Label>Month</Label><Input name="month" type="date" defaultValue={initialData?.month ?? ""} required /></div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select name="payment_status" defaultValue={initialData?.payment_status ?? "pending"}>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
              </Select>
            </div>
          </div>
          <div className="space-y-2"><Label>Notes</Label><Textarea name="notes" defaultValue={initialData?.notes ?? ""} /></div>
          <Button disabled={pending} type="submit">{pending ? "Saving..." : initialData ? "Update salary" : "Save salary"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
