"use client";

import type { ReactNode } from "react";
import { Menu } from "lucide-react";
import { useUiStore } from "@/lib/stores/ui-store";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/lib/supabase/database.types";

export function AppShell({
  children,
  userLabel,
  email,
  role,
}: {
  children: ReactNode;
  userLabel: string;
  email: string;
  role: Tables<"users">["role"];
}) {
  const toggleMobileNav = useUiStore((state) => state.toggleMobileNav);
  const workspaceLabel = role === "hr" ? "HR management workspace" : "Employee workspace";
  const workspaceDescription =
    role === "hr"
      ? "Centralized recruiting, attendance, task, and reporting workflows."
      : "Track attendance, complete assigned work, review salary, and manage leave from one place.";

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[300px_minmax(0,1fr)]">
      <Sidebar email={email} role={role} userLabel={userLabel} />
      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur">
          <div className="page-wrap flex-row items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Button
                className="lg:hidden"
                variant="outline"
                size="icon"
                onClick={toggleMobileNav}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <p className="eyebrow">
                  {role === "hr" ? "Operations cockpit" : "Workday hub"}
                </p>
                <h2 className="text-xl font-semibold">{workspaceLabel}</h2>
              </div>
            </div>
            <p className="hidden text-sm text-muted-foreground sm:block">
              {workspaceDescription}
            </p>
          </div>
        </header>
        <main className="page-wrap">{children}</main>
      </div>
    </div>
  );
}
