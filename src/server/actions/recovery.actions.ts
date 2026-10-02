"use server";

import { revalidatePath } from "next/cache";

import {
  closeRecoveryCaseSchema,
  registerRecoveryEventSchema,
} from "@/lib/validations/recovery";

import { requireAuth } from "@/server/services/auth.service";

import {
  closeRecoveryCase,
  registerRecoveryEvent,
} from "@/server/services/recovery.service";

import type { ActionResult } from "@/server/types/action-result";

import { getActionErrorMessage } from "@/server/utils/action-error";

/*
|--------------------------------------------------------------------------
| REGISTRAR RECUPERACIÓN
|--------------------------------------------------------------------------
*/

export async function registerRecoveryEventAction(
  input: unknown,
): Promise<ActionResult> {
  const parsed = registerRecoveryEventSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,

      message: "Revisa los datos de recuperación.",

      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const auth = await requireAuth();

    await registerRecoveryEvent(auth, parsed.data);

    revalidatePath("/recovery");

    revalidatePath(`/recovery/${parsed.data.recoveryCaseId}`);

    return {
      success: true,

      message: "Recuperación registrada correctamente.",
    };
  } catch (error) {
    return {
      success: false,

      message: getActionErrorMessage(error),
    };
  }
}

/*
|--------------------------------------------------------------------------
| CERRAR CASO
|--------------------------------------------------------------------------
*/

export async function closeRecoveryCaseAction(
  input: unknown,
): Promise<ActionResult> {
  const parsed = closeRecoveryCaseSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,

      message: "La información para cerrar el caso no es válida.",
    };
  }

  try {
    const auth = await requireAuth();

    await closeRecoveryCase(auth, parsed.data);

    revalidatePath("/recovery");

    revalidatePath(`/recovery/${parsed.data.recoveryCaseId}`);

    return {
      success: true,

      message:
        parsed.data.status === "recovered"
          ? "Caso cerrado como recuperado."
          : "Caso cerrado sin recuperación.",
    };
  } catch (error) {
    return {
      success: false,

      message: getActionErrorMessage(error),
    };
  }
}
