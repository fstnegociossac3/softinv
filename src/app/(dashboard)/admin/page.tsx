import { requireAdmin } from "@/server/services/auth.service";

export default async function AdminPage() {
  const auth = await requireAdmin();

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">
        Administración
      </h1>

      <p className="mt-4">
        Administrador: {auth.profile.fullName}
      </p>
    </main>
  );
}