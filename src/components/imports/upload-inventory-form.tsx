"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { FileSpreadsheet, Loader2, Upload } from "lucide-react";

import { toast } from "sonner";

import { IMPORT_LIMITS } from "@/config/imports";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

type Company = {
  id: string;

  name: string;
};

type Props = {
  isAdmin: boolean;

  companies: Company[];

  currentCompanyName: string | null;
};

export function UploadInventoryForm({
  isAdmin,

  companies,

  currentCompanyName,
}: Props) {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);

  const [companyId, setCompanyId] = useState("");

  const [loading, setLoading] = useState(false);

  async function submit() {
    /*
    |--------------------------------------------------------------------------
    | VALIDACIONES FRONTEND
    |--------------------------------------------------------------------------
    */

    if (!file) {
      toast.error("Selecciona un archivo.");

      return;
    }

    if (file.size > IMPORT_LIMITS.MAX_FILE_BYTES) {
      toast.error("El archivo supera el tamaño máximo permitido.");

      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!["xlsx", "xls", "csv"].includes(extension ?? "")) {
      toast.error("Solo se permiten archivos XLSX, XLS o CSV.");

      return;
    }

    if (isAdmin && !companyId) {
      toast.error("Selecciona una empresa.");

      return;
    }

    try {
      setLoading(true);

      /*
      |--------------------------------------------------------------------------
      | FORM DATA
      |--------------------------------------------------------------------------
      */

      const formData = new FormData();

      formData.append("file", file);

      if (isAdmin && companyId) {
        formData.append("companyId", companyId);
      }

      /*
      |--------------------------------------------------------------------------
      | SUBIR
      |--------------------------------------------------------------------------
      */

      const response = await fetch("/api/imports/inventory", {
        method: "POST",

        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message ?? "No se pudo importar el archivo.");
      }

      /*
      |--------------------------------------------------------------------------
      | PROCESADO AUTOMÁTICAMENTE
      |--------------------------------------------------------------------------
      */

      if (result.data.autoProcessed) {
        const inventory = result.data.processing?.inventory;

        const validation = result.data.processing?.validation;

        toast.success(
          `Inventario actualizado. ${inventory?.createdItems ?? 0} productos creados y ${inventory?.updatedItems ?? 0} actualizados.`,
        );

        /*
         * Avisamos si algunas filas
         * quedaron fuera.
         */
        const omitted =
          (validation?.invalidRows ?? 0) + (validation?.duplicateRows ?? 0);

        if (omitted > 0) {
          toast.warning(
            `${omitted} filas no fueron importadas por errores o duplicados.`,
          );
        }

        /*
         * DIRECTO A INVENTARIO.
         */
        router.push("/inventory");

        router.refresh();

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | NECESITA MAPEO MANUAL
      |--------------------------------------------------------------------------
      */

      if (result.data.autoProcessError) {
        toast.warning(
          "El archivo fue cargado, pero debes revisar el mapeo antes de continuar.",
        );
      } else {
        toast.info("Revisa la relación de columnas antes de importar.");
      }

      router.push(`/imports/${result.data.importId}/mapping`);

      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo cargar el archivo.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Archivo de inventario</CardTitle>

        <CardDescription>
          Carga un archivo XLSX, XLS o CSV. Si las columnas son reconocidas
          automáticamente, los productos se actualizarán directamente en
          Inventario.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* ================================================================
            EMPRESA ADMIN
        ================================================================= */}

        {isAdmin ? (
          <div className="space-y-2">
            <Label>Empresa *</Label>

            <select
              value={companyId}
              onChange={(event) => setCompanyId(event.target.value)}
              disabled={loading}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="">Selecciona una empresa</option>

              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">Empresa</p>

            <p className="font-medium">{currentCompanyName}</p>
          </div>
        )}

        {/* ================================================================
            ARCHIVO
        ================================================================= */}

        <div className="space-y-2">
          <Label htmlFor="inventory-file">Archivo *</Label>

          <div className="rounded-xl border border-dashed p-6">
            <div className="mb-4 flex flex-col items-center text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Upload className="size-5" />
              </div>

              <p className="mt-3 font-medium">
                Selecciona tu archivo de inventario
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                XLSX, XLS o CSV. Máximo{" "}
                {Math.round(IMPORT_LIMITS.MAX_FILE_BYTES / 1024 / 1024)} MB.
              </p>
            </div>

            <Input
              id="inventory-file"
              type="file"
              accept=".xlsx,.xls,.csv"
              disabled={loading}
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        {/* ================================================================
            ARCHIVO SELECCIONADO
        ================================================================= */}

        {file ? (
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <FileSpreadsheet className="size-6 text-muted-foreground" />

            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{file.name}</p>

              <p className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        ) : null}

        {/* ================================================================
            BOTÓN
        ================================================================= */}

        <div className="flex justify-end">
          <Button onClick={submit} disabled={loading || !file}>
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Procesando inventario...
              </>
            ) : (
              <>
                <Upload className="mr-2 size-4" />
                Cargar e importar
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
