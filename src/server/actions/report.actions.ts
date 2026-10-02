"use server";

import { revalidatePath } from "next/cache";

import { generateReportSchema } from "@/lib/validations/report";

import { requireAuth } from "@/server/services/auth.service";

import { generateReport } from "@/server/services/report.service";

import type { ActionResult } from "@/server/types/action-result";

import { getActionErrorMessage } from "@/server/utils/action-error";

export async function generateReportAction(input: unknown): Promise<
  ActionResult<{
    id: string;

    reportType:
      | "executive"
      | "critical_inventory"
      | "recommendations"
      | "recovery";

    dateFrom: string;

    dateTo: string;
  }>
> {
  const parsed = generateReportSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,

      message: "Revisa los datos del reporte.",

      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const auth = await requireAuth();

    const report = await generateReport(auth, parsed.data);

    revalidatePath("/reports");

    return {
      success: true,

      message: "Reporte generado correctamente.",

      data: {
        id: report.id,

        reportType: report.reportType,

        dateFrom: report.dateFrom,

        dateTo: report.dateTo,
      },
    };
  } catch (error) {
    return {
      success: false,

      message: getActionErrorMessage(error),
    };
  }
}
