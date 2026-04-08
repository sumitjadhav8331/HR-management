import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function MetricCard({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: string;
  helper: string;
  icon: ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-start justify-between gap-4 p-6">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {label}
          </p>
          <p className="text-4xl font-semibold text-foreground">{value}</p>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowUpRight className="h-4 w-4 text-primary" />
            {helper}
          </p>
        </div>
        <div className="rounded-3xl bg-primary/10 p-3 text-primary">{icon}</div>
      </CardContent>
    </Card>
  );
}
