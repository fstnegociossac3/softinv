const SENSITIVE_KEYS = new Set([
  "password",
  "passwordHash",
  "password_hash",

  "token",
  "accessToken",
  "access_token",
  "refreshToken",
  "refresh_token",

  "authorization",
  "cookie",
  "cookies",

  "secret",
  "secretKey",
  "secret_key",

  "serviceRoleKey",
  "service_role_key",

  "databaseUrl",
  "database_url",
]);

export function sanitizeAuditValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeAuditValue);
  }

  if (typeof value === "object") {
    const result: Record<string, unknown> = {};

    for (const [key, item] of Object.entries(
      value as Record<string, unknown>,
    )) {
      if (SENSITIVE_KEYS.has(key)) {
        result[key] = "[REDACTED]";
        continue;
      }

      result[key] = sanitizeAuditValue(item);
    }

    return result;
  }

  return value;
}
