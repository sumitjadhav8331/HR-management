import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { getUserLabel, requireProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, profile } = await requireProfile();

  return (
    <AppShell
      email={user.email ?? profile?.email ?? ""}
      userLabel={getUserLabel(profile, user.email)}
    >
      {children}
    </AppShell>
  );
}
