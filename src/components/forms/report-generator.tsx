"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { generateDailyReportAction } from "@/app/actions/reports";
import { useUiStore } from "@/lib/stores/ui-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ReportGenerator({ selectedDate }: { selectedDate: string }) {
  const router = useRouter();
  const reportDate = useUiStore((state) => state.reportDate);
  const setReportDate = useUiStore((state) => state.setReportDate);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setReportDate(selectedDate);
  }, [reportDate, selectedDate, setReportDate]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate daily PDF report</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);

            startTransition(async () => {
              const result = await generateDailyReportAction(formData);

              if (!result.success) {
                toast.error(result.message);
                return;
              }

              toast.success(result.message);
              if (result.data?.downloadUrl) {
                window.open(result.data.downloadUrl, "_blank", "noopener,noreferrer");
              }
              router.push(`/reports?date=${formData.get("date")}`);
              router.refresh();
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="report-date">Report date</Label>
            <Input
              id="report-date"
              name="date"
              type="date"
              value={reportDate || selectedDate}
              onChange={(event) => setReportDate(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="overall-notes">Notes for boss</Label>
            <Textarea
              id="overall-notes"
              name="overall_notes"
              placeholder="Summarize what leadership should notice today."
            />
          </div>
          <Button disabled={pending} type="submit">
            {pending ? "Generating PDF..." : "Generate report"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
