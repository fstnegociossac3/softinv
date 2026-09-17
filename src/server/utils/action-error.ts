import { AuthorizationError } from "@/server/errors/authorization.error";

import { DomainError } from "@/server/errors/domain.error";

export function getActionErrorMessage(error: unknown): string {
  if (error instanceof DomainError || error instanceof AuthorizationError) {
    return error.message;
  }

  console.error("Error no controlado:", error);

  return "Ocurrió un error inesperado. Inténtalo nuevamente.";
}
