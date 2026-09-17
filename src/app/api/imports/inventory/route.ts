import { NextResponse } from "next/server";

import { getCurrentAuthContext } from "@/server/services/auth.service";

import { createInventoryImport } from "@/server/services/inventory-import.service";

import { getActionErrorMessage } from "@/server/utils/action-error";

export const runtime = "nodejs";

export async function POST(request: Request) {
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
    const formData = await request.formData();

    const file = formData.get("file");

    const requestedCompanyId = formData.get("companyId")?.toString() ?? null;

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "Debes seleccionar un archivo.",
        },
        {
          status: 400,
        },
      );
    }

    const result = await createInventoryImport(auth, file, requestedCompanyId);

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      {
        status: 201,
      },
    );
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
