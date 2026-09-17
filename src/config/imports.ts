

export const IMPORT_LIMITS = {
  /*
   * Límites iniciales del PMV.
   * Se pueden modificar posteriormente.
   */
  MAX_FILE_BYTES: 10 * 1024 * 1024,

  MAX_ROWS: 50_000,

  PREVIEW_ROWS: 10,

  INSERT_BATCH_SIZE: 500,
} as const;

export const ALLOWED_IMPORT_EXTENSIONS = ["xlsx", "xls", "csv"] as const;

export type ImportFileExtension = (typeof ALLOWED_IMPORT_EXTENSIONS)[number];
