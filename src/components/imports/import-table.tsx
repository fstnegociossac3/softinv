import Link from "next/link";

import { Eye, FileSpreadsheet, Map as MapIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

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

import { ImportStatusBadge } from "./import-status-badge";

type ImportItem = {
  id: string;
  companyId: string;

  fileName: string;

  sourceType: "xlsx" | "xls" | "csv";

  status: "uploaded" | "validating" | "ready" | "processed" | "failed";

  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;

  createdAt: Date;

  createdById: string | null;
  createdByName: string | null;
};

type Company = {
  id: string;
  name: string;
};

type Props = {
  imports: ImportItem[];

  companies: Company[];

  currentCompanyName: string | null;

  total: number;
  page: number;
  pageSize: number;
};

export function ImportTable({
  imports,
  companies,
  currentCompanyName,
  total,
  page,
  pageSize,
}: Props) {
  const companyNames = new globalThis.Map(
    companies.map((company) => [company.id, company.name]),
  );

  if (!imports.length) {
    return (
      <Card>
        <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <FileSpreadsheet className="size-6 text-muted-foreground" />
          </div>

          <h3 className="mt-4 font-medium">No existen importaciones</h3>

          <p className="mt-1 text-sm text-muted-foreground">
            Carga un archivo Excel o CSV para comenzar.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Archivo</TableHead>

                <TableHead>Empresa</TableHead>

                <TableHead>Estado</TableHead>

                <TableHead className="text-right">Total</TableHead>

                <TableHead className="text-right">Válidas</TableHead>

                <TableHead className="text-right">Inválidas</TableHead>

                <TableHead className="text-right">Duplicadas</TableHead>

                <TableHead>Fecha</TableHead>

                <TableHead className="w-[150px]" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {imports.map((item) => {
                const companyName =
                  companyNames.get(item.companyId) ?? currentCompanyName ?? "—";

                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <FileSpreadsheet className="size-5 text-muted-foreground" />

                        <div className="min-w-0">
                          <p className="max-w-[250px] truncate font-medium">
                            {item.fileName}
                          </p>

                          <p className="text-xs uppercase text-muted-foreground">
                            {item.sourceType}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>{companyName}</TableCell>

                    <TableCell>
                      <ImportStatusBadge status={item.status} />
                    </TableCell>

                    <TableCell className="text-right">
                      {item.totalRows.toLocaleString("es-PE")}
                    </TableCell>

                    <TableCell className="text-right">
                      {item.validRows.toLocaleString("es-PE")}
                    </TableCell>

                    <TableCell className="text-right">
                      {item.invalidRows.toLocaleString("es-PE")}
                    </TableCell>

                    <TableCell className="text-right">
                      {item.duplicateRows.toLocaleString("es-PE")}
                    </TableCell>

                    <TableCell className="whitespace-nowrap">
                      {new Intl.DateTimeFormat("es-PE", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(item.createdAt)}
                    </TableCell>

                    <TableCell>
                      <div className="flex justify-end gap-2">
                        {item.status === "uploaded" && (
                          <Link
                            href={`/imports/${item.id}/mapping`}
                            className={buttonVariants({
                              size: "sm",
                              variant: "outline",
                            })}
                          >
                            <MapIcon className="mr-2 size-4" />
                            Mapear
                          </Link>
                        )}

                        <Link
                          href={`/imports/${item.id}`}
                          className={buttonVariants({
                            size: "sm",
                            variant: "ghost",
                          })}
                        >
                          <Eye className="mr-2 size-4" />
                          Ver
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {total.toLocaleString("es-PE")} importaciones
          </p>

          <TablePagination page={page} total={total} pageSize={pageSize} />
        </div>
      </CardContent>
    </Card>
  );
}
