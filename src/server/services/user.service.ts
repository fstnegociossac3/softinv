import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";

import { auditLogs, companies, companyUsers, profiles } from "@/db/schema";

import { AUDIT_ACTIONS, AUDIT_MODULES } from "@/config/audit";

import { PERMISSIONS } from "@/config/permissions";

import { createAdminClient } from "@/lib/supabase/admin";

import type { CreateUserInput, UpdateUserInput } from "@/lib/validations/user";

import { DomainError } from "@/server/errors/domain.error";

import type { AuthContext } from "@/server/services/auth.service";

import { requirePermission } from "@/server/services/authorization.service";

import { getRequestMetadata } from "@/server/utils/request-metadata";

// VERIFICACION DE LA EMPRESA SI SE ENCUENTRA ACTIVA
async function getActiveCompany(companyId: string) {
  const [company] = await db
    .select()
    .from(companies)
    .where(and(eq(companies.id, companyId), eq(companies.status, "active")))
    .limit(1);

  if (!company) {
    throw new DomainError(
      "COMPANY_NOT_AVAILABLE",
      "La empresa seleccionada no existe o está inactiva.",
    );
  }

  return company;
}

// CREACION DE USUARIO
export async function createManagedUser(
  auth: AuthContext,
  input: CreateUserInput,
) {
  requirePermission(auth, PERMISSIONS.USER_CREATE);

  const company = await getActiveCompany(input.companyId);

  const supabase = createAdminClient();

  const request = await getRequestMetadata();

  const { data, error } = await supabase.auth.admin.createUser({
    email: input.email,

    password: input.password,

    email_confirm: true,
  });

  if (error || !data.user) {
    throw new DomainError(
      "AUTH_USER_CREATE_FAILED",
      "No se pudo crear el usuario. Verifica que el correo no esté registrado.",
    );
  }

  const userId = data.user.id;

  try {
    await db.transaction(async (tx) => {
      await tx.insert(profiles).values({
        id: userId,

        fullName: input.fullName,

        role: "user",

        status: "active",
      });

      await tx.insert(companyUsers).values({
        userId,
        companyId: company.id,
      });

      await tx.insert(auditLogs).values({
        companyId: company.id,

        userId: auth.userId,

        module: AUDIT_MODULES.USERS,

        action: AUDIT_ACTIONS.CREATE,

        entityType: "user",

        entityId: userId,

        newValues: {
          fullName: input.fullName,

          email: input.email,

          companyId: company.id,

          status: "active",

          role: "user",
        },

        requestId: request.requestId,

        ipAddress: request.ipAddress,

        userAgent: request.userAgent,
      });
    });
  } catch (error) {
    const rollback = await supabase.auth.admin.deleteUser(userId);

    if (rollback.error) {
      console.error(
        "CRITICAL: no se pudo revertir usuario Auth:",
        userId,
        rollback.error,
      );
    }

    throw error;
  }

  return {
    id: userId,

    email: input.email,

    fullName: input.fullName,

    companyId: company.id,
  };
}

// ACTUALIZAR DATOS DEL USUARIO Y EMPRESA
export async function updateManagedUser(
  auth: AuthContext,
  userId: string,
  input: UpdateUserInput,
) {
  requirePermission(auth, PERMISSIONS.USER_UPDATE);

  const company = await getActiveCompany(input.companyId);

  const request = await getRequestMetadata();

  return db.transaction(async (tx) => {
    const [current] = await tx
      .select({
        id: profiles.id,

        fullName: profiles.fullName,

        role: profiles.role,

        status: profiles.status,

        companyId: companyUsers.companyId,
      })
      .from(profiles)
      .leftJoin(companyUsers, eq(companyUsers.userId, profiles.id))
      .where(eq(profiles.id, userId))
      .limit(1);

    if (!current || current.role !== "user") {
      throw new DomainError("USER_NOT_FOUND", "El usuario no existe.");
    }

    const [updated] = await tx
      .update(profiles)
      .set({
        fullName: input.fullName,

        updatedAt: new Date(),
      })
      .where(eq(profiles.id, userId))
      .returning();

    await tx
      .update(companyUsers)
      .set({
        companyId: company.id,
      })
      .where(eq(companyUsers.userId, userId));

    await tx.insert(auditLogs).values({
      companyId: company.id,

      userId: auth.userId,

      module: AUDIT_MODULES.USERS,

      action: AUDIT_ACTIONS.UPDATE,

      entityType: "user",

      entityId: userId,

      oldValues: {
        fullName: current.fullName,

        companyId: current.companyId,
      },

      newValues: {
        fullName: updated.fullName,

        companyId: company.id,
      },

      requestId: request.requestId,

      ipAddress: request.ipAddress,

      userAgent: request.userAgent,
    });

    return updated;
  });
}

// ACTIVAR Y DESACTIVAR EL ESTADO DEL USUARIO
export async function changeManagedUserStatus(
  auth: AuthContext,
  userId: string,
  status: "active" | "inactive",
) {
  requirePermission(auth, PERMISSIONS.USER_CHANGE_STATUS);

  const request = await getRequestMetadata();

  return db.transaction(async (tx) => {
    const [current] = await tx
      .select({
        id: profiles.id,

        role: profiles.role,

        status: profiles.status,

        companyId: companyUsers.companyId,
      })
      .from(profiles)
      .leftJoin(companyUsers, eq(companyUsers.userId, profiles.id))
      .where(eq(profiles.id, userId))
      .limit(1);

    if (!current || current.role !== "user") {
      throw new DomainError("USER_NOT_FOUND", "El usuario no existe.");
    }

    if (current.status === status) {
      return current;
    }

    const [updated] = await tx
      .update(profiles)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, userId))
      .returning();

    await tx.insert(auditLogs).values({
      companyId: current.companyId,

      userId: auth.userId,

      module: AUDIT_MODULES.USERS,

      action:
        status === "active" ? AUDIT_ACTIONS.ACTIVATE : AUDIT_ACTIONS.DEACTIVATE,

      entityType: "user",

      entityId: userId,

      oldValues: {
        status: current.status,
      },

      newValues: {
        status: updated.status,
      },

      requestId: request.requestId,

      ipAddress: request.ipAddress,

      userAgent: request.userAgent,
    });

    return updated;
  });
}

// ACTUALIZACION DE CORREO ELECTRONICO DEL USUARIO
export async function updateManagedUserEmail(
  auth: AuthContext,
  userId: string,
  email: string,
) {
  requirePermission(auth, PERMISSIONS.USER_UPDATE);

  const [profile] = await db
    .select({
      id: profiles.id,

      role: profiles.role,

      companyId: companyUsers.companyId,
    })
    .from(profiles)
    .leftJoin(companyUsers, eq(companyUsers.userId, profiles.id))
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!profile || profile.role !== "user") {
    throw new DomainError("USER_NOT_FOUND", "El usuario no existe.");
  }

  const supabase = createAdminClient();

  const { data: currentResult, error: currentError } =
    await supabase.auth.admin.getUserById(userId);

  if (currentError || !currentResult.user) {
    throw new DomainError(
      "AUTH_USER_NOT_FOUND",
      "No se pudo encontrar la cuenta de autenticación.",
    );
  }

  const oldEmail = currentResult.user.email;

  if (!oldEmail) {
    throw new DomainError(
      "AUTH_EMAIL_MISSING",
      "El usuario no tiene correo registrado.",
    );
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(
    userId,
    {
      email,
      email_confirm: true,
    },
  );

  if (updateError) {
    throw new DomainError(
      "AUTH_EMAIL_UPDATE_FAILED",
      "No se pudo actualizar el correo. Verifica que no esté registrado.",
    );
  }

  try {
    const request = await getRequestMetadata();

    await db.insert(auditLogs).values({
      companyId: profile.companyId,

      userId: auth.userId,

      module: AUDIT_MODULES.USERS,

      action: AUDIT_ACTIONS.UPDATE,

      entityType: "user",

      entityId: userId,

      oldValues: {
        email: oldEmail,
      },

      newValues: {
        email,
      },

      metadata: {
        field: "email",
      },

      requestId: request.requestId,

      ipAddress: request.ipAddress,

      userAgent: request.userAgent,
    });
  } catch (error) {
    /*
     * Intento compensatorio.
     */
    const rollback = await supabase.auth.admin.updateUserById(userId, {
      email: oldEmail,

      email_confirm: true,
    });

    if (rollback.error) {
      console.error("CRITICAL: No se pudo revertir cambio de email:", userId);
    }

    throw error;
  }

  return {
    id: userId,

    email,
  };
}
