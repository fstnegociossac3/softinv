import { z } from "zod";

export const inventoryItemSchema = z
  .object({
    // mismos campos anteriores...
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
