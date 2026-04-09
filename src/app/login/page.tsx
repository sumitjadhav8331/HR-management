import { redirect } from "next/navigation";
import { ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { AuthFormClientOnly } from "@/components/forms/auth-form-client-only";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();
  const supabaseConfigured = isSupabaseConfigured();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl items-center gap-10 px-4 py-10 lg:grid-cols-[minmax(0,1.1fr)_420px] lg:px-8">
        <section className="space-y-8">
          <div className="space-y-5">
            <p className="eyebrow">HR productivity system</p>
            <h1 className="max-w-3xl text-5xl font-semibold leading-tight text-foreground sm:text-6xl">
              Recruit smarter, track teams daily, and turn work into proof.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              One secure HR workspace for hiring calls, employee records, attendance,
              leaves, task execution, and professional PDF reports for leadership.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="space-y-3 p-6">
                <ShieldCheck className="h-8 w-8 text-primary" />
                <h2 className="text-lg font-semibold">Protected by Supabase</h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Email/password auth, secure server actions, and RLS-backed data access.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-3 p-6">
                <TrendingUp className="h-8 w-8 text-primary" />
                <h2 className="text-lg font-semibold">Daily visibility</h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Calls, attendance, pending work, and employee status stay measurable.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-3 p-6">
                <Sparkles className="h-8 w-8 text-primary" />
                <h2 className="text-lg font-semibold">PDF proof of work</h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Generate structured work reports and share leadership-ready summaries.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
        <div className="flex justify-center lg:justify-end">
          <AuthFormClientOnly supabaseConfigured={supabaseConfigured} />
        </div>
      </div>
    </div>
  );
}
