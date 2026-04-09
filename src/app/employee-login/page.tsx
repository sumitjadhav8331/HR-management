import Link from "next/link";
import { BriefcaseBusiness, ClipboardCheck, ShieldUser } from "lucide-react";
import { EmployeeAuthForm } from "@/components/forms/employee-auth-form";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentSession, getUserLabel } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function EmployeeLoginPage() {
  const session = await getCurrentSession();

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl items-center gap-10 px-4 py-10 lg:grid-cols-[minmax(0,1.1fr)_420px] lg:px-8">
        <section className="space-y-8">
          <div className="space-y-5">
            <p className="eyebrow">Employee workspace</p>
            <h1 className="max-w-3xl text-5xl font-semibold leading-tight text-foreground sm:text-6xl">
              Check in, track tasks, and follow your workday from one place.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              Employee login is separate from HR login. Use the email and password assigned
              on your employee profile to access attendance, tasks, leave requests, and salary.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="space-y-3 p-6">
                <ShieldUser className="h-8 w-8 text-primary" />
                <h2 className="text-lg font-semibold">Employee-only login</h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Sign in with the credentials saved directly on your employee account.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-3 p-6">
                <ClipboardCheck className="h-8 w-8 text-primary" />
                <h2 className="text-lg font-semibold">Daily attendance</h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Check in with location, check out later, and keep your daily record updated.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-3 p-6">
                <BriefcaseBusiness className="h-8 w-8 text-primary" />
                <h2 className="text-lg font-semibold">Assigned work</h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Review assigned tasks, leave requests, and salary records from your own dashboard.
                </p>
              </CardContent>
            </Card>
          </div>
          {session ? (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="space-y-4 p-6">
                <div className="space-y-2">
                  <p className="eyebrow">Session active</p>
                  <h2 className="text-xl font-semibold">
                    {getUserLabel(session.profile, session.user.email)}
                  </h2>
                  <p className="text-sm leading-6 text-muted-foreground">
                    You are currently signed in as{" "}
                    {session.profile.role === "employee" ? "an employee" : "an HR user"}.
                    You can keep working from the dashboard or sign in below to switch to
                    an employee account.
                  </p>
                </div>
                <Link className={buttonVariants({ variant: "outline" })} href="/dashboard">
                  Open dashboard
                </Link>
              </CardContent>
            </Card>
          ) : null}
        </section>
        <div className="flex justify-center lg:justify-end">
          <EmployeeAuthForm />
        </div>
      </div>
    </div>
  );
}
