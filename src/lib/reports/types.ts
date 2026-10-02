import type { ReportType } from "@/config/reports";

/*
|--------------------------------------------------------------------------
| METADATA
|--------------------------------------------------------------------------
*/

export type ReportCompanyMetadata = {
  id: string;

  name: string;

  ruc: string | null;

  sector: string | null;

  country: string;

  timezone: string;

  currency: string;
};

export type ReportGeneratedBy = {
  id: string;

  name: string;
};

export type ReportPeriod = {
  from: string;

  to: string;

  days: number;
};

/*
|--------------------------------------------------------------------------
| SNAPSHOT
|--------------------------------------------------------------------------
|
| data cambia según el tipo:
|
| executive
| critical_inventory
| recommendations
| recovery
|
| schemaVersion permitirá evolucionar
| la estructura posteriormente.
|
*/

export type ReportSnapshot = {
  schemaVersion: number;

  type: ReportType;

  generatedAt: string;

  company: ReportCompanyMetadata;

  period: ReportPeriod;

  generatedBy: ReportGeneratedBy;

  data: Record<string, unknown>;
};
