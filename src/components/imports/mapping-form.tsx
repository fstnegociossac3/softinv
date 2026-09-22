"use client";

import { useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { Loader2, WandSparkles } from "lucide-react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Label } from "@/components/ui/label";

import { suggestMapping } from "@/lib/imports/suggest-mapping";

type Mapping = Record<string, string>;

type Props = {
  importId: string;

  headers: string[];

  existingMapping: Record<string, string> | null;
};

const fields = [
  {
    key: "sku",

    label: "SKU / Código",

    required: true,
  },

  {
    key: "description",

    label: "Descripción",

    required: true,
  },

  {
    key: "stockQuantity",

    label: "Stock",

    required: true,
  },

  {
    key: "unitCost",

    label: "Costo unitario",

    required: true,
  },

  {
    key: "category",

    label: "Categoría",

    required: false,
  },

  {
    key: "brand",

    label: "Marca",

    required: false,
  },

  {
    key: "location",

    label: "Ubicación / Almacén",

    required: false,
  },

  {
    key: "lastMovementDate",

    label: "Último movimiento",

    required: false,
  },

  {
    key: "sales30d",

    label: "Ventas 30 días",

    required: false,
  },

  {
    key: "sales90d",

    label: "Ventas 90 días",

    required: false,
  },

  {
    key: "sales180d",

    label: "Ventas 180 días",

    required: false,
  },
] as const;

export function MappingForm({
  importId,

  headers,

  existingMapping,
}: Props) {
  const router = useRouter();

  /*
   * Sugerencia automática.
   */
  const suggested = useMemo(
    () => suggestMapping(headers),

    [headers],
  );

  const [mapping, setMapping] = useState<Mapping>(existingMapping ?? suggested);

  const [loading, setLoading] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | APLICAR SUGERENCIAS
  |--------------------------------------------------------------------------
  */

  function applySuggestions() {
    setMapping(suggestMapping(headers));

    toast.success("Se aplicaron las sugerencias automáticas.");
  }

  /*
  |--------------------------------------------------------------------------
  | VALIDAR + IMPORTAR
  |--------------------------------------------------------------------------
  */

  async function process() {
    const requiredFields = ["sku", "description", "stockQuantity", "unitCost"];

    /*
     * Campos obligatorios.
     */
    const missing = requiredFields.filter((field) => !mapping[field]);

    if (missing.length) {
      toast.error("Completa todos los campos obligatorios.");

      return;
    }

    /*
     * Evitar usar la misma
     * columna dos veces.
     */
    const selectedColumns = Object.values(mapping).filter(Boolean);

    if (new Set(selectedColumns).size !== selectedColumns.length) {
      toast.error("Una columna del archivo no puede utilizarse dos veces.");

      return;
    }

    try {
      setLoading(true);

      /*
       * Este endpoint ahora:
       *
       * 1. valida
       * 2. normaliza
       * 3. crea / actualiza inventario
       * 4. crea snapshots
       * 5. crea movimientos
       */
      const response = await fetch(
        `/api/imports/inventory/${importId}/mapping`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(mapping),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ?? "No se pudo procesar la importación.",
        );
      }

      const validation = result.data?.validation;

      const inventory = result.data?.inventory;

      /*
      |--------------------------------------------------------------------------
      | SIN FILAS VÁLIDAS
      |--------------------------------------------------------------------------
      */

      if (!inventory) {
        toast.error(
          "No se encontraron filas válidas para agregar al inventario.",
        );

        router.push(`/imports/${importId}`);

        router.refresh();

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | PROCESADO
      |--------------------------------------------------------------------------
      */

      toast.success(
        `Inventario actualizado: ${inventory.createdItems} productos creados y ${inventory.updatedItems} actualizados.`,
      );

      /*
       * Informar filas omitidas.
       */
      const omitted =
        (validation?.invalidRows ?? 0) + (validation?.duplicateRows ?? 0);

      if (omitted > 0) {
        toast.warning(
          `${omitted} filas fueron omitidas por errores o duplicados.`,
        );
      }

      /*
       * Terminamos directamente
       * en Inventario.
       */
      router.push("/inventory");

      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo procesar la importación.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Relacionar columnas</CardTitle>

        <CardDescription>
          Indica qué columna del archivo corresponde a cada campo. Al continuar,
          los registros válidos se cargarán automáticamente en Inventario.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* ================================================================
            SUGERIR
        ================================================================= */}

        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={applySuggestions}
            disabled={loading}
          >
            <WandSparkles className="mr-2 size-4" />
            Sugerir automáticamente
          </Button>
        </div>

        {/* ================================================================
            CAMPOS
        ================================================================= */}

        <div className="grid gap-5 md:grid-cols-2">
          {fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label>
                {field.label}

                {field.required ? " *" : ""}
              </Label>

              <select
                value={mapping[field.key] ?? ""}
                onChange={(event) =>
                  setMapping((current) => ({
                    ...current,

                    [field.key]: event.target.value,
                  }))
                }
                disabled={loading}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="">
                  {field.required ? "Selecciona una columna" : "No utilizar"}
                </option>

                {headers.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* ================================================================
            IMPORTAR
        ================================================================= */}

        <div className="flex justify-end">
          <Button onClick={process} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Importando...
              </>
            ) : (
              "Validar e importar al inventario"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
