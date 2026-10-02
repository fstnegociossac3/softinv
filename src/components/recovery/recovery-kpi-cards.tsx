import {
  CircleDollarSign,
  Coins,
  Percent,
  WalletCards,
  ArrowDownRight,
  ArrowUpRight,
  Minus,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

type MonetaryMetric = {
  current: number;
  previous: number;
  changePercent: number | null;
};

type RateMetric = {
  current: number;
  previous: number;
  changePoints: number;
};

type Props = {
  immobilizedCapital: MonetaryMetric;

  potentiallyRecoverableCapital: MonetaryMetric;

  recoveredCapital: MonetaryMetric;

  recoveryRate: RateMetric;
};

const currencyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  maximumFractionDigits: 0,
});

function Variation({
  value,
  invert = false,
  points = false,
}: {
  value: number | null;

  invert?: boolean;

  points?: boolean;
}) {
  if (value === null) {
    return <span className="text-xs text-slate-400">Sin base comparativa</span>;
  }

  if (value === 0) {
    return (
      <div className="flex items-center gap-1 text-xs text-slate-500">
        <Minus className="size-3.5" />
        Sin variación
      </div>
    );
  }

  const positive = value > 0;

  /*
   * Capital inmovilizado:
   * bajar es positivo.
   */
  const favorable = invert ? !positive : positive;

  const Icon = positive ? ArrowUpRight : ArrowDownRight;

  return (
    <div
      className={`flex items-center gap-1 text-xs font-medium ${
        favorable ? "text-emerald-600" : "text-red-600"
      }`}
    >
      <Icon className="size-3.5" />

      {Math.abs(value).toFixed(2)}
      {points ? " pp" : " %"}

      <span className="font-normal text-slate-400">vs mes anterior</span>
    </div>
  );
}

export function RecoveryKpiCards({
  immobilizedCapital,
  potentiallyRecoverableCapital,
  recoveredCapital,
  recoveryRate,
}: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card className="bg-white">
        <CardContent>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Capital inmovilizado
              </p>

              <p className="mt-3 text-2xl font-bold text-slate-900">
                {currencyFormatter.format(immobilizedCapital.current)}
              </p>
            </div>

            <div className="flex size-11 items-center justify-center rounded-xl bg-red-50">
              <WalletCards className="size-5 text-red-600" />
            </div>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3">
            <Variation value={immobilizedCapital.changePercent} invert />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardContent>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Potencialmente recuperable
              </p>

              <p className="mt-3 text-2xl font-bold text-slate-900">
                {currencyFormatter.format(
                  potentiallyRecoverableCapital.current,
                )}
              </p>
            </div>

            <div className="flex size-11 items-center justify-center rounded-xl bg-amber-50">
              <Coins className="size-5 text-amber-600" />
            </div>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3">
            <Variation value={potentiallyRecoverableCapital.changePercent} />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardContent>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Capital recuperado
              </p>

              <p className="mt-3 text-2xl font-bold text-slate-900">
                {currencyFormatter.format(recoveredCapital.current)}
              </p>
            </div>

            <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50">
              <CircleDollarSign className="size-5 text-emerald-600" />
            </div>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3">
            <Variation value={recoveredCapital.changePercent} />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardContent>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Tasa de recuperación
              </p>

              <div className="mt-3 flex items-end gap-1">
                <p className="text-2xl font-bold text-slate-900">
                  {recoveryRate.current.toFixed(2)}
                </p>

                <span className="pb-0.5 text-sm text-slate-400">%</span>
              </div>
            </div>

            <div className="flex size-11 items-center justify-center rounded-xl bg-[#12365A]/10">
              <Percent className="size-5 text-[#12365A]" />
            </div>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3">
            <Variation value={recoveryRate.changePoints} points />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
