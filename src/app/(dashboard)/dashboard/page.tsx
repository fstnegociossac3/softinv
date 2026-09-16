import { Button } from "@/components/ui/button";

import { logoutAction } from "@/server/actions/auth.actions";
import {
  requireAuth,
} from "@/server/services/auth.service";

export default async function DashboardPage() {
  const auth = await requireAuth();

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">
        Dashboard
      </h1>

      <div className="mt-6 space-y-2">
        <p>
          Usuario:
          {" "}
          {auth.profile.fullName}
        </p>

        <p>
          Rol:
          {" "}
          {auth.profile.role}
        </p>

        <p>
          Empresa:
          {" "}
          {auth.company?.name ??
            "Acceso global"}
        </p>
      </div>

      <form
        action={logoutAction}
        className="mt-8"
      >
        <Button
          type="submit"
          variant="outline"
        >
          Cerrar sesión
        </Button>
      </form>
    </main>
  );
}