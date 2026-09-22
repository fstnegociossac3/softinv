import { revalidatePath } from "next/cache";

import { NextResponse } from "next/server";

import { columnMappingSchema } from "@/lib/validations/inventory-import";

import { getCurrentAuthContext } from "@/server/services/auth.service";

import { validateAndProcessInventoryImport } from "@/server/services/inventory-import.service";

import { getActionErrorMessage } from "@/server/utils/action-error";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,

  context: RouteContext,
) {
  const auth = await getCurrentAuthContext();

  if (!auth) {
    return NextResponse.json(
      {
        success: false,

        message: "No autenticado.",
      },
      {
        status: 401,
      },
    );
  }

  try {
    const { id } = await context.params;

    const body = await request.json();

    /*
    |--------------------------------------------------------------------------
    | VALIDAR MAPPING
    |--------------------------------------------------------------------------
    */

    const parsed = columnMappingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,

          message: "El mapeo de columnas no es válido.",

          errors: parsed.error.flatten(),
        },
        {
          status: 400,
        },
      );
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDAR ARCHIVO + CONSOLIDAR EN INVENTARIO
    |--------------------------------------------------------------------------
    */

    const result = await validateAndProcessInventoryImport(
      auth,

      id,

      parsed.data,
    );

    /*
    |--------------------------------------------------------------------------
    | REFRESCAR
    |--------------------------------------------------------------------------
    */

    revalidatePath("/imports");

    revalidatePath(`/imports/${id}`);

    if (result.inventory) {
      revalidatePath("/inventory");
    }

    return NextResponse.json({
      success: true,

      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,

        message: getActionErrorMessage(error),
      },
      {
        status: 400,
      },
    );
  }
}
