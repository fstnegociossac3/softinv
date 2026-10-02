import { z } from "zod";

import { isValidDateOnly } from "@/lib/recovery/date";

const dateSchema = z.string().trim().refine(isValidDateOnly, {
  message: "La fecha no es válida.",
});

/*
|--------------------------------------------------------------------------
| REGISTRAR RECUPERACIÓN
|--------------------------------------------------------------------------
*/

export const registerRecoveryEventSchema = z.object({
  recoveryCaseId: z.string().uuid(),

  quantity: z.coerce.number().positive("La cantidad debe ser mayor que 0."),

  recoveredValue: z.coerce
    .number()
    .positive("El monto recuperado debe ser mayor que 0."),

  recoveryDate: dateSchema,

  notes: z.string().trim().max(2000).optional(),
});

export type RegisterRecoveryEventInput = z.infer<
  typeof registerRecoveryEventSchema
>;

/*
|--------------------------------------------------------------------------
| CERRAR CASO
|--------------------------------------------------------------------------
*/

export const closeRecoveryCaseSchema = z.object({
  recoveryCaseId: z.string().uuid(),

  status: z.enum(["recovered", "unrecovered"]),
});

export type CloseRecoveryCaseInput = z.infer<typeof closeRecoveryCaseSchema>;
