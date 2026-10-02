"use server";

import { revalidatePath } from "next/cache";

import {
  addTrackingNoteSchema,
  createTrackingSchema,
  executeTrackingSchema,
  updateTrackingDueDateSchema,
} from "@/lib/validations/tracking";

import { requireAuth } from "@/server/services/auth.service";

import {
  addTrackingNote,
  createTrackingAction,
  executeTrackingAction,
  updateTrackingDueDate,
} from "@/server/services/tracking.service";

import type { ActionResult } from "@/server/types/action-result";

import { getActionErrorMessage } from "@/server/utils/action-error";

/*
|--------------------------------------------------------------------------
| CREAR
|--------------------------------------------------------------------------
*/

export async function createTrackingActionAction(input: unknown): Promise<
  ActionResult<{
    id: string;
  }>
> {
  const parsed = createTrackingSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,

      message: "Revisa los datos del seguimiento.",

      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const auth = await requireAuth();

    const tracking = await createTrackingAction(auth, parsed.data);

    revalidatePath("/tracking");

    revalidatePath("/recommendations");

    return {
      success: true,

      message: "Seguimiento creado correctamente.",

      data: {
        id: tracking.id,
      },
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
| EJECUTAR
|--------------------------------------------------------------------------
*/

export async function executeTrackingActionAction(
  input: unknown,
): Promise<ActionResult> {
  const parsed = executeTrackingSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,

      message: "La acción seleccionada no es válida.",
    };
  }

  try {
    const auth = await requireAuth();

    await executeTrackingAction(auth, parsed.data.trackingActionId);

    revalidatePath("/tracking");

    revalidatePath("/recovery");

    return {
      success: true,

      message: "Acción marcada como ejecutada.",
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
| CAMBIAR FECHA LÍMITE
|--------------------------------------------------------------------------
*/

export async function updateTrackingDueDateAction(
  input: unknown,
): Promise<ActionResult> {
  const parsed = updateTrackingDueDateSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,

      message: "Revisa la nueva fecha límite.",

      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const auth = await requireAuth();

    await updateTrackingDueDate(
      auth,
      parsed.data.trackingActionId,

      parsed.data.dueDate,
    );

    revalidatePath("/tracking");

    return {
      success: true,

      message: "Fecha límite actualizada.",
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
| NOTA
|--------------------------------------------------------------------------
*/

export async function addTrackingNoteAction(
  input: unknown,
): Promise<ActionResult> {
  const parsed = addTrackingNoteSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,

      message: "Revisa la observación.",

      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const auth = await requireAuth();

    await addTrackingNote(
      auth,

      parsed.data.trackingActionId,

      parsed.data.note,
    );

    revalidatePath("/tracking");

    return {
      success: true,

      message: "Observación agregada.",
    };
  } catch (error) {
    return {
      success: false,

      message: getActionErrorMessage(error),
    };
  }
}
