"use client";

import type { ReactNode } from "react";
import { Menu } from "lucide-react";
import { useUiStore } from "@/lib/stores/ui-store";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";

export function AppShell({
  children,
  userLabel,
  email,
}: {
  children: ReactNode;
  userLabel: string;
  email: string;
}) {
  const toggleMobileNav = useUiStore((state) => state.toggleMobileNav);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[300px_minmax(0,1fr)]">
      <Sidebar userLabel={userLabel} email={email} />
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
                <p className="eyebrow">Operations cockpit</p>
                <h2 className="text-xl font-semibold">HR management workspace</h2>
              </div>
            </div>
            <p className="hidden text-sm text-muted-foreground sm:block">
              Centralized recruiting, attendance, task, and reporting workflows.
            </p>
          </div>
        </header>
        <main className="page-wrap">{children}</main>
      </div>
    </div>
  );
}
