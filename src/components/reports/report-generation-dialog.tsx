"use client";

import { useState, useTransition } from "react";

import {
  Building2,
  CalendarRange,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
} from "lucide-react";

import { useRouter, useSearchParams } from "next/navigation";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { ReportExportFormat, ReportType } from "@/config/reports";

import { REPORT_TYPE_LABELS } from "@/config/reports";

import { generateReportAction } from "@/server/actions/report.actions";

type CompanyOption = {
  id: string;

  name: string;
};

type Props = {
  reportType: ReportType;

  isAdmin: boolean;

  companies?: CompanyOption[];

  triggerLabel?: string;
};

function localDateString(date: Date) {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function defaultDates() {
  const today = new Date();

  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

  return {
    from: localDateString(firstDay),

    to: localDateString(today),
  };
}

function countDays(from: string, to: string) {
  if (!from || !to) {
    return null;
  }

  const start = new Date(`${from}T00:00:00`);

  const end = new Date(`${to}T00:00:00`);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    start > end
  ) {
    return null;
  }

  return Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
}

export function ReportGenerationDialog({
  reportType,
  isAdmin,
  companies = [],
  triggerLabel = "Generar reporte",
}: Props) {
  const router = useRouter();

  const searchParams = useSearchParams();

  const initialDates = defaultDates();

  const [open, setOpen] = useState(false);

  const [companyId, setCompanyId] = useState("");

  const [from, setFrom] = useState(initialDates.from);

  const [to, setTo] = useState(initialDates.to);

  const [generatingFormat, setGeneratingFormat] =
    useState<ReportExportFormat | null>(null);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const [isPending, startTransition] = useTransition();

  const reportLabel = REPORT_TYPE_LABELS[reportType];

  /*
  |--------------------------------------------------------------------------
  | GENERAR Y DESCARGAR
  |--------------------------------------------------------------------------
  */

  function generate(format: ReportExportFormat) {
    setFieldErrors({});

    if (isAdmin && !companyId) {
      toast.error("Selecciona una empresa.");

      return;
    }

    if (!from || !to) {
      toast.error("Selecciona el periodo del reporte.");

      return;
    }

    const days = countDays(from, to);

    if (!days) {
      toast.error("El periodo no es válido.");

      return;
    }

    if (days > 180) {
      toast.error("El periodo máximo es de 180 días.");

      return;
    }

    setGeneratingFormat(format);

    startTransition(async () => {
      const result = await generateReportAction({
        companyId: isAdmin ? companyId : undefined,

        reportType,

        from,

        to,
      });

      if (!result.success) {
        setFieldErrors(result.fieldErrors ?? {});

        toast.error(result.message);

        setGeneratingFormat(null);

        return;
      }

      const reportId = result.data?.id;

      if (!reportId) {
        toast.error("No se recibió el identificador del reporte.");

        setGeneratingFormat(null);

        return;
      }

      toast.success("Reporte generado correctamente.");

      /*
       * Si es administrador,
       * dejamos seleccionada en el
       * historial la misma empresa
       * usada para generar.
       */
      if (isAdmin && companyId) {
        const params = new URLSearchParams(searchParams.toString());

        params.set("companyId", companyId);

        params.delete("page");

        router.replace(`/reports?${params.toString()}`);
      }

      setOpen(false);

      router.refresh();

      /*
        |--------------------------------------------------------------------------
        | DESCARGAR
        |--------------------------------------------------------------------------
        |
        | Estos endpoints utilizarán
        | reports.snapshot_data.
        |
        */

      window.location.assign(`/api/reports/${reportId}/${format}`);

      setGeneratingFormat(null);
    });
  }

  const periodDays = countDays(from, to);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Download className="size-4" />

        {triggerLabel}
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{reportLabel}</DialogTitle>

          <DialogDescription>
            Selecciona el periodo y el formato en el que deseas generar el
            reporte.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* EMPRESA ADMIN */}

          {isAdmin ? (
            <div className="space-y-2">
              <Label>Empresa *</Label>

              <Select
                value={companyId || "none"}
                onValueChange={(value) =>
                  setCompanyId(value === "none" ? "" : String(value))
                }
              >
                <SelectTrigger className="h-10 w-full">
                  <Building2 className="mr-2 size-4 text-slate-400" />

                  <SelectValue placeholder="Selecciona empresa" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="none">Selecciona empresa</SelectItem>

                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {fieldErrors.companyId?.[0] ? (
                <p className="text-xs text-red-600">
                  {fieldErrors.companyId[0]}
                </p>
              ) : null}
            </div>
          ) : null}

          {/* FECHAS */}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`report-from-${reportType}`}>Desde *</Label>

              <Input
                id={`report-from-${reportType}`}
                type="date"
                value={from}
                disabled={isPending}
                onChange={(event) => setFrom(event.target.value)}
              />

              {fieldErrors.from?.[0] ? (
                <p className="text-xs text-red-600">{fieldErrors.from[0]}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`report-to-${reportType}`}>Hasta *</Label>

              <Input
                id={`report-to-${reportType}`}
                type="date"
                value={to}
                disabled={isPending}
                onChange={(event) => setTo(event.target.value)}
              />

              {fieldErrors.to?.[0] ? (
                <p className="text-xs text-red-600">{fieldErrors.to[0]}</p>
              ) : null}
            </div>
          </div>

          {/* PERIODO */}

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <CalendarRange className="mt-0.5 size-5 text-[#12365A]" />

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Periodo del reporte
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {from}
                  {" — "}
                  {to}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {periodDays
                    ? `${periodDays} días seleccionados`
                    : "Periodo inválido"}
                  {" · "}
                  máximo 180 días
                </p>
              </div>
            </div>
          </div>

          {/* FORMATO */}

          <div>
            <p className="text-sm font-semibold text-slate-800">
              Formato de descarga
            </p>

            <p className="mt-1 text-xs text-slate-500">
              El mismo snapshot queda guardado en Reportes Generados.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => generate("excel")}
          >
            {isPending && generatingFormat === "excel" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="size-4" />
            )}
            Descargar Excel
          </Button>

          <Button
            type="button"
            disabled={isPending}
            onClick={() => generate("pdf")}
          >
            {isPending && generatingFormat === "pdf" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileText className="size-4" />
            )}
            Descargar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
