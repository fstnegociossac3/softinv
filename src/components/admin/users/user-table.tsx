import { Building2, Mail, UserRound } from "lucide-react";

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

import { TablePagination } from "@/components/shared/table-pagination";

import { UserActions } from "./user-actions";

type CompanyOption = {
  id: string;
  name: string;
};

type User = {
  id: string;

  fullName: string;

  email: string | null;

  status: "active" | "inactive";

  role: "admin" | "user";

  createdAt: Date;

  companyId: string | null;

  companyName: string | null;

  companyStatus: "active" | "inactive" | null;
};

type Props = {
  users: User[];

  activeCompanies: CompanyOption[];

  total: number;

  page: number;

  pageSize: number;
};

const dateFormatter = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function UserTable({
  users,
  activeCompanies,
  total,
  page,
  pageSize,
}: Props) {
  if (!users.length) {
    return (
      <Card>
        <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <UserRound className="size-6 text-muted-foreground" />
          </div>

          <h3 className="mt-4 font-medium">No se encontraron usuarios</h3>

          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Crea un usuario o modifica los filtros de búsqueda.
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
                <TableHead>Usuario</TableHead>

                <TableHead>Empresa</TableHead>

                <TableHead>Estado</TableHead>

                <TableHead>Registro</TableHead>

                <TableHead className="w-[70px]" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">{user.fullName}</p>

                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Mail className="size-3.5" />

                        <span>{user.email ?? "Sin correo"}</span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    {user.companyName ? (
                      <div className="flex items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                          <Building2 className="size-4 text-muted-foreground" />
                        </div>

                        <div>
                          <p className="text-sm font-medium">
                            {user.companyName}
                          </p>

                          {user.companyStatus === "inactive" ? (
                            <p className="text-xs text-destructive">
                              Empresa inactiva
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Sin empresa
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    {user.status === "active" ? (
                      <Badge>Activo</Badge>
                    ) : (
                      <Badge variant="secondary">Inactivo</Badge>
                    )}
                  </TableCell>

                  <TableCell className="text-sm text-muted-foreground">
                    {dateFormatter.format(user.createdAt)}
                  </TableCell>

                  <TableCell>
                    <UserActions
                      user={user}
                      activeCompanies={activeCompanies}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-3 border-t px-4 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            Mostrando {first}–{last} de {total} usuarios
          </p>

          <TablePagination page={page} total={total} pageSize={pageSize} />
        </div>
      </CardContent>
    </Card>
  );
}
