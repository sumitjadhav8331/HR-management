"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BriefcaseBusiness,
  CalendarDays,
  FileSpreadsheet,
  LayoutDashboard,
  Landmark,
  UserCircle2,
  NotebookPen,
  UsersRound,
  X,
} from "lucide-react";
import { useUiStore } from "@/lib/stores/ui-store";
import { cn, getInitials } from "@/lib/utils";
import { SignOutButton } from "@/components/sign-out-button";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/lib/supabase/database.types";

const hrNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employees", label: "Employees", icon: UsersRound },
  { href: "/attendance", label: "Attendance", icon: Activity },
  { href: "/recruitment", label: "Recruitment", icon: BriefcaseBusiness },
  { href: "/tasks", label: "Tasks", icon: NotebookPen },
  { href: "/leaves", label: "Leaves", icon: CalendarDays },
  { href: "/reports", label: "Reports", icon: FileSpreadsheet },
  { href: "/salary", label: "Salary", icon: Landmark },
  { href: "/profile", label: "Profile", icon: UserCircle2 },
];

const employeeNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/attendance", label: "Attendance", icon: Activity },
  { href: "/tasks", label: "Tasks", icon: NotebookPen },
  { href: "/leaves", label: "Leaves", icon: CalendarDays },
  { href: "/salary", label: "Salary", icon: Landmark },
  { href: "/profile", label: "Profile", icon: UserCircle2 },
];

export function Sidebar({
  userLabel,
  email,
  role,
}: {
  userLabel: string;
  email: string;
  role: Tables<"users">["role"];
}) {
  const pathname = usePathname();
  const mobileNavOpen = useUiStore((state) => state.mobileNavOpen);
  const setMobileNavOpen = useUiStore((state) => state.setMobileNavOpen);
  const navItems = role === "hr" ? hrNavItems : employeeNavItems;

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm transition lg:hidden",
          mobileNavOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setMobileNavOpen(false)}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[300px] flex-col bg-sidebar text-sidebar-foreground shadow-2xl transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-white/55">
              {role === "hr" ? "HR OPS" : "EMPLOYEE"}
            </p>
            <h2 className="pt-1 text-2xl font-semibold">PulseBoard</h2>
          </div>
          <Button
            className="lg:hidden"
            variant="ghost"
            size="icon"
            onClick={() => setMobileNavOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex items-center gap-4 border-b border-white/10 px-6 py-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-sm font-semibold">
            {getInitials(userLabel)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{userLabel}</p>
            <p className="truncate text-xs text-white/60">{email}</p>
          </div>
        </div>
        <nav className="flex-1 space-y-2 px-4 py-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileNavOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                  active
                    ? "bg-white/12 text-white shadow-sm"
                    : "text-white/75 hover:bg-white/6 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 px-6 py-5">
          <div className="rounded-3xl bg-white/6 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-white/45">
              {role === "hr" ? "Daily report" : "Your workday"}
            </p>
            <p className="mt-2 text-sm leading-6 text-white/70">
              {role === "hr"
                ? "Track calls, attendance, pending work, and send a PDF summary to leadership."
                : "Check in with location, finish assigned tasks, and keep your records current."}
            </p>
          </div>
          <div className="pt-4">
            <SignOutButton />
          </div>
        </div>
      </aside>
    </>
  );
}
