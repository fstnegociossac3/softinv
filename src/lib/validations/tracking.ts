import { z } from "zod";

import { isValidDateOnly } from "@/lib/tracking/date";

const dateOnlySchema = z.string().trim().refine(isValidDateOnly, {
  message: "La fecha no es válida.",
});

/*
|--------------------------------------------------------------------------
| CREAR SEGUIMIENTO DESDE RECOMENDACIÓN
|--------------------------------------------------------------------------
*/

export const createTrackingSchema = z
  .object({
    companyId: z.string().uuid().optional(),

    inventoryItemId: z.string().uuid(),

    /*
     * Periodo con el que se
     * generó la recomendación.
     *
     * Si no vienen, IRI utilizará
     * su periodo por defecto.
     */
    from: dateOnlySchema.optional(),

    to: dateOnlySchema.optional(),

    dueDate: dateOnlySchema,

    notes: z
      .string()
      .trim()
      .max(2000, "La observación no puede superar 2000 caracteres.")
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.from && data.to && data.from > data.to) {
      ctx.addIssue({
        code: "custom",

        path: ["to"],

        message: "La fecha Hasta no puede ser anterior a Desde.",
      });
    }
  });

export type CreateTrackingInput = z.infer<typeof createTrackingSchema>;

/*
|--------------------------------------------------------------------------
| EJECUTAR
|--------------------------------------------------------------------------
*/

export const executeTrackingSchema = z.object({
  trackingActionId: z.string().uuid(),
});

/*
|--------------------------------------------------------------------------
| CAMBIAR FECHA LÍMITE
|--------------------------------------------------------------------------
*/

export const updateTrackingDueDateSchema = z.object({
  trackingActionId: z.string().uuid(),

  dueDate: dateOnlySchema,
});

/*
|--------------------------------------------------------------------------
| AGREGAR NOTA
|--------------------------------------------------------------------------
*/

export const addTrackingNoteSchema = z.object({
  trackingActionId: z.string().uuid(),

  note: z
    .string()
    .trim()
    .min(1, "Escribe una observación.")
    .max(2000, "La observación no puede superar 2000 caracteres."),
});
