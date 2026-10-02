import {
  CircleDollarSign,
  Coins,
  HandCoins,
  PackageSearch,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import type { DashboardKpi } from "@/lib/dashboard/types";

import { cn } from "@/lib/utils";

type VariationTone = "upGood" | "downGood" | "opportunity";

function formatPercentage(value: number) {
  const rounded = Math.round(value * 10) / 10;

  const text = Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);

  return rounded > 0 ? `+${text}%` : `${text}%`;
}

function getVariation(
  changePercentage: number | null,

  tone: VariationTone,
) {
  if (changePercentage === null) {
    return {
      text: "Sin base anterior",

      className: "text-slate-400",
    };
  }

  const rounded = Math.round(changePercentage * 10) / 10;

  if (rounded === 0) {
    return {
      text: "0% vs. periodo anterior",

      className: "text-slate-400",
    };
  }

  const arrow = rounded > 0 ? "↑" : "↓";

  const percentage = formatPercentage(changePercentage);

  if (tone === "upGood") {
    return rounded > 0
      ? {
          text: `${arrow} ${percentage} vs. periodo anterior`,

          className: "text-emerald-600",
        }
      : {
          text: `${arrow} ${percentage} vs. periodo anterior`,

          className: "text-red-500",
        };
  }

  if (tone === "downGood") {
    return rounded < 0
      ? {
          text: `${arrow} ${percentage} vs. periodo anterior`,

          className: "text-emerald-600",
        }
      : {
          text: `${arrow} ${percentage} vs. periodo anterior`,

          className: "text-red-500",
        };
  }

  /*
   * Capital recuperable:
   * oportunidad identificada.
   */
  return rounded > 0
    ? {
        text: `${arrow} ${percentage} · oportunidad identificada`,

        className: "text-teal-600",
      }
    : {
        text: `${arrow} ${percentage} vs. periodo anterior`,

        className: "text-slate-500",
      };
}

type DashboardKpiCardProps = {
  title: string;

  value: string;

  icon: LucideIcon;

  iconWrapperClass: string;

  iconClass: string;

  variation: {
    text: string;

    className: string;
  };
};

function DashboardKpiCard({
  title,
  value,
  icon: Icon,
  iconWrapperClass,
  iconClass,
  variation,
}: DashboardKpiCardProps) {
  return (
    <Card className="bg-white">
      <CardContent>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {title}
            </p>

            <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 xl:text-3xl">
              {value}
            </p>
          </div>

          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl",

              iconWrapperClass,
            )}
          >
            <Icon className={cn("size-5", iconClass)} />
          </div>
        </div>

        <div className="mt-4 border-t border-slate-100 pt-3">
          <p className={cn("text-sm font-medium", variation.className)}>
            {variation.text}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

type DashboardKpiCardsProps = {
  kpis: {
    skuAnalyzed: DashboardKpi;

    immobilizedCapital: DashboardKpi;

    criticalSku: DashboardKpi;

    recoverableCapital: DashboardKpi;

    recoveredCapital: DashboardKpi;
  };
};

const countFormatter = new Intl.NumberFormat("es-PE");

const currencyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",

  currency: "PEN",

  maximumFractionDigits: 0,
});

export function DashboardKpiCards({ kpis }: DashboardKpiCardsProps) {
  const cards = [
    {
      title: "SKU analizados",

      value: countFormatter.format(kpis.skuAnalyzed.current),

      icon: PackageSearch,

      iconWrapperClass: "bg-[#12365A]/10",

      iconClass: "text-[#12365A]",

      variation: getVariation(
        kpis.skuAnalyzed.changePercentage,

        "upGood",
      ),
    },

    {
      title: "Capital inmovilizado",

      value: currencyFormatter.format(kpis.immobilizedCapital.current),

      icon: CircleDollarSign,

      iconWrapperClass: "bg-amber-50",

      iconClass: "text-amber-600",

      variation: getVariation(
        kpis.immobilizedCapital.changePercentage,

        "downGood",
      ),
    },

    {
      title: "SKU críticos",

      value: countFormatter.format(kpis.criticalSku.current),

      icon: TriangleAlert,

      iconWrapperClass: "bg-red-50",

      iconClass: "text-red-600",

      variation: getVariation(
        kpis.criticalSku.changePercentage,

        "downGood",
      ),
    },

    {
      title: "Capital recuperable",

      value: currencyFormatter.format(kpis.recoverableCapital.current),

      icon: Coins,

      iconWrapperClass: "bg-teal-50",

      iconClass: "text-teal-600",

      variation: getVariation(
        kpis.recoverableCapital.changePercentage,

        "opportunity",
      ),
    },

    {
      title: "Capital recuperado",

      value: currencyFormatter.format(kpis.recoveredCapital.current),

      icon: HandCoins,

      iconWrapperClass: "bg-emerald-50",

      iconClass: "text-emerald-600",

      variation: getVariation(
        kpis.recoveredCapital.changePercentage,

        "upGood",
      ),
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <DashboardKpiCard key={card.title} {...card} />
      ))}
    </div>
  );
}