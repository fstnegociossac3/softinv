"use client";

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

type CompanySettingsSelectorProps = {
  companies: CompanyOption[];

  companyId?: string;
};

export function CompanySettingsSelector({
  companies,
  companyId,
}: CompanySettingsSelectorProps) {
  const router = useRouter();

  const searchParams = useSearchParams();

  function handleCompanyChange(value: string | null) {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set("companyId", value);
    } else {
      params.delete("companyId");
    }

    const query = params.toString();

    router.push(query ? `/settings?${query}` : "/settings");
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4">
      <Label htmlFor="company-settings-select">Empresa</Label>

      <Select
        value={companyId ?? null}
        onValueChange={handleCompanyChange}
      >
        <SelectTrigger id="company-settings-select" className="w-full md:w-[320px]">
          <SelectValue placeholder="Selecciona una empresa" />
        </SelectTrigger>

        <SelectContent>
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