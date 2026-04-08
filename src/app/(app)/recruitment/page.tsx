import Link from "next/link";
import { Trash2, UserRoundPlus } from "lucide-react";
import { deleteCandidateAction } from "@/app/actions/recruitment";
import { CandidateForm } from "@/components/forms/candidate-form";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { ServerActionButton } from "@/components/server-action-button";
import { StatusBadge } from "@/components/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getRecruitmentPageData } from "@/lib/queries";
import type { AsyncSearchParams } from "@/lib/search-params";
import { getParamValue, toUrlSearchParams } from "@/lib/search-params";
import { dateKey, formatDate, parsePage } from "@/lib/utils";
import { PhoneCall, Target } from "lucide-react";

export default async function RecruitmentPage({
  searchParams,
}: {
  searchParams: AsyncSearchParams;
}) {
  const resolvedSearchParams = await searchParams;
  const page = parsePage(getParamValue(resolvedSearchParams.page));
  const query = getParamValue(resolvedSearchParams.query) ?? "";
  const status = getParamValue(resolvedSearchParams.status) ?? "";
  const editId = getParamValue(resolvedSearchParams.edit);
  const recruitmentData = await getRecruitmentPageData({
    page,
    query,
    status,
    editId,
  });
  const urlSearchParams = toUrlSearchParams(resolvedSearchParams);

  return (
    <>
      <PageHeader
        eyebrow="Recruitment"
        title="Candidate outreach and conversion tracking"
        description="Capture call outcomes, expected joins, and response notes so recruitment performance stays measurable."
      >
        <form className="flex flex-wrap gap-3" method="get">
          <Input defaultValue={query} name="query" placeholder="Search candidates" />
          <Select defaultValue={status} name="status">
            <option value="">All call statuses</option>
            <option value="interested">Interested</option>
            <option value="follow_up">Follow-up</option>
            <option value="not_interested">Not interested</option>
          </Select>
          <Button type="submit" variant="secondary">
            Filter
          </Button>
        </form>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          helper="All candidate call logs"
          icon={<PhoneCall className="h-5 w-5" />}
          label="Total Calls"
          value={String(recruitmentData.metrics.totalCalls)}
        />
        <MetricCard
          helper="Positive responses captured"
          icon={<UserRoundPlus className="h-5 w-5" />}
          label="Interested"
          value={String(recruitmentData.metrics.interested)}
        />
        <MetricCard
          helper="Candidates still in the funnel"
          icon={<Target className="h-5 w-5" />}
          label="Follow-Ups"
          value={String(recruitmentData.metrics.followUps)}
        />
        <MetricCard
          helper="Joined candidates vs calls made"
          icon={<Target className="h-5 w-5" />}
          label="Conversion %"
          value={String(recruitmentData.metrics.conversionRate)}
        />
      </div>

      <div className="section-grid">
        <div className="surface-card p-6">
          {recruitmentData.candidates.length === 0 ? (
            <EmptyState
              title="No candidates logged"
              description="Add the first candidate interaction or loosen the filters."
            />
          ) : (
            <>
              <div className="table-shell">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Call Status</TableHead>
                      <TableHead>Final Status</TableHead>
                      <TableHead>Expected Join</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recruitmentData.candidates.map((candidate) => (
                      <TableRow key={candidate.id}>
                        <TableCell>
                          <div>
                            <p className="font-semibold">{candidate.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {candidate.phone}
                            </p>
                            {candidate.response ? (
                              <p className="pt-1 text-xs text-muted-foreground">
                                {candidate.response}
                              </p>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>{candidate.position}</TableCell>
                        <TableCell>
                          <StatusBadge value={candidate.call_status} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge value={candidate.final_status} />
                        </TableCell>
                        <TableCell>
                          {candidate.expected_joining_date
                            ? formatDate(candidate.expected_joining_date)
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Link
                              className={buttonVariants({ size: "sm", variant: "outline" })}
                              href={`/recruitment?edit=${candidate.id}`}
                            >
                              Edit
                            </Link>
                            <ServerActionButton
                              action={deleteCandidateAction}
                              actionArgs={[candidate.id]}
                              confirmMessage="Delete this candidate log?"
                              pendingLabel="Deleting..."
                              size="sm"
                              variant="ghost"
                            >
                              <Trash2 className="h-4 w-4" />
                            </ServerActionButton>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Pagination
                pagination={recruitmentData.pagination}
                pathname="/recruitment"
                searchParams={urlSearchParams}
              />
            </>
          )}
        </div>

        <CandidateForm
          defaultCallDate={dateKey(new Date())}
          initialData={recruitmentData.editingCandidate}
        />
      </div>
    </>
  );
}
