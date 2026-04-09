"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  loginAction,
  resendVerificationAction,
  signUpAction,
} from "@/app/actions/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function AuthForm({ supabaseConfigured }: { supabaseConfigured: boolean }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [pending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const submittedMode = mode;

    startTransition(async () => {
      const result =
        submittedMode === "login"
          ? await loginAction(formData)
          : await signUpAction(formData);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);

      if (result.data?.signedIn) {
        router.push("/dashboard");
        router.refresh();
        return;
      }

      setMode("login");
      form.reset();
    });
  }

  function handleResendVerification() {
    const form = formRef.current;

    if (!form) {
      toast.error("Enter your email first.");
      return;
    }

    const formData = new FormData(form);

    startTransition(async () => {
      const result = await resendVerificationAction(formData);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
    });
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-3">
        <p className="eyebrow">Secure access</p>
        <CardTitle className="text-3xl">
          {mode === "login" ? "Sign in to HR workspace" : "Create the HR account"}
        </CardTitle>
        <p className="text-sm leading-7 text-muted-foreground">
          {mode === "login"
            ? "Use Supabase email/password authentication for HR access. Employees use their separate employee login screen."
            : "Create an HR account to manage employees, attendance, and reports."}
        </p>
        <div className="inline-flex rounded-full bg-secondary p-1">
          <button
            className={cn(
              buttonVariants({ variant: mode === "login" ? "default" : "ghost", size: "sm" }),
              "rounded-full",
            )}
            disabled={!supabaseConfigured}
            onClick={() => setMode("login")}
            type="button"
          >
            HR login
          </button>
          <button
            className={cn(
              buttonVariants({ variant: mode === "signup" ? "default" : "ghost", size: "sm" }),
              "rounded-full",
            )}
            disabled={!supabaseConfigured}
            onClick={() => setMode("signup")}
            type="button"
          >
            Create account
          </button>
        </div>
        <Link
          className={cn(buttonVariants({ size: "sm", variant: "outline" }), "w-fit rounded-full")}
          href="/employee-login"
        >
          Employee login
        </Link>
        {!supabaseConfigured ? (
          <div className="rounded-2xl border border-amber-300/50 bg-amber-100/70 px-4 py-3 text-sm leading-6 text-amber-950">
            Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`,
            then restart the dev server before using login.
          </div>
        ) : null}
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit} ref={formRef}>
          {mode === "signup" ? (
            <div className="space-y-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input
                disabled={!supabaseConfigured || pending}
                id="full_name"
                name="full_name"
                placeholder="HR Manager"
              />
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              disabled={!supabaseConfigured || pending}
              id="email"
              name="email"
              type="email"
              placeholder="hr@company.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              disabled={!supabaseConfigured || pending}
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              required
            />
          </div>
          <Button className="w-full" disabled={!supabaseConfigured || pending} type="submit">
            {pending
              ? "Please wait..."
              : mode === "login"
                ? "Sign in"
                : "Create HR account"}
          </Button>
          {mode === "login" ? (
            <button
              className="w-full text-sm font-medium text-primary transition hover:opacity-80"
              disabled={!supabaseConfigured || pending}
              onClick={handleResendVerification}
              type="button"
            >
              Resend verification email
            </button>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
