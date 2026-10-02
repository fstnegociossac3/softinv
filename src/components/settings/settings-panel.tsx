"use client";

import { useState } from "react";

import { IriSettingsForm } from "@/components/settings/iri-settings-form";

import { NotificationSettingsForm } from "@/components/settings/notification-settings-form";

import { RecommendationSettingsForm } from "@/components/settings/recommendation-settings-form";

import { TrafficLightSettingsForm } from "@/components/settings/traffic-light-settings-form";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { ResolvedCompanySettings } from "@/lib/settings/types";

import { cn } from "@/lib/utils";

const SECTIONS = [
  {
    id: "iri",
    label: "IRI",
  },

  {
    id: "recommendations",
    label: "Recomendaciones",
  },

  {
    id: "traffic-lights",
    label: "Semáforos",
  },

  {
    id: "notifications",
    label: "Notificaciones",
  },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

type SettingsPanelProps = {
  companyId: string;

  settings: ResolvedCompanySettings;
};

export function SettingsPanel({ companyId, settings }: SettingsPanelProps) {
  const [activeSection, setActiveSection] = useState<SectionId>("iri");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Secciones de configuración</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {SECTIONS.map((section) => {
            const active = section.id === activeSection;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-[#12365A] text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900",
                )}
              >
                {section.label}
              </button>
            );
          })}
        </div>

        {activeSection === "iri" ? (
          <IriSettingsForm
            companyId={companyId}
            initialConfig={settings.iri}
          />
        ) : activeSection === "recommendations" ? (
          <RecommendationSettingsForm
            companyId={companyId}
            initialConfig={settings.recommendations}
          />
        ) : activeSection === "traffic-lights" ? (
          <TrafficLightSettingsForm
            companyId={companyId}
            initialConfig={settings.trafficLights}
          />
        ) : (
          <NotificationSettingsForm
            companyId={companyId}
            initialConfig={settings.notifications}
          />
        )}
      </CardContent>
    </Card>
  );
}