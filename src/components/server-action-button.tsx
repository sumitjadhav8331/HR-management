"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import type { ActionResult } from "@/lib/types";

type ServerActionButtonProps<TArgs extends unknown[]> = {
  action: (...args: TArgs) => Promise<ActionResult>;
  actionArgs: TArgs;
  confirmMessage?: string;
  pendingLabel?: string;
  onSuccessHref?: string;
  silentSuccess?: boolean;
} & Omit<ButtonProps, "onClick">;

export function ServerActionButton<TArgs extends unknown[]>({
  action,
  actionArgs,
  children,
  confirmMessage,
  pendingLabel,
  onSuccessHref,
  silentSuccess = false,
  ...props
}: ServerActionButtonProps<TArgs>) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      disabled={pending || props.disabled}
      {...props}
      onClick={() => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          return;
        }

        startTransition(async () => {
          const result = await action(...actionArgs);

          if (!result.success) {
            toast.error(result.message);
            return;
          }

          if (!silentSuccess) {
            toast.success(result.message);
          }

          if (onSuccessHref) {
            router.push(onSuccessHref);
          }

          router.refresh();
        });
      }}
    >
      {pending ? pendingLabel ?? "Working..." : children}
    </Button>
  );
}
