import { Activity } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { IRI_WEIGHTS } from "@/config/iri";

import type { IriVariableScores } from "@/lib/iri/types";

type Props = {
  scores: IriVariableScores;
};

const variables = [
  {
    key: "demand" as const,

    label: "Demanda",

    description: "Nivel de salida comercial",

    weight: IRI_WEIGHTS.demand,
  },

  {
    key: "recency" as const,

    label: "Recencia",

    description: "Actividad reciente del SKU",

    weight: IRI_WEIGHTS.recency,
  },

  {
    key: "coverage" as const,

    label: "Cobertura",

    description: "Stock frente a demanda",

    weight: IRI_WEIGHTS.coverage,
  },

  {
    key: "trend" as const,

    label: "Tendencia",

    description: "Evolución de la demanda",

    weight: IRI_WEIGHTS.trend,
  },
];

export function IriVariables({ scores }: Props) {
  return (
    <Card className="bg-white">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="flex items-center gap-2">
          <Activity className="size-5 text-[#12365A]" />
          Variables del IRI
        </CardTitle>

        <p className="text-sm text-slate-500">
          Promedio de las variables utilizadas para calcular el índice.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {variables.map((variable) => {
          const value = scores[variable.key];

          return (
            <div key={variable.key}>
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-800">
                      {variable.label}
                    </p>

                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                      {Math.round(variable.weight * 100)}%
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">
                    {variable.description}
                  </p>
                </div>

                <p className="text-lg font-bold text-slate-900">{value}</p>
              </div>

              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#12365A]"
                  style={{
                    width: `${Math.min(value, 100)}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
