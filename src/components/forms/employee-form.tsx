"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useTransition } from "react";
import { toast } from "sonner";
import { saveEmployeeAction } from "@/app/actions/employees";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { Tables } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

export function EmployeeForm({
  initialData,
}: {
  initialData?: Tables<"employees"> | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await saveEmployeeAction(formData);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.push("/employees");
      router.refresh();
      form.reset();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {initialData ? "Edit employee" : "Add a new employee"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <input name="id" type="hidden" defaultValue={initialData?.id ?? ""} />
          <div className="space-y-2">
            <Label htmlFor="employee-name">Full name</Label>
            <Input
              id="employee-name"
              name="name"
              defaultValue={initialData?.name ?? ""}
              placeholder="Neha Sharma"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="employee-phone">Phone</Label>
            <Input
              id="employee-phone"
              name="phone"
              defaultValue={initialData?.phone ?? ""}
              placeholder="9876543210"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="employee-email">Email</Label>
            <Input
              id="employee-email"
              name="email"
              type="email"
              defaultValue={initialData?.email ?? ""}
              placeholder="employee@company.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="employee-role">Role</Label>
            <Input
              id="employee-role"
              name="role"
              defaultValue={initialData?.role ?? ""}
              placeholder="Sales Executive"
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="employee-joining-date">Joining date</Label>
              <Input
                id="employee-joining-date"
                name="joining_date"
                type="date"
                defaultValue={initialData?.joining_date ?? ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-status">Status</Label>
              <Select
                id="employee-status"
                name="status"
                defaultValue={initialData?.status ?? "active"}
              >
                <option value="active">Active</option>
                <option value="not_joined">Not joined</option>
                <option value="left">Left</option>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button disabled={pending} type="submit">
              {pending ? "Saving..." : initialData ? "Update employee" : "Add employee"}
            </Button>
            {initialData ? (
              <Link
                className={cn(buttonVariants({ variant: "outline" }))}
                href="/employees"
              >
                Cancel
              </Link>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
