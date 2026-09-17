"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { CarFront, LogOut, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

import { adminNavigationItems } from "@/config/navigation";

import { ROLE_PERMISSIONS, type AppRole } from "@/config/permissions";

import { cn } from "@/lib/utils";

import { logoutAction } from "@/server/actions/auth.actions";

type AdminSidebarProps = {
  fullName: string;
  role: AppRole;
  className?: string;
  onNavigate?: () => void;
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

export function AdminSidebar({
  fullName,
  role,
  className,
  onNavigate,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const permissions = ROLE_PERMISSIONS[role];

  const allowedItems = adminNavigationItems.filter((item) =>
    permissions.includes(item.permission),
  );

  return (
    <aside
      className={cn(
        "flex h-full w-72 flex-col border-r border-slate-200 bg-white",
        className,
      )}
    >
      {/* LOGO */}
      <div className="flex h-20 items-center border-b border-slate-200 px-6">
        <Link
          href="/admin"
          onClick={onNavigate}
          className="flex items-center gap-3"
        >
          <div className="flex size-11 items-center justify-center rounded-xl bg-[#12365A] shadow-sm">
            <CarFront className="size-5 text-white" />
          </div>

          <div>
            <p className="font-bold tracking-tight text-slate-900">
              RecuperaStock
              <span className="text-red-600"> AI</span>
            </p>

            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
              Administración
            </p>
          </div>
        </Link>
      </div>

      {/* NAVEGACIÓN */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          Panel administrativo
        </p>

        <nav className="space-y-1">
          {allowedItems.map((item) => {
            const Icon = item.icon;

            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "group flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all",
                  active
                    ? "bg-[#12365A] text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                <Icon
                  className={cn(
                    "size-5",
                    active
                      ? "text-white"
                      : "text-slate-400 group-hover:text-[#12365A]",
                  )}
                />

                {item.title}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* USUARIO */}
      <div className="border-t border-slate-200 p-4">
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#12365A]/10 text-sm font-bold text-[#12365A]">
              {getInitials(fullName)}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">
                {fullName}
              </p>

              <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                <ShieldCheck className="size-3.5 text-emerald-600" />
                Administrador
              </div>
            </div>
          </div>

          <form action={logoutAction} className="mt-3">
            <Button
              type="submit"
              variant="ghost"
              className="w-full justify-start text-slate-600 hover:text-red-600"
            >
              <LogOut className="mr-2 size-4" />
              Cerrar sesión
            </Button>
          </form>
        </div>
      </div>
    </aside>
  );
}
