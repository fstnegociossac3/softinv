"use client";

import { MoreHorizontal, Pencil, Power, PowerOff } from "lucide-react";

import { useState } from "react";

import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { EditCompanyDialog } from "./edit-company-dialog";

import { CompanyStatusDialog } from "./company-status-dialog";

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
};

export function CompanyActions({ company }: { company: Company }) {
  const [editOpen, setEditOpen] = useState(false);

  const [statusOpen, setStatusOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="size-4" />

              <span className="sr-only">Acciones</span>
            </Button>
          }
        />

        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 size-4" />
            Editar
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setStatusOpen(true)}>
            {company.status === "active" ? (
              <>
                <PowerOff className="mr-2 size-4" />
                Desactivar
              </>
            ) : (
              <>
                <Power className="mr-2 size-4" />
                Activar
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditCompanyDialog
        company={company}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <CompanyStatusDialog
        company={company}
        open={statusOpen}
        onOpenChange={setStatusOpen}
      />
    </>
  );
}
