import { z } from "zod";

function emptyToUndefined(value: unknown) {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
}

export const companySchema = z.object({
  name: z.string().trim().min(2, "El nombre es obligatorio.").max(200),

  ruc: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .regex(/^\d{11}$/, "El RUC debe contener 11 dígitos.")
      .optional(),
  ),

  sector: z.preprocess(emptyToUndefined, z.string().trim().max(150).optional()),

  address: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(500).optional(),
  ),

  country: z.string().trim().min(2).max(100).default("Perú"),

  timezone: z.string().trim().min(2).max(100).default("America/Lima"),

  currency: z.string().trim().length(3).default("PEN"),
});

export const companyStatusSchema = z.object({
  status: z.enum(["active", "inactive"]),
});

export type CompanyInput = z.infer<typeof companySchema>;
