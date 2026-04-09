"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { type FormEvent, useState, useTransition } from "react";
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
  const hasEmployeeLogin = Boolean(initialData?.email && initialData?.password_hash);
  const [showPassword, setShowPassword] = useState(false);
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
              <Label htmlFor="employee-department">Department</Label>
              <Input
                id="employee-department"
                name="department"
                defaultValue={initialData?.department ?? "General"}
                placeholder="Operations"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-salary">Monthly salary</Label>
              <Input
                id="employee-salary"
                name="salary"
                type="number"
                min="0"
                step="0.01"
                defaultValue={initialData?.salary ?? 0}
                required
              />
            </div>
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
          <div className="space-y-2 rounded-2xl border border-border/70 bg-secondary/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="employee-password">
                {initialData ? "Reset employee login password" : "Initial employee login password"}
              </Label>
              {hasEmployeeLogin ? (
                <span className="text-xs font-medium text-emerald-700">
                  Login ready
                </span>
              ) : null}
            </div>
            <div className="relative">
              <Input
                id="employee-password"
                name="password"
                type={showPassword ? "text" : "password"}
                minLength={6}
                placeholder={
                  initialData
                    ? "Leave blank to keep the current password"
                    : "Create a password for the employee"
                }
                className="pr-10"
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-xs leading-6 text-muted-foreground">
              {initialData
                ? "Keep the email filled in. Add a new password only when you want to reset employee login."
                : "Add an email and password to enable employee login."}
            </p>
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
