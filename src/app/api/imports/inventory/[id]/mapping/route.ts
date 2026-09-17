import { NextResponse } from "next/server";

import { columnMappingSchema } from "@/lib/validations/inventory-import";

import { getCurrentAuthContext } from "@/server/services/auth.service";

import { processInventoryImportMapping } from "@/server/services/inventory-import.service";

import { getActionErrorMessage } from "@/server/utils/action-error";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
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

    const result = await processInventoryImportMapping(auth, id, parsed.data);

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
