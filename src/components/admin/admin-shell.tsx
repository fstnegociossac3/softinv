"use client";

import type { ReactNode } from "react";

import { useState } from "react";

import { Menu, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { AppRole } from "@/config/permissions";

import { AdminSidebar } from "@/components/admin/admin-sidebar";

type AdminShellProps = {
  children: ReactNode;

  fullName: string;

  role: AppRole;
};

export function AdminShell({ children, fullName, role }: AdminShellProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* SIDEBAR DESKTOP */}
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">
        <AdminSidebar fullName={fullName} role={role} />
      </div>

      {/* SIDEBAR MOBILE */}
      {mobileSidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-slate-950/25 backdrop-blur-[1px]"
            onClick={() => setMobileSidebarOpen(false)}
          />

          <div className="relative h-full w-72 shadow-2xl">
            <AdminSidebar
              fullName={fullName}
              role={role}
              onNavigate={() => setMobileSidebarOpen(false)}
            />
          </div>
        </div>
      ) : null}

      {/* CONTENIDO */}
      <div className="lg:pl-72">
        {/* HEADER */}
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-6">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileSidebarOpen(true)}
              >
                <Menu className="size-5" />

                <span className="sr-only">Abrir menú</span>
              </Button>

              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-[#12365A]" />

                  <p className="text-sm font-semibold text-slate-900">
                    Panel administrativo
                  </p>
                </div>

                <p className="hidden text-xs text-slate-400 sm:block">
                  Gestión central de RecuperaStock AI
                </p>
              </div>
            </div>

            <div className="hidden items-center gap-3 sm:flex">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-800">{fullName}</p>

                <p className="text-xs text-slate-400">Administrador</p>
              </div>

              <div className="size-2 rounded-full bg-emerald-500" />
            </div>
          </div>
        </header>

        {/* PÁGINAS */}
        <main className="mx-auto w-full max-w-[1600px] p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
