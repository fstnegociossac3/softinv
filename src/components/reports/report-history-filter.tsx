"use client";

import { Building2 } from "lucide-react";

import { useRouter, useSearchParams } from "next/navigation";

import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CompanyOption = {
  id: string;

  name: string;
};

type Props = {
  companies: CompanyOption[];

  companyId?: string;
};

export function ReportHistoryFilter({ companies, companyId }: Props) {
  const router = useRouter();

  const searchParams = useSearchParams();

  function changeCompany(value: string | null) {
    const params = new URLSearchParams(searchParams.toString());

    if (!value || value === "none") {
      params.delete("companyId");
    } else {
      params.set("companyId", value);
    }

    params.delete("page");

    const query = params.toString();

    router.push(query ? `/reports?${query}` : "/reports");
  }

  return (
    <div className="space-y-2">
      <Label>Empresa del historial</Label>

      <Select
        value={companyId ?? "none"}
        onValueChange={(value) => changeCompany(value ? String(value) : null)}
      >
        <SelectTrigger className="h-10 w-full sm:w-[300px]">
          <Building2 className="mr-2 size-4 text-slate-400" />

          <SelectValue placeholder="Selecciona empresa" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="none">Selecciona empresa</SelectItem>

          {companies.map((company) => (
            <SelectItem key={company.id} value={company.id}>
              {company.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
