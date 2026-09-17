import { Building2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { Card, CardContent } from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { CompanyActions } from "./company-actions";

import { TablePagination } from "@/components/shared/table-pagination";

type Company = {
  id: string;
  name: string;
  ruc: string | null;
  sector: string | null;
  address: string | null;
  country: string;
  timezone: string;
  currency: string;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
};

type CompanyTableProps = {
  companies: Company[];
  total: number;
  page: number;
  pageSize: number;
};

export function CompanyTable({
  companies,
  total,
  page,
  pageSize,
}: CompanyTableProps) {
  if (!companies.length) {
    return (
      <Card>
        <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Building2 className="size-6 text-muted-foreground" />
          </div>

          <h3 className="mt-4 font-medium">No se encontraron empresas</h3>

          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Registra una empresa o modifica los filtros de búsqueda.
          </p>
        </CardContent>
      </Card>
    );
  }

  const first = (page - 1) * pageSize + 1;

  const last = Math.min(page * pageSize, total);

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>

                <TableHead>RUC</TableHead>

                <TableHead>Sector</TableHead>

                <TableHead>Estado</TableHead>

                <TableHead className="w-[70px]" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{company.name}</p>

                      <p className="text-xs text-muted-foreground">
                        {company.country}
                        {" · "}
                        {company.currency}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell>{company.ruc ?? "—"}</TableCell>

                  <TableCell>{company.sector ?? "—"}</TableCell>

                  <TableCell>
                    {company.status === "active" ? (
                      <Badge>Activa</Badge>
                    ) : (
                      <Badge variant="secondary">Inactiva</Badge>
                    )}
                  </TableCell>

                  <TableCell>
                    <CompanyActions company={company} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-3 border-t px-4 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            Mostrando {first}–{last} de {total} empresas
          </p>

          <TablePagination page={page} total={total} pageSize={pageSize} />
        </div>
      </CardContent>
    </Card>
  );
}
