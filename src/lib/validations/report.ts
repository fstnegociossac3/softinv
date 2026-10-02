import { z } from "zod";

import { REPORT_LIMITS } from "@/config/reports";

import { countInclusiveDays, isValidDateOnly } from "@/lib/recovery/date";

const dateSchema = z.string().trim().refine(isValidDateOnly, {
  message: "La fecha no es válida.",
});

/*
|--------------------------------------------------------------------------
| GENERAR
|--------------------------------------------------------------------------
*/

export const generateReportSchema = z
  .object({
    companyId: z.string().uuid().optional(),

    reportType: z.enum([
      "executive",
      "critical_inventory",
      "recommendations",
      "recovery",
    ]),

    from: dateSchema,

    to: dateSchema,
  })
  .superRefine((data, ctx) => {
    if (data.from > data.to) {
      ctx.addIssue({
        code: "custom",

        path: ["to"],

        message: "La fecha Hasta no puede ser anterior a Desde.",
      });

      return;
    }

    const days = countInclusiveDays(data.from, data.to);

    if (days > REPORT_LIMITS.MAX_PERIOD_DAYS) {
      ctx.addIssue({
        code: "custom",

        path: ["to"],

        message: `El periodo máximo es de ${REPORT_LIMITS.MAX_PERIOD_DAYS} días.`,
      });
    }
  });

export type GenerateReportInput = z.infer<typeof generateReportSchema>;

/*
|--------------------------------------------------------------------------
| EXPORTAR
|--------------------------------------------------------------------------
*/

export const reportExportSchema = z.object({
  reportId: z.string().uuid(),

  format: z.enum(["pdf", "excel"]),
});

export type ReportExportInput = z.infer<typeof reportExportSchema>;
