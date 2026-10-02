import "server-only";

import * as XLSX from "xlsx";

import { REPORT_TYPE_LABELS } from "@/config/reports";

import type { ReportSnapshot } from "@/lib/reports/types";

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function numberValue(value: unknown) {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function textValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function round(value: number, decimals = 2) {
  const factor = 10 ** decimals;

  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/*
|--------------------------------------------------------------------------
| ANCHO DE COLUMNAS
|--------------------------------------------------------------------------
*/

function autoWidth(sheet: XLSX.WorkSheet) {
  const range = XLSX.utils.decode_range(sheet["!ref"] ?? "A1:A1");

  const widths: Array<{
    wch: number;
  }> = [];

  for (let column = range.s.c; column <= range.e.c; column++) {
    let maxLength = 10;

    for (let row = range.s.r; row <= range.e.r; row++) {
      const address = XLSX.utils.encode_cell({
        r: row,
        c: column,
      });

      const cell = sheet[address];

      if (!cell) {
        continue;
      }

      const value = String(cell.v ?? "");

      maxLength = Math.max(maxLength, value.length + 2);
    }

    widths.push({
      wch: Math.min(maxLength, 45),
    });
  }

  sheet["!cols"] = widths;
}

/*
|--------------------------------------------------------------------------
| AGREGAR HOJA
|--------------------------------------------------------------------------
*/

function appendJsonSheet(
  workbook: XLSX.WorkBook,

  name: string,

  rows: Record<string, unknown>[],
) {
  const sheet = XLSX.utils.json_to_sheet(
    rows.length
      ? rows
      : [
          {
            Información: "Sin datos",
          },
        ],
  );

  autoWidth(sheet);

  XLSX.utils.book_append_sheet(workbook, sheet, name.slice(0, 31));
}

function appendKeyValueSheet(
  workbook: XLSX.WorkBook,

  name: string,

  rows: Array<[string, unknown]>,
) {
  const sheet = XLSX.utils.aoa_to_sheet([["Indicador", "Valor"], ...rows]);

  autoWidth(sheet);

  XLSX.utils.book_append_sheet(workbook, sheet, name.slice(0, 31));
}

/*
|--------------------------------------------------------------------------
| FLATTEN
|--------------------------------------------------------------------------
|
| Convierte:
|
| {
|   pending: 10,
|   executed: 20
| }
|
| en:
|
| Pendiente | 10
| Ejecutada | 20
|
*/

function flattenObject(
  value: Record<string, unknown>,

  prefix = "",
): Array<[string, unknown]> {
  const result: Array<[string, unknown]> = [];

  for (const [key, item] of Object.entries(value)) {
    const label = prefix ? `${prefix} - ${key}` : key;

    if (item !== null && typeof item === "object" && !Array.isArray(item)) {
      result.push(
        ...flattenObject(
          item as Record<string, unknown>,

          label,
        ),
      );

      continue;
    }

    if (Array.isArray(item)) {
      continue;
    }

    result.push([label, item ?? ""]);
  }

  return result;
}

/*
|--------------------------------------------------------------------------
| INFORMACIÓN GENERAL
|--------------------------------------------------------------------------
*/

function addInformationSheet(
  workbook: XLSX.WorkBook,

  snapshot: ReportSnapshot,
) {
  appendKeyValueSheet(
    workbook,

    "Información",

    [
      ["Tipo de reporte", REPORT_TYPE_LABELS[snapshot.type]],

      ["Empresa", snapshot.company.name],

      ["RUC", snapshot.company.ruc ?? ""],

      ["Sector", snapshot.company.sector ?? ""],

      ["Periodo desde", snapshot.period.from],

      ["Periodo hasta", snapshot.period.to],

      ["Días analizados", snapshot.period.days],

      ["Generado por", snapshot.generatedBy.name],

      ["Fecha de generación", snapshot.generatedAt],

      ["Moneda", snapshot.company.currency],

      ["Versión snapshot", snapshot.schemaVersion],
    ],
  );
}

/*
|--------------------------------------------------------------------------
| REPORTE EJECUTIVO
|--------------------------------------------------------------------------
*/

function addExecutiveSheets(
  workbook: XLSX.WorkBook,

  snapshot: ReportSnapshot,
) {
  const data = asRecord(snapshot.data);

  /*
   * INVENTARIO
   */
  appendKeyValueSheet(
    workbook,

    "Inventario",

    flattenObject(asRecord(data.inventory)),
  );

  /*
   * IRI
   */
  const iri = asRecord(data.iri);

  appendKeyValueSheet(
    workbook,

    "IRI",

    [
      ...flattenObject(
        asRecord(iri.summary),

        "Resumen",
      ),

      ...flattenObject(
        asRecord(iri.distribution),

        "Distribución",
      ),

      ...flattenObject(
        asRecord(iri.variableAverages),

        "Variables",
      ),
    ],
  );

  /*
   * RECOMENDACIONES
   */
  const recommendations = asRecord(data.recommendations);

  appendKeyValueSheet(
    workbook,

    "Recomendaciones",

    [
      ...flattenObject(
        asRecord(recommendations.summary),

        "Resumen",
      ),

      ...flattenObject(
        asRecord(recommendations.distribution),

        "Distribución",
      ),
    ],
  );

  /*
   * SEGUIMIENTO
   */
  const tracking = asRecord(data.tracking);

  appendKeyValueSheet(
    workbook,

    "Seguimiento",

    [
      ...flattenObject(
        asRecord(tracking.summary),

        "Resumen",
      ),

      ...flattenObject(
        asRecord(tracking.statusSummary),

        "Estados",
      ),
    ],
  );

  /*
   * RECUPERACIÓN
   */
  const recovery = asRecord(data.recovery);

  appendKeyValueSheet(
    workbook,

    "Recuperación",

    [
      ...flattenObject(
        asRecord(recovery.kpis),

        "KPI",
      ),

      ...flattenObject(
        asRecord(recovery.periodTotal),

        "Periodo",
      ),
    ],
  );

  /*
   * INVENTARIO CRÍTICO DESTACADO
   */
  const critical = asArray(data.criticalHighlights);

  appendJsonSheet(
    workbook,

    "SKU críticos",

    critical.map((raw) => {
      const item = asRecord(raw);

      const scores = asRecord(item.scores);

      return {
        SKU: textValue(item.sku),

        Producto: textValue(item.description),

        Categoría: textValue(item.category),

        Marca: textValue(item.brand),

        IRI: numberValue(item.iri),

        Recomendación: textValue(item.actionLabel),

        Stock: numberValue(item.stockQuantity),

        "Valor stock": numberValue(item.stockValue),

        Cobertura: numberValue(item.coverageDays),

        Demanda: numberValue(scores.demand),

        Recencia: numberValue(scores.recency),

        Tendencia: numberValue(scores.trend),

        Motivo: textValue(item.reason),
      };
    }),
  );
}

/*
|--------------------------------------------------------------------------
| INVENTARIO CRÍTICO
|--------------------------------------------------------------------------
*/

function addCriticalInventorySheets(
  workbook: XLSX.WorkBook,

  snapshot: ReportSnapshot,
) {
  const data = asRecord(snapshot.data);

  appendKeyValueSheet(
    workbook,

    "Resumen",

    [
      ...flattenObject(
        asRecord(data.inventory),

        "Inventario",
      ),

      ...flattenObject(
        asRecord(data.criticalSummary),

        "Crítico",
      ),

      ...flattenObject(
        asRecord(asRecord(data.iri).summary),

        "IRI",
      ),
    ],
  );

  const items = asArray(data.items);

  appendJsonSheet(
    workbook,

    "Inventario crítico",

    items.map((raw) => {
      const item = asRecord(raw);

      const scores = asRecord(item.scores);

      return {
        SKU: textValue(item.sku),

        Producto: textValue(item.description),

        Categoría: textValue(item.category),

        Marca: textValue(item.brand),

        Ubicación: textValue(item.location),

        Stock: numberValue(item.stockQuantity),

        "Costo unitario": numberValue(item.unitCost),

        "Valor stock": numberValue(item.stockValue),

        IRI: numberValue(item.iri),

        Demanda: numberValue(scores.demand),

        Recencia: numberValue(scores.recency),

        Cobertura: numberValue(item.coverageDays),

        Tendencia: numberValue(scores.trend),

        Recomendación: textValue(item.actionLabel),

        "Rotación potencial %": numberValue(item.potentialRotationPercentage),

        Motivo: textValue(item.reason),
      };
    }),
  );
}

/*
|--------------------------------------------------------------------------
| RECOMENDACIONES
|--------------------------------------------------------------------------
*/

function addRecommendationSheets(
  workbook: XLSX.WorkBook,

  snapshot: ReportSnapshot,
) {
  const data = asRecord(snapshot.data);

  appendKeyValueSheet(
    workbook,

    "Resumen",

    [
      ...flattenObject(
        asRecord(data.summary),

        "Resumen",
      ),

      ...flattenObject(
        asRecord(data.distribution),

        "Distribución",
      ),
    ],
  );

  const recommendations = asArray(data.recommendations);

  appendJsonSheet(
    workbook,

    "Recomendaciones",

    recommendations.map((raw) => {
      const item = asRecord(raw);

      return {
        SKU: textValue(item.sku),

        Producto: textValue(item.description),

        Categoría: textValue(item.category),

        Marca: textValue(item.brand),

        IRI: numberValue(item.iri),

        Acción: textValue(item.actionLabel),

        Stock: numberValue(item.stockQuantity),

        "Valor stock": numberValue(item.stockValue),

        "Cobertura días": numberValue(item.coverageDays),

        "Rotación potencial %": numberValue(item.potentialRotationPercentage),

        "Unidades potenciales": numberValue(item.potentialRotationUnits),

        "Valor potencial": numberValue(item.potentialRotationValue),

        Motivo: textValue(item.reason),
      };
    }),
  );
}

/*
|--------------------------------------------------------------------------
| RECUPERACIÓN
|--------------------------------------------------------------------------
*/

function addRecoverySheets(
  workbook: XLSX.WorkBook,

  snapshot: ReportSnapshot,
) {
  const data = asRecord(snapshot.data);

  appendKeyValueSheet(
    workbook,

    "Resumen",

    [
      ...flattenObject(
        asRecord(data.kpis),

        "KPI",
      ),

      ...flattenObject(
        asRecord(data.periodTotal),

        "Periodo",
      ),
    ],
  );

  /*
   * ACCIONES
   */
  const actions = asArray(data.actions);

  appendJsonSheet(
    workbook,

    "Acciones recuperadas",

    actions.map((raw) => {
      const item = asRecord(raw);

      return {
        SKU: textValue(item.sku),

        Producto: textValue(item.description),

        Acción: textValue(item.recommendationAction),

        Estado: textValue(item.status),

        "Stock inicial": numberValue(item.initialStockQuantity),

        "Capital inicial": numberValue(item.initialStockValue),

        "Potencial recuperable": numberValue(item.potentialRecoverableValue),

        "Unidades recuperadas": numberValue(item.recoveredUnits),

        "Capital recuperado": numberValue(item.recoveredValue),

        "Tasa recuperación %": numberValue(item.recoveryRate),

        "Fecha ejecución": textValue(item.executedAt),

        "Fecha inicio": textValue(item.startedAt),

        "Fecha cierre": textValue(item.closedAt),
      };
    }),
  );

  /*
   * SERIE TEMPORAL
   */
  appendJsonSheet(
    workbook,

    "Evolución",

    asArray(data.recoveredOverTime).map((raw) => {
      const item = asRecord(raw);

      return {
        Periodo: textValue(item.period),

        "Capital recuperado": numberValue(item.recoveredValue),
      };
    }),
  );

  /*
   * COMPARATIVO
   */
  appendJsonSheet(
    workbook,

    "Comparativo",

    asArray(data.comparisonByAction).map((raw) => {
      const item = asRecord(raw);

      return {
        Acción: textValue(item.label),

        Actual: numberValue(item.current),

        "Mes anterior": numberValue(item.previous),

        Diferencia: round(
          numberValue(item.current) - numberValue(item.previous),
        ),
      };
    }),
  );
}

/*
|--------------------------------------------------------------------------
| GENERAR XLSX
|--------------------------------------------------------------------------
*/

export function buildReportExcel(snapshot: ReportSnapshot): ArrayBuffer {
  const workbook = XLSX.utils.book_new();

  /*
   * Primera hoja siempre:
   * metadata del reporte.
   */
  addInformationSheet(workbook, snapshot);

  switch (snapshot.type) {
    case "executive":
      addExecutiveSheets(workbook, snapshot);

      break;

    case "critical_inventory":
      addCriticalInventorySheets(workbook, snapshot);

      break;

    case "recommendations":
      addRecommendationSheets(workbook, snapshot);

      break;

    case "recovery":
      addRecoverySheets(workbook, snapshot);

      break;
  }

  return XLSX.write(workbook, {
    bookType: "xlsx",

    type: "array",
  }) as ArrayBuffer;
}
