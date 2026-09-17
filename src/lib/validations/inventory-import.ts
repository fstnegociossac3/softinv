import { z } from "zod";

export const columnMappingSchema = z
  .object({
    sku: z.string().trim().min(1),

    description: z.string().trim().min(1),

    stockQuantity: z.string().trim().min(1),

    unitCost: z.string().trim().min(1),

    category: z.string().trim().optional(),

    brand: z.string().trim().optional(),

    lastMovementDate: z.string().trim().optional(),

    sales30d: z.string().trim().optional(),

    sales90d: z.string().trim().optional(),

    sales180d: z.string().trim().optional(),
  })
  .superRefine((mapping, ctx) => {
    const usedColumns = Object.values(mapping).filter(
      (value): value is string => Boolean(value),
    );

    if (new Set(usedColumns).size !== usedColumns.length) {
      ctx.addIssue({
        code: "custom",

        message:
          "Una columna del Excel no puede asignarse a dos campos diferentes.",
      });
    }
  });

export type ColumnMapping = z.infer<typeof columnMappingSchema>;
