import { createHash } from "node:crypto";

import * as XLSX from "xlsx";

import type { ImportRowError } from "@/db/schema/inventory-import-rows";

import type { ColumnMapping } from "@/lib/validations/inventory-import";

export type NormalizedInventoryRow = {
  sku: string;

  description: string;

  stockQuantity: number;

  unitCost: number;

  category: string | null;

  brand: string | null;

  location: string | null;

  lastMovementDate: string | null;

  sales30d: number | null;

  sales90d: number | null;

  sales180d: number | null;
};

function textValue(value: unknown): string {
  return String(value ?? "").trim();
}

function optionalText(value: unknown): string | null {
  const result = textValue(value);

  return result || null;
}

function numericValue(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  let normalized = value
    .trim()
    .replace(/S\/|US\$|\$/gi, "")
    .replace(/\s/g, "");

  if (!normalized) {
    return null;
  }

  const comma = normalized.lastIndexOf(",");

  const dot = normalized.lastIndexOf(".");

  /*
   * Soportamos:
   *
   * 1.250,50
   * 1,250.50
   * 1250,50
   * 1250.50
   */
  if (comma >= 0 && dot >= 0) {
    if (comma > dot) {
      normalized = normalized.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = normalized.replace(/,/g, "");
    }
  } else if (comma >= 0) {
    normalized = normalized.replace(",", ".");
  }

  const number = Number(normalized);

  return Number.isFinite(number) ? number : null;
}

function dateValue(value: unknown): string | null {
  /*
   * Fecha JS
   */
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  /*
   * Fecha serial de Excel.
   */
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);

    if (parsed) {
      return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d)).toISOString();
    }
  }

  /*
   * Fecha como texto.
   */
  if (typeof value === "string" && value.trim()) {
    const date = new Date(value.trim());

    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  return null;
}

function sourceValue(
  row: Record<string, unknown>,

  header: string | undefined,
) {
  if (!header) {
    return null;
  }

  return row[header];
}

export function normalizeInventoryRow(
  row: Record<string, unknown>,

  mapping: ColumnMapping,
): {
  data: NormalizedInventoryRow | null;

  errors: ImportRowError[];

  fingerprint: string | null;
} {
  const errors: ImportRowError[] = [];

  /*
  |--------------------------------------------------------------------------
  | CAMPOS OBLIGATORIOS
  |--------------------------------------------------------------------------
  */

  const sku = textValue(sourceValue(row, mapping.sku));

  const description = textValue(sourceValue(row, mapping.description));

  const stockQuantity = numericValue(sourceValue(row, mapping.stockQuantity));

  const unitCost = numericValue(sourceValue(row, mapping.unitCost));

  /*
  |--------------------------------------------------------------------------
  | VALIDACIONES
  |--------------------------------------------------------------------------
  */

  if (!sku) {
    errors.push({
      field: "sku",

      code: "REQUIRED",

      message: "El SKU es obligatorio.",
    });
  }

  if (!description) {
    errors.push({
      field: "description",

      code: "REQUIRED",

      message: "La descripción es obligatoria.",
    });
  }

  if (stockQuantity === null) {
    errors.push({
      field: "stockQuantity",

      code: "INVALID_NUMBER",

      message: "El stock debe ser numérico.",
    });
  } else if (stockQuantity < 0) {
    errors.push({
      field: "stockQuantity",

      code: "NEGATIVE_VALUE",

      message: "El stock no puede ser negativo.",
    });
  }

  if (unitCost === null) {
    errors.push({
      field: "unitCost",

      code: "INVALID_NUMBER",

      message: "El costo unitario debe ser numérico.",
    });
  } else if (unitCost < 0) {
    errors.push({
      field: "unitCost",

      code: "NEGATIVE_VALUE",

      message: "El costo unitario no puede ser negativo.",
    });
  }

  /*
  |--------------------------------------------------------------------------
  | NORMALIZACIÓN
  |--------------------------------------------------------------------------
  */

  const data: NormalizedInventoryRow = {
    sku,

    description,

    stockQuantity: stockQuantity ?? 0,

    unitCost: unitCost ?? 0,

    category: optionalText(sourceValue(row, mapping.category)),

    brand: optionalText(sourceValue(row, mapping.brand)),

    location: optionalText(sourceValue(row, mapping.location)),

    lastMovementDate: dateValue(sourceValue(row, mapping.lastMovementDate)),

    sales30d: numericValue(sourceValue(row, mapping.sales30d)),

    sales90d: numericValue(sourceValue(row, mapping.sales90d)),

    sales180d: numericValue(sourceValue(row, mapping.sales180d)),
  };

  /*
  |--------------------------------------------------------------------------
  | FINGERPRINT
  |--------------------------------------------------------------------------
  */

  const fingerprint = sku
    ? createHash("sha256").update(sku.trim().toUpperCase()).digest("hex")
    : null;

  return {
    data: errors.length ? null : data,

    errors,

    fingerprint,
  };
}
