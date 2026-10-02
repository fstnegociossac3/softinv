import { Boxes, CircleDollarSign, ListChecks, ReceiptText } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  from: string;
  to: string;

  recoveredCapital: number;
  recoveredUnits: number;
  casesWithRecovery: number;
  events: number;
};

const currencyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("es-PE", {
  maximumFractionDigits: 4,
});

export function RecoveryPeriodTotal({
  from,
  to,
  recoveredCapital,
  recoveredUnits,
  casesWithRecovery,
  events,
}: Props) {
  return (
    <Card className="overflow-hidden bg-white">
      <CardHeader className="border-b border-slate-100">
        <CardTitle>Total recuperado del periodo</CardTitle>

        <p className="text-sm text-slate-500">
          {from}
          {" — "}
          {to}
        </p>
      </CardHeader>

      <CardContent>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50">
              <CircleDollarSign className="size-5 text-emerald-600" />
            </div>

            <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">
              Capital recuperado
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {currencyFormatter.format(recoveredCapital)}
            </p>
          </div>

          <div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50">
              <Boxes className="size-5 text-blue-600" />
            </div>

            <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">
              Unidades recuperadas
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {numberFormatter.format(recoveredUnits)}
            </p>
          </div>

          <div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-violet-50">
              <ListChecks className="size-5 text-violet-600" />
            </div>

            <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">
              Casos con recuperación
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {casesWithRecovery}
            </p>
          </div>

          <div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50">
              <ReceiptText className="size-5 text-amber-600" />
            </div>

            <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">
              Eventos registrados
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">{events}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
