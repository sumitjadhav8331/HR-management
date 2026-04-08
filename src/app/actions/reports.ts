"use server";

import { revalidatePath } from "next/cache";
import { REPORT_STORAGE_BUCKET } from "@/lib/constants";
import { generateDailyReportPdf } from "@/lib/pdf/daily-report";
import { buildDailyReportSummary } from "@/lib/queries";
import {
  errorResult,
  getActionContext,
  getOptionalString,
  getString,
  successResult,
  validationError,
} from "@/lib/action-utils";
import { reportSchema } from "@/lib/validators";

export async function generateDailyReportAction(formData: FormData) {
  const parsed = reportSchema.safeParse({
    date: getString(formData, "date"),
    overall_notes: getString(formData, "overall_notes") || undefined,
  });

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const { user, supabase } = await getActionContext();
  const summary = await buildDailyReportSummary(
    parsed.data.date,
    getOptionalString(formData, "overall_notes") ?? "",
  );
  const pdfBytes = await generateDailyReportPdf(summary);
  const filePath = `${user.id}/${parsed.data.date}/report-${crypto.randomUUID()}.pdf`;

  const uploadResult = await supabase.storage
    .from(REPORT_STORAGE_BUCKET)
    .upload(filePath, pdfBytes, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadResult.error) {
    return errorResult(uploadResult.error.message);
  }

  const insertResult = await supabase
    .from("reports")
    .insert({
      date: parsed.data.date,
      pdf_url: filePath,
      summary_json: summary,
    })
    .select("id")
    .maybeSingle();

  if (insertResult.error) {
    return errorResult(insertResult.error.message);
  }

  const signedUrlResult = await supabase.storage
    .from(REPORT_STORAGE_BUCKET)
    .createSignedUrl(filePath, 3600);

  revalidatePath("/reports");
  revalidatePath("/dashboard");

  return successResult("Daily report generated.", {
    reportId: insertResult.data?.id ?? null,
    downloadUrl: signedUrlResult.data?.signedUrl ?? null,
  });
}
