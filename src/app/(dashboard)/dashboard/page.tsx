import { BarChart3, Package, Sparkles, TrendingUp } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardPage() {
  const cards = [
    {
      title: "Inventario",
      value: "Pendiente",

      description: "Inventario registrado",

      icon: Package,
    },
    {
      title: "Análisis",

      value: "Pendiente",

      description: "Análisis realizados",

      icon: BarChart3,
    },
    {
      title: "Recomendaciones",

      value: "Pendiente",

      description: "Oportunidades detectadas",

      icon: Sparkles,
    },
    {
      title: "Recuperación",

      value: "Pendiente",

      description: "Valor recuperado",

      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
          Dashboard
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Resumen general de la operación de tu empresa.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <Card
              key={card.title}
              className="border-none bg-white shadow-sm ring-1 ring-slate-200"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {card.title}
                    </p>

                    <p className="mt-2 text-xl font-bold text-slate-900">
                      {card.value}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {card.description}
                    </p>
                  </div>

                  <div className="flex size-11 items-center justify-center rounded-xl bg-[#12365A]/10">
                    <Icon className="size-5 text-[#12365A]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Bienvenido a RecuperaStock AI</CardTitle>

          <CardDescription>
            Los módulos operativos se irán habilitando conforme avancemos con su
            implementación.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
