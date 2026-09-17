"use server";

import { revalidatePath } from "next/cache";

import { companySchema, companyStatusSchema } from "@/lib/validations/company";

import { requireAuth } from "@/server/services/auth.service";

import {
  createCompany,
  updateCompany,
  changeCompanyStatus,
} from "@/server/services/company.service";

import { getActionErrorMessage } from "@/server/utils/action-error";

import type { ActionResult } from "@/server/types/action-result";

// ACCION DE CREAR EMPRESA
export async function createCompanyAction(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = companySchema.safeParse({
    name: formData.get("name"),

    ruc: formData.get("ruc"),

    sector: formData.get("sector"),

    address: formData.get("address"),

    country: formData.get("country") || "Perú",

    timezone: formData.get("timezone") || "America/Lima",

    currency: formData.get("currency") || "PEN",
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Revisa los datos ingresados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const auth = await requireAuth();

    await createCompany(auth, parsed.data);

    revalidatePath("/admin/companies");

    return {
      success: true,
      message: "Empresa creada correctamente.",
    };
  } catch (error) {
    return {
      success: false,
      message: getActionErrorMessage(error),
    };
  }
}

// ACCION DE ACTUALIZAR UNA EMPRESA
export async function updateCompanyAction(
  companyId: string,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = companySchema.safeParse({
    name: formData.get("name"),

    ruc: formData.get("ruc"),

    sector: formData.get("sector"),

    address: formData.get("address"),

    country: formData.get("country") || "Perú",

    timezone: formData.get("timezone") || "America/Lima",

    currency: formData.get("currency") || "PEN",
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Revisa los datos.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const auth = await requireAuth();

    await updateCompany(auth, companyId, parsed.data);

    revalidatePath("/admin/companies");

    return {
      success: true,
      message: "Empresa actualizada correctamente.",
    };
  } catch (error) {
    return {
      success: false,
      message: getActionErrorMessage(error),
    };
  }
}

// ACCION DE CAMBIAR DE ESTADO DE UNA EMPRESA. ES PARA ACTIVAR Y DESACTIVAR
export async function changeCompanyStatusAction(
  companyId: string,
  status: "active" | "inactive",
): Promise<ActionResult> {
  const parsed = companyStatusSchema.safeParse({
    status,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Estado inválido.",
    };
  }

  try {
    const auth = await requireAuth();

    await changeCompanyStatus(auth, companyId, parsed.data.status);

    revalidatePath("/admin/companies");

    return {
      success: true,
      message:
        status === "active" ? "Empresa activada." : "Empresa desactivada.",
    };
  } catch (error) {
    return {
      success: false,
      message: getActionErrorMessage(error),
    };
  }
}
