import { revalidatePath } from "next/cache";

import { NextResponse } from "next/server";

import { suggestMapping } from "@/lib/imports/suggest-mapping";

import { columnMappingSchema } from "@/lib/validations/inventory-import";

import { getCurrentAuthContext } from "@/server/services/auth.service";

import {
  createInventoryImport,
  validateAndProcessInventoryImport,
} from "@/server/services/inventory-import.service";

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

    /*
    |--------------------------------------------------------------------------
    | 1. CARGAR ARCHIVO
    |--------------------------------------------------------------------------
    */

    const created = await createInventoryImport(
      auth,

      file,

      requestedCompanyId,
    );

    /*
    |--------------------------------------------------------------------------
    | 2. DETECTAR COLUMNAS AUTOMÁTICAMENTE
    |--------------------------------------------------------------------------
    */

    const suggestedMapping = suggestMapping(created.headers);

    const parsedMapping = columnMappingSchema.safeParse(suggestedMapping);

    /*
     * Si no logramos reconocer
     * las 4 columnas obligatorias:
     *
     * SKU
     * descripción
     * stock
     * costo
     *
     * enviamos al usuario
     * al mapeo manual.
     */
    if (!parsedMapping.success) {
      return NextResponse.json(
        {
          success: true,

          data: {
            ...created,

            autoProcessed: false,

            requiresMapping: true,

            processing: null,
          },
        },
        {
          status: 201,
        },
      );
    }

    /*
    |--------------------------------------------------------------------------
    | 3. VALIDAR + CONSOLIDAR AUTOMÁTICAMENTE
    |--------------------------------------------------------------------------
    */

    try {
      const processing = await validateAndProcessInventoryImport(
        auth,

        created.importId,

        parsedMapping.data,
      );

      /*
       * Si no hubo filas válidas,
       * dejamos revisar el mapeo.
       */
      if (!processing.inventory) {
        return NextResponse.json(
          {
            success: true,

            data: {
              ...created,

              autoProcessed: false,

              requiresMapping: true,

              processing,
            },
          },
          {
            status: 201,
          },
        );
      }

      /*
      |--------------------------------------------------------------------------
      | 4. INVALIDAR CACHÉ
      |--------------------------------------------------------------------------
      */

      revalidatePath("/inventory");

      revalidatePath("/imports");

      revalidatePath(`/imports/${created.importId}`);

      /*
       * Todo correcto.
       *
       * El producto ya está
       * dentro de inventory_items.
       */
      return NextResponse.json(
        {
          success: true,

          data: {
            ...created,

            autoProcessed: true,

            requiresMapping: false,

            processing,
          },
        },
        {
          status: 201,
        },
      );
    } catch (error) {
      /*
       * El archivo ya fue cargado.
       *
       * Si el procesamiento automático
       * falla, permitimos que el usuario
       * revise manualmente el mapeo.
       */
      return NextResponse.json(
        {
          success: true,

          data: {
            ...created,

            autoProcessed: false,

            requiresMapping: true,

            processing: null,

            autoProcessError: getActionErrorMessage(error),
          },
        },
        {
          status: 201,
        },
      );
    }
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
