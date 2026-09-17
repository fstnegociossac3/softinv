import { Badge } from "@/components/ui/badge";

type ImportStatus =
  | "uploaded"
  | "validating"
  | "ready"
  | "processed"
  | "failed";

type ImportRowStatus = "pending" | "valid" | "invalid" | "duplicate";

export function ImportStatusBadge({ status }: { status: ImportStatus }) {
  const labels: Record<ImportStatus, string> = {
    uploaded: "Pendiente de mapeo",
    validating: "Validando",
    ready: "Lista",
    processed: "Procesada",
    failed: "Con errores",
  };

  if (status === "failed") {
    return <Badge variant="destructive">{labels[status]}</Badge>;
  }

  if (status === "ready") {
    return <Badge>{labels[status]}</Badge>;
  }

  return <Badge variant="secondary">{labels[status]}</Badge>;
}

export function ImportRowStatusBadge({ status }: { status: ImportRowStatus }) {
  const labels: Record<ImportRowStatus, string> = {
    pending: "Pendiente",
    valid: "Válida",
    invalid: "Inválida",
    duplicate: "Duplicada",
  };

  if (status === "invalid") {
    return <Badge variant="destructive">{labels[status]}</Badge>;
  }

  if (status === "valid") {
    return <Badge>{labels[status]}</Badge>;
  }

  return <Badge variant="secondary">{labels[status]}</Badge>;
}
