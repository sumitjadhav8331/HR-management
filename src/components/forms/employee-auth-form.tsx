"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useTransition } from "react";
import { toast } from "sonner";
import { employeeLoginAction } from "@/app/actions/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function EmployeeAuthForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await employeeLoginAction(formData);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-3">
        <p className="eyebrow">Employee access</p>
        <CardTitle className="text-3xl">Sign in as employee</CardTitle>
        <p className="text-sm leading-7 text-muted-foreground">
          Use the email and password saved on your employee profile. HR/admin accounts should
          use the HR login screen instead.
        </p>
        <Link
          className={cn(buttonVariants({ size: "sm", variant: "outline" }), "w-fit rounded-full")}
          href="/login"
        >
          Back to HR login
        </Link>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="employee-email">Email</Label>
            <Input
              id="employee-email"
              name="email"
              type="email"
              placeholder="employee@company.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="employee-password">Password</Label>
            <Input
              id="employee-password"
              name="password"
              type="password"
              placeholder="Enter your password"
              required
            />
          </div>
          <Button className="w-full" disabled={pending} type="submit">
            {pending ? "Please wait..." : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
