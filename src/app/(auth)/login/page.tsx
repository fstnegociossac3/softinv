import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { loginAction } from "@/server/actions/auth.actions";
import { getCurrentAuthContext } from "@/server/services/auth.service";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  invalid_form: "Revisa el correo y la contraseña.",

  invalid_credentials: "Correo o contraseña incorrectos.",

  account_not_configured: "Tu cuenta todavía no está configurada.",

  account_inactive: "Tu cuenta se encuentra inactiva.",

  company_inactive: "La empresa asociada a tu cuenta se encuentra inactiva.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const context = await getCurrentAuthContext();

  if (context) {
    redirect("/dashboard");
  }

  const params = await searchParams;

  const message = params.error ? errorMessages[params.error] : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">RecuperaStock AI</CardTitle>

          <CardDescription>
            Plataforma Inteligente para Recuperación de Inventarios
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form action={loginAction} className="space-y-5">
            {message && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {message}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>

              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>

              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>

            <Button type="submit" className="w-full">
              Iniciar sesión
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
