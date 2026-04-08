"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { signOutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const result = await signOutAction();

          if (!result.success) {
            toast.error(result.message);
            return;
          }

          toast.success(result.message);
          router.push("/login");
          router.refresh();
        });
      }}
    >
      <LogOut className="h-4 w-4" />
      {pending ? "Signing out..." : "Sign out"}
    </Button>
  );
}
