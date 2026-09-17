"use client";

import type { ReactNode } from "react";

import { useState } from "react";

import { Building2, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";

import { UserSidebar } from "@/components/user/user-sidebar";

type UserShellProps = {
  children: ReactNode;

  fullName: string;

  companyName: string;
};

export function UserShell({ children, fullName, companyName }: UserShellProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* SIDEBAR DESKTOP */}
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">
        <UserSidebar fullName={fullName} companyName={companyName} />
      </div>

      {/* SIDEBAR MÓVIL */}
      {mobileSidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-slate-950/25 backdrop-blur-[1px]"
            onClick={() => setMobileSidebarOpen(false)}
          />

          <div className="relative h-full w-72 shadow-2xl">
            <UserSidebar
              fullName={fullName}
              companyName={companyName}
              onNavigate={() => setMobileSidebarOpen(false)}
            />
          </div>
        </div>
      ) : null}

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
                <p className="text-sm font-semibold text-slate-900">
                  RecuperaStock AI
                </p>

                <p className="hidden text-xs text-slate-400 sm:block">
                  Plataforma inteligente de inventarios
                </p>
              </div>
            </div>

            <div className="hidden items-center gap-3 sm:flex">
              <div className="flex size-9 items-center justify-center rounded-lg bg-[#12365A]/10">
                <Building2 className="size-4 text-[#12365A]" />
              </div>

              <div>
                <p className="max-w-52 truncate text-sm font-medium text-slate-800">
                  {companyName}
                </p>

                <p className="text-xs text-slate-400">Empresa activa</p>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
