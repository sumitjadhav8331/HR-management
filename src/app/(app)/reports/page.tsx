import Link from "next/link";
import { Download, FileSpreadsheet } from "lucide-react";
import { ReportGenerator } from "@/components/forms/report-generator";
import { PageHeader } from "@/components/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getReportsPageData } from "@/lib/queries";
import type { AsyncSearchParams } from "@/lib/search-params";
import { getParamValue, toUrlSearchParams } from "@/lib/search-params";
import { formatDate, parsePage } from "@/lib/utils";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: AsyncSearchParams;
}) {
  const resolvedSearchParams = await searchParams;
  const page = parsePage(getParamValue(resolvedSearchParams.page));
  const selectedDate = getParamValue(resolvedSearchParams.date);
  const reportData = await getReportsPageData({ page, date: selectedDate });
  const urlSearchParams = toUrlSearchParams(resolvedSearchParams);

  return (
    <>
      <PageHeader
        eyebrow="Reports"
        title="Daily work reports and PDF archive"
        description="Preview the selected day's output, generate a professional report, and download previously stored PDFs from Supabase Storage."
      >
        <form className="flex flex-wrap gap-3" method="get">
          <Input
            defaultValue={reportData.selectedDate}
            name="date"
            type="date"
          />
          <Button type="submit" variant="secondary">
            Preview day
          </Button>
        </form>
      </PageHeader>

      <div className="section-grid">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Selected day preview</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-border/70 bg-white/70 p-4">
                <p className="eyebrow">Calls summary</p>
                <div className="space-y-2 pt-3 text-sm text-muted-foreground">
                  <p>Total calls: {reportData.preview.calls.total}</p>
                  <p>Interested: {reportData.preview.calls.interested}</p>
                  <p>Follow-up: {reportData.preview.calls.followUp}</p>
                  <p>Joined: {reportData.preview.calls.joined}</p>
                </div>
              </div>
              <div className="rounded-3xl border border-border/70 bg-white/70 p-4">
                <p className="eyebrow">Task summary</p>
                <div className="space-y-2 pt-3 text-sm text-muted-foreground">
                  <p>Completed tasks: {reportData.preview.tasks.completed.length}</p>
                  <p>Pending tasks: {reportData.preview.tasks.pending.length}</p>
                  <p>Employees present: {reportData.preview.attendance.presentCount}</p>
                  <p>Notes captured: {reportData.preview.notes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Generated reports archive</CardTitle>
            </CardHeader>
            <CardContent>
              {reportData.reports.length === 0 ? (
                <EmptyState
                  icon={<FileSpreadsheet className="h-6 w-6" />}
                  title="No PDFs generated yet"
                  description="Generate the first daily report to build the archive."
                />
              ) : (
                <>
                  <div className="table-shell">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>HR Name</TableHead>
                          <TableHead>Calls</TableHead>
                          <TableHead>Present</TableHead>
                          <TableHead>Tasks Done</TableHead>
                          <TableHead className="text-right">Download</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.reports.map((report) => (
                          <TableRow key={report.id}>
                            <TableCell>{formatDate(report.date)}</TableCell>
                            <TableCell>{report.summary.hrName}</TableCell>
                            <TableCell>{report.summary.calls.total}</TableCell>
                            <TableCell>{report.summary.attendance.presentCount}</TableCell>
                            <TableCell>{report.summary.tasks.completed.length}</TableCell>
                            <TableCell>
                              <div className="flex justify-end">
                                {report.downloadUrl ? (
                                  <Link
                                    className={buttonVariants({
                                      size: "sm",
                                      variant: "outline",
                                    })}
                                    href={report.downloadUrl}
                                    target="_blank"
                                  >
                                    <Download className="h-4 w-4" />
                                    PDF
                                  </Link>
                                ) : (
                                  <span className="text-sm text-muted-foreground">
                                    Unavailable
                                  </span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <Pagination
                    pagination={reportData.pagination}
                    pathname="/reports"
                    searchParams={urlSearchParams}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <ReportGenerator selectedDate={reportData.selectedDate} />
      </div>
    </>
  );
}
