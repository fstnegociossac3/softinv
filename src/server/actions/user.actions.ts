"use server";

import { revalidatePath } from "next/cache";

import {
  createUserSchema,
  updateUserEmailSchema,
  updateUserSchema,
  userStatusSchema,
} from "@/lib/validations/user";

import { requireAuth } from "@/server/services/auth.service";

import {
  changeManagedUserStatus,
  createManagedUser,
  updateManagedUser,
  updateManagedUserEmail,
} from "@/server/services/user.service";

import type { ActionResult } from "@/server/types/action-result";

import { getActionErrorMessage } from "@/server/utils/action-error";

// ACTION DE CREAR USUARIO
export async function createUserAction(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = createUserSchema.safeParse({
    fullName: formData.get("fullName"),

    email: formData.get("email"),

    password: formData.get("password"),

    companyId: formData.get("companyId"),
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

    await createManagedUser(auth, parsed.data);

    revalidatePath("/admin/users");

    return {
      success: true,
      message: "Usuario creado correctamente.",
    };
  } catch (error) {
    return {
      success: false,
      message: getActionErrorMessage(error),
    };
  }
}

// ACTION DE ACTUALIZAR USUARIO
export async function updateUserAction(
  userId: string,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = updateUserSchema.safeParse({
    fullName: formData.get("fullName"),

    companyId: formData.get("companyId"),
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

    await updateManagedUser(auth, userId, parsed.data);

    revalidatePath("/admin/users");

    return {
      success: true,
      message: "Usuario actualizado correctamente.",
    };
  } catch (error) {
    return {
      success: false,
      message: getActionErrorMessage(error),
    };
  }
}

// ACTION DE CAMBIAR CORREO ELECTRONICO O EMAIL
export async function updateUserEmailAction(
  userId: string,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = updateUserEmailSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Correo inválido.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const auth = await requireAuth();

    await updateManagedUserEmail(auth, userId, parsed.data.email);

    revalidatePath("/admin/users");

    return {
      success: true,
      message: "Correo actualizado correctamente.",
    };
  } catch (error) {
    return {
      success: false,
      message: getActionErrorMessage(error),
    };
  }
}

// ACTION DE ACTIVAR Y DESACTIVAR USUARIO 
export async function changeUserStatusAction(
  userId: string,
  status: "active" | "inactive",
): Promise<ActionResult> {
  const parsed = userStatusSchema.safeParse({
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

    await changeManagedUserStatus(auth, userId, parsed.data.status);

    revalidatePath("/admin/users");

    return {
      success: true,

      message:
        status === "active" ? "Usuario activado." : "Usuario desactivado.",
    };
  } catch (error) {
    return {
      success: false,
      message: getActionErrorMessage(error),
    };
  }
}
