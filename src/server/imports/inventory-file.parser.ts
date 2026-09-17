/* import "server-only"; */

import * as XLSX from "xlsx";

import {
  ALLOWED_IMPORT_EXTENSIONS,
  IMPORT_LIMITS,
  type ImportFileExtension,
} from "@/config/imports";

import { DomainError } from "@/server/errors/domain.error";

type RawRow = Record<string, unknown>;

export type ParsedInventoryFile = {
  originalFileName: string;
  sourceType: ImportFileExtension;
  sheetName: string | null;
  headers: string[];
  rows: RawRow[];
  preview: RawRow[];
};

function getExtension(fileName: string): ImportFileExtension {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (
    !extension ||
    !(ALLOWED_IMPORT_EXTENSIONS as readonly string[]).includes(extension)
  ) {
    throw new DomainError(
      "IMPORT_INVALID_FILE_TYPE",
      "Solo se permiten archivos XLSX, XLS o CSV.",
    );
  }

  return extension as ImportFileExtension;
}

function toJsonSafe(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(toJsonSafe);
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        toJsonSafe(item),
      ]),
    );
  }

  return value;
}

export async function parseInventoryFile(
  file: File,
): Promise<ParsedInventoryFile> {
  if (!file.size) {
    throw new DomainError("IMPORT_EMPTY_FILE", "El archivo está vacío.");
  }

  if (file.size > IMPORT_LIMITS.MAX_FILE_BYTES) {
    throw new DomainError(
      "IMPORT_FILE_TOO_LARGE",
      "El archivo supera el tamaño máximo permitido.",
    );
  }

  const sourceType = getExtension(file.name);

  const buffer = await file.arrayBuffer();

  let workbook: XLSX.WorkBook;

  try {
    workbook = XLSX.read(buffer, {
      type: "array",
      cellDates: true,
    });
  } catch {
    throw new DomainError("IMPORT_INVALID_FILE", "No se pudo leer el archivo.");
  }

  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new DomainError(
      "IMPORT_EMPTY_WORKBOOK",
      "El archivo no contiene hojas.",
    );
  }

  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    throw new DomainError(
      "IMPORT_EMPTY_WORKBOOK",
      "No se pudo leer la hoja del archivo.",
    );
  }

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: null,
    blankrows: false,
  });

  if (!matrix.length) {
    throw new DomainError(
      "IMPORT_NO_DATA",
      "El archivo no contiene información.",
    );
  }

  const firstRow = matrix[0];

  if (!firstRow) {
    throw new DomainError(
      "IMPORT_NO_HEADERS",
      "No se encontraron encabezados.",
    );
  }

  const headers = firstRow
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);

  if (!headers.length) {
    throw new DomainError(
      "IMPORT_NO_HEADERS",
      "No se encontraron encabezados.",
    );
  }

  if (new Set(headers).size !== headers.length) {
    throw new DomainError(
      "IMPORT_DUPLICATE_HEADERS",
      "El archivo contiene columnas con nombres duplicados.",
    );
  }

  const rawRows = XLSX.utils.sheet_to_json<RawRow>(sheet, {
    defval: null,
    raw: true,
    blankrows: false,
  });

  if (rawRows.length > IMPORT_LIMITS.MAX_ROWS) {
    throw new DomainError(
      "IMPORT_TOO_MANY_ROWS",
      `El archivo supera el límite de ${IMPORT_LIMITS.MAX_ROWS} filas.`,
    );
  }

  const rows = rawRows.map((row) => toJsonSafe(row) as RawRow);

  return {
    originalFileName: file.name,
    sourceType,
    sheetName,
    headers,
    rows,
    preview: rows.slice(0, IMPORT_LIMITS.PREVIEW_ROWS),
  };
}
