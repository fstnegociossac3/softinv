"use client";

import { Mail, MoreHorizontal, Pencil, Power, PowerOff } from "lucide-react";

import { useState } from "react";

import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { EditUserDialog } from "./edit-user-dialog";
import { UserEmailDialog } from "./user-email-dialog";
import { UserStatusDialog } from "./user-status-dialog";

type CompanyOption = {
  id: string;
  name: string;
};

type User = {
  id: string;

  fullName: string;

  email: string | null;

  companyId: string | null;

  status: "active" | "inactive";
};

type Props = {
  user: User;

  activeCompanies: CompanyOption[];
};

export function UserActions({ user, activeCompanies }: Props) {
  const [editOpen, setEditOpen] = useState(false);

  const [emailOpen, setEmailOpen] = useState(false);

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

          <DropdownMenuItem onClick={() => setEmailOpen(true)}>
            <Mail className="mr-2 size-4" />
            Cambiar correo
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setStatusOpen(true)}>
            {user.status === "active" ? (
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

      <EditUserDialog
        user={user}
        companies={activeCompanies}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <UserEmailDialog
        user={user}
        open={emailOpen}
        onOpenChange={setEmailOpen}
      />

      <UserStatusDialog
        user={user}
        open={statusOpen}
        onOpenChange={setStatusOpen}
      />
    </>
  );
}
