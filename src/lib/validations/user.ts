import { z } from "zod";

export const createUserSchema = z.object({
  fullName: z.string().trim().min(2, "El nombre es obligatorio.").max(200),

  email: z.string().trim().toLowerCase().email("Ingresa un correo válido."),

  password: z
    .string()
    .min(10, "La contraseña debe tener al menos 10 caracteres.")
    .max(100),

  companyId: z.string().uuid("Selecciona una empresa válida."),
});

export const updateUserSchema = z.object({
  fullName: z.string().trim().min(2).max(200),

  companyId: z.string().uuid(),
});

export const updateUserEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const userStatusSchema = z.object({
  status: z.enum(["active", "inactive"]),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
