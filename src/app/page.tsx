export default function HomePage() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="space-y-3 text-center">
        <h1 className="text-4xl font-bold">
          RecuperaStock AI
        </h1>

        <p>
          Entorno de desarrollo
        </p>

        <p className="text-sm">
          Supabase:
          {supabaseUrl ? " Configurado ✅" : " No configurado ❌"}
        </p>
      </div>
    </main>
  );
}