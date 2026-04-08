"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        closeButton
        expand
        richColors
        position="top-right"
        toastOptions={{
          className: "border border-border/60 bg-card text-foreground shadow-lg",
        }}
      />
    </>
  );
}
