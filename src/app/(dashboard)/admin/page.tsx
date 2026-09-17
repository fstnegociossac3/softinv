import Link from "next/link";

import { ArrowRight, Building2, UserCheck, Users } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";

import { Badge } from "@/components/ui/badge";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { getAdminDashboardOverview } from "@/server/queries/admin.queries";

export default async function AdminPage() {
  const data = await getAdminDashboardOverview();

  const formatter = new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const metrics = [
    {
      title: "Empresas registradas",
      value: data.stats.companies,
      description: "Total de empresas en la plataforma",
      icon: Building2,
    },
    {
      title: "Empresas activas",
      value: data.stats.activeCompanies,
      description: "Empresas habilitadas actualmente",
      icon: Building2,
    },
    {
      title: "Usuarios registrados",
      value: data.stats.users,
      description: "Usuarios empresariales creados",
      icon: Users,
    },
    {
      title: "Usuarios activos",
      value: data.stats.activeUsers,
      description: "Usuarios con acceso habilitado",
      icon: UserCheck,
    },
  ];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Dashboard administrativo"
        description="Supervisa las empresas y usuarios de RecuperaStock AI."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <Card
              key={metric.title}
              className="border-none bg-white shadow-sm ring-1 ring-slate-200"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {metric.title}
                    </p>

                    <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                      {metric.value}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {metric.description}
                    </p>
                  </div>

                  <div className="flex size-11 items-center justify-center rounded-xl bg-[#12365A]/10">
                    <Icon className="size-5 text-[#12365A]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/admin/companies">
          <Card className="h-full cursor-pointer bg-white transition-all hover:-translate-y-0.5 hover:shadow-md">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50">
                  <Building2 className="size-5 text-[#12365A]" />
                </div>

                <ArrowRight className="size-5 text-slate-400" />
              </div>

              <CardTitle className="mt-3">Gestión de empresas</CardTitle>

              <CardDescription>
                Registra, edita, activa o desactiva empresas.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/users">
          <Card className="h-full cursor-pointer bg-white transition-all hover:-translate-y-0.5 hover:shadow-md">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex size-11 items-center justify-center rounded-xl bg-red-50">
                  <Users className="size-5 text-red-600" />
                </div>

                <ArrowRight className="size-5 text-slate-400" />
              </div>

              <CardTitle className="mt-3">Gestión de usuarios</CardTitle>

              <CardDescription>
                Crea usuarios, asigna empresas y administra accesos.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Empresas recientes</CardTitle>

            <CardDescription>Últimas empresas registradas.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {data.recentCompanies.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay empresas registradas.
              </p>
            ) : (
              data.recentCompanies.map((company) => (
                <div
                  key={company.id}
                  className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-none last:pb-0"
                >
                  <div>
                    <p className="font-medium text-slate-800">{company.name}</p>

                    <p className="text-xs text-slate-400">
                      RUC: {company.ruc ?? "No registrado"}
                    </p>
                  </div>

                  <div className="text-right">
                    <Badge
                      variant={
                        company.status === "active" ? "default" : "secondary"
                      }
                    >
                      {company.status === "active" ? "Activa" : "Inactiva"}
                    </Badge>

                    <p className="mt-1 text-[11px] text-slate-400">
                      {formatter.format(company.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Usuarios recientes</CardTitle>

            <CardDescription>Últimos usuarios registrados.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {data.recentUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay usuarios registrados.
              </p>
            ) : (
              data.recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-none last:pb-0"
                >
                  <div>
                    <p className="font-medium text-slate-800">
                      {user.fullName}
                    </p>

                    <p className="text-xs text-slate-400">
                      {user.companyName ?? "Sin empresa"}
                    </p>
                  </div>

                  <div className="text-right">
                    <Badge
                      variant={
                        user.status === "active" ? "default" : "secondary"
                      }
                    >
                      {user.status === "active" ? "Activo" : "Inactivo"}
                    </Badge>

                    <p className="mt-1 text-[11px] text-slate-400">
                      {formatter.format(user.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
