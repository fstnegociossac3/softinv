import { z } from "zod";

export const inventoryItemSchema = z
  .object({
    sku: z
      .string()
      .trim()
      .min(1, "El SKU es obligatorio.")
      .max(100, "El SKU no puede superar los 100 caracteres."),

    description: z.string().trim().min(1, "La descripción es obligatoria."),

    category: z.string().trim().max(150).nullable().optional(),

    brand: z.string().trim().max(150).nullable().optional(),

    stockQuantity: z.coerce.number().min(0, "El stock no puede ser negativo."),

    unitCost: z.coerce
      .number()
      .min(0, "El costo unitario no puede ser negativo."),

    location: z.string().trim().max(200).nullable().optional(),

    lastMovementDate: z.coerce.date().nullable().optional(),

    sales30d: z.coerce.number().min(0).default(0),

    sales90d: z.coerce.number().min(0).default(0),

    sales180d: z.coerce.number().min(0).default(0),

    status: z.enum(["active", "inactive"]).default("active"),
  })
  .superRefine((data, ctx) => {
    if (data.sales30d > data.sales90d) {
      ctx.addIssue({
        code: "custom",
        path: ["sales90d"],
        message:
          "Las ventas de 90 días no pueden ser menores que las de 30 días.",
      });
    }

    if (data.sales90d > data.sales180d) {
      ctx.addIssue({
        code: "custom",
        path: ["sales180d"],
        message:
          "Las ventas de 180 días no pueden ser menores que las de 90 días.",
      });
    }
  });

export type InventoryItemInput = z.infer<typeof inventoryItemSchema>;
