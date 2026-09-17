import {
  CheckCircle2,
  Copy,
  FileSpreadsheet,
  TriangleAlert,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { ImportStatusBadge } from "./import-status-badge";

type Props = {
  record: {
    originalFileName: string;

    sourceType: "xlsx" | "xls" | "csv";

    status: "uploaded" | "validating" | "ready" | "processed" | "failed";

    totalRows: number;
    validRows: number;
    invalidRows: number;
    duplicateRows: number;

    createdAt: Date;
  };
};

export function ImportSummary({ record }: Props) {
  const cards = [
    {
      label: "Total",
      value: record.totalRows,
      icon: FileSpreadsheet,
    },
    {
      label: "Válidas",
      value: record.validRows,
      icon: CheckCircle2,
    },
    {
      label: "Inválidas",
      value: record.invalidRows,
      icon: TriangleAlert,
    },
    {
      label: "Duplicadas",
      value: record.duplicateRows,
      icon: Copy,
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between gap-4 text-base">
            <span>Estado de la importación</span>

            <ImportStatusBadge status={record.status} />
          </CardTitle>
        </CardHeader>

        <CardContent className="text-sm text-muted-foreground">
          Tipo: <span className="uppercase">{record.sourceType}</span>
          {" · "}
          Importado:{" "}
          {new Intl.DateTimeFormat("es-PE", {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(record.createdAt)}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.label}>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>

                  <p className="mt-1 text-2xl font-semibold">
                    {item.value.toLocaleString()}
                  </p>
                </div>

                <Icon className="size-5 text-muted-foreground" />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
