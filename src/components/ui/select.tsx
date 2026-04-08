import * as React from "react";
import { cn } from "@/lib/utils";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => (
    <select
      className={cn(
        "flex h-11 w-full rounded-2xl border border-border/80 bg-input px-4 text-sm text-foreground shadow-sm transition",
        className,
      )}
      ref={ref}
      {...props}
    >
      {children}
    </select>
  ),
);

Select.displayName = "Select";

export { Select };
