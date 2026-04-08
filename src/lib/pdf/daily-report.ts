import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatDate } from "@/lib/utils";
import type { DailyReportSummary } from "@/lib/types";

export async function generateDailyReportPdf(summary: DailyReportSummary) {
  const document = await PDFDocument.create();
  const regularFont = await document.embedFont(StandardFonts.Helvetica);
  const boldFont = await document.embedFont(StandardFonts.HelveticaBold);

  let page = document.addPage([595.28, 841.89]);
  let y = 790;

  const ensurePageSpace = (requiredHeight: number) => {
    if (y > requiredHeight) {
      return;
    }

    page = document.addPage([595.28, 841.89]);
    y = 790;
  };

  const drawLine = (content: string, options?: { size?: number; color?: ReturnType<typeof rgb>; indent?: number }) => {
    ensurePageSpace(70);
    page.drawText(content, {
      x: 48 + (options?.indent ?? 0),
      y,
      size: options?.size ?? 11,
      font: regularFont,
      color: options?.color ?? rgb(0.18, 0.14, 0.12),
    });
    y -= (options?.size ?? 11) + 8;
  };

  const drawWrappedParagraph = (content: string, indent = 0) => {
    const maxWidth = 495 - indent;
    const words = content.split(/\s+/);
    let line = "";

    words.forEach((word) => {
      const candidate = line ? `${line} ${word}` : word;
      const width = regularFont.widthOfTextAtSize(candidate, 11);

      if (width > maxWidth && line) {
        drawLine(line, { indent });
        line = word;
        return;
      }

      line = candidate;
    });

    if (line) {
      drawLine(line, { indent });
    }
  };

  const drawSection = (title: string, items: string[]) => {
    ensurePageSpace(120);
    page.drawText(title, {
      x: 48,
      y,
      size: 14,
      font: boldFont,
      color: rgb(0.14, 0.36, 0.39),
    });
    y -= 24;

    if (items.length === 0) {
      drawLine("No updates recorded.", { color: rgb(0.42, 0.35, 0.32) });
      y -= 6;
      return;
    }

    items.forEach((item) => drawWrappedParagraph(`• ${item}`, 6));
    y -= 8;
  };

  page.drawRectangle({
    x: 0,
    y: 732,
    width: 595.28,
    height: 109,
    color: rgb(0.14, 0.36, 0.39),
  });

  page.drawText("Daily HR Work Report", {
    x: 48,
    y: 790,
    size: 22,
    font: boldFont,
    color: rgb(0.99, 0.97, 0.94),
  });

  page.drawText(`Date: ${formatDate(summary.date)}`, {
    x: 48,
    y: 762,
    size: 11,
    font: regularFont,
    color: rgb(0.93, 0.9, 0.86),
  });

  page.drawText(`Prepared by: ${summary.hrName}`, {
    x: 48,
    y: 744,
    size: 11,
    font: regularFont,
    color: rgb(0.93, 0.9, 0.86),
  });

  y = 700;

  drawSection("Calls Summary", [
    `Total calls made: ${summary.calls.total}`,
    `Interested candidates: ${summary.calls.interested}`,
    `Follow-up required: ${summary.calls.followUp}`,
    `Not interested: ${summary.calls.notInterested}`,
    `Joined conversions: ${summary.calls.joined}`,
    `Conversion rate: ${summary.calls.conversionRate.toFixed(1)}%`,
  ]);

  drawSection("Attendance Summary", [
    `Employees present: ${summary.attendance.presentCount}`,
    ...summary.attendance.employees.map((name) => `Present: ${name}`),
  ]);

  drawSection("Task Summary", [
    `Completed tasks: ${summary.tasks.completed.length}`,
    ...summary.tasks.completed.map((task) => `Completed: ${task}`),
    `Pending tasks: ${summary.tasks.pending.length}`,
    ...summary.tasks.pending.map((task) => `Pending: ${task}`),
  ]);

  drawSection("Daily Notes", summary.notes);
  drawSection("Self Tasks", summary.selfTasks);

  drawSection(
    "HR Notes for Boss",
    summary.overallNotes ? [summary.overallNotes] : [],
  );

  return document.save();
}
