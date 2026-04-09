"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AuthFormClientOnlyInner = dynamic(
  () => import("@/components/forms/auth-form").then((mod) => mod.AuthForm),
  {
    ssr: false,
    loading: () => (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3">
          <p className="eyebrow">Secure access</p>
          <CardTitle className="text-3xl">Loading sign in</CardTitle>
          <p className="text-sm leading-7 text-muted-foreground">
            Preparing the authentication panel.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-11 rounded-2xl bg-secondary/60" />
            <div className="h-11 rounded-2xl bg-secondary/60" />
            <div className="h-11 rounded-2xl bg-secondary/60" />
          </div>
        </CardContent>
      </Card>
    ),
  },
);

export function AuthFormClientOnly({
  supabaseConfigured,
}: {
  supabaseConfigured: boolean;
}) {
  return <AuthFormClientOnlyInner supabaseConfigured={supabaseConfigured} />;
}
