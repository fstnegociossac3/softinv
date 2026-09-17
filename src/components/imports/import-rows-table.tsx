import { Card, CardContent } from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { TablePagination } from "@/components/shared/table-pagination";

import { ImportRowStatusBadge } from "./import-status-badge";

type ImportError = {
  field?: string;
  code?: string;
  message?: string;
};

type Props = {
  rows: Array<{
    id: string;
    rowNumber: number;

    normalizedData: Record<string, unknown> | null;

    status: "pending" | "valid" | "invalid" | "duplicate";

    errors: ImportError[] | null;
  }>;

  total: number;
  page: number;
  pageSize: number;
};

function value(
  data: Record<string, unknown> | null,

  key: string,
) {
  return data?.[key] ?? "—";
}

export function ImportRowsTable({ rows, total, page, pageSize }: Props) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fila</TableHead>

                <TableHead>Estado</TableHead>

                <TableHead>SKU</TableHead>

                <TableHead>Descripción</TableHead>

                <TableHead className="text-right">Stock</TableHead>

                <TableHead className="text-right">Costo</TableHead>

                <TableHead>Observaciones</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.rowNumber}</TableCell>

                  <TableCell>
                    <ImportRowStatusBadge status={row.status} />
                  </TableCell>

                  <TableCell className="font-medium">
                    {String(value(row.normalizedData, "sku"))}
                  </TableCell>

                  <TableCell>
                    {String(value(row.normalizedData, "description"))}
                  </TableCell>

                  <TableCell className="text-right">
                    {String(value(row.normalizedData, "stockQuantity"))}
                  </TableCell>

                  <TableCell className="text-right">
                    {String(value(row.normalizedData, "unitCost"))}
                  </TableCell>

                  <TableCell className="max-w-[350px]">
                    {row.errors?.length ? (
                      <ul className="space-y-1 text-sm text-destructive">
                        {row.errors.map((error, index) => (
                          <li key={index}>
                            {error.message ?? error.code ?? "Error"}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between border-t p-4">
          <p className="text-sm text-muted-foreground">
            {total.toLocaleString()} filas
          </p>

          <TablePagination page={page} total={total} pageSize={pageSize} />
        </div>
      </CardContent>
    </Card>
  );
}
