import { Package } from "lucide-react";

import { InventoryFilters } from "@/components/inventory/inventory-filters";
import { InventoryTable } from "@/components/inventory/inventory-table";

import { getCompanies } from "@/server/queries/company.queries";

import {
  getInventoryFilterOptions,
  getInventoryItems,
  type InventorySortDirection,
  type InventorySortField,
  type InventoryStockFilter,
} from "@/server/queries/inventory.queries";

import { requireAuth } from "@/server/services/auth.service";

type InventoryPageProps = {
  searchParams: Promise<{
    search?: string;
    companyId?: string;
    category?: string;
    brand?: string;
    status?: string;
    stock?: string;
    sort?: string;
    direction?: string;
    page?: string;
  }>;
};

const allowedSorts = new Set<InventorySortField>([
  "sku",
  "description",
  "category",
  "brand",
  "stock",
  "unitCost",
  "stockValue",
  "lastMovementAt",
  "createdAt",
]);

export default async function InventoryPage({
  searchParams,
}: InventoryPageProps) {
  const auth = await requireAuth();

  const params = await searchParams;

  /*
  |--------------------------------------------------------------------------
  | PAGINACIÓN
  |--------------------------------------------------------------------------
  */

  const page = Math.max(Number(params.page) || 1, 1);

  /*
  |--------------------------------------------------------------------------
  | ORDENAMIENTO
  |--------------------------------------------------------------------------
  */

  const sort =
    params.sort && allowedSorts.has(params.sort as InventorySortField)
      ? (params.sort as InventorySortField)
      : "lastMovementAt";

  const direction: InventorySortDirection =
    params.direction === "asc" ? "asc" : "desc";

  /*
  |--------------------------------------------------------------------------
  | ESTADO
  |--------------------------------------------------------------------------
  */

  const status =
    params.status === "active" || params.status === "inactive"
      ? params.status
      : undefined;

  /*
  |--------------------------------------------------------------------------
  | STOCK
  |--------------------------------------------------------------------------
  */

  const stock: InventoryStockFilter | undefined =
    params.stock === "with-stock" || params.stock === "zero-stock"
      ? params.stock
      : undefined;

  /*
  |--------------------------------------------------------------------------
  | EMPRESA
  |--------------------------------------------------------------------------
  |
  | Solo el administrador puede seleccionar otra empresa.
  |
  | Para usuario normal ignoramos cualquier companyId recibido por URL.
  |
  */

  const companyId =
    auth.profile.role === "admin" ? params.companyId : undefined;

  /*
  |--------------------------------------------------------------------------
  | CONSULTAS
  |--------------------------------------------------------------------------
  */

  const [inventoryResult, filterOptions, companiesResult] = await Promise.all([
    getInventoryItems({
      search: params.search,
      companyId,
      category: params.category,
      brand: params.brand,
      status,
      stock,
      sort,
      direction,
      page,
      pageSize: 20,
    }),

    getInventoryFilterOptions(companyId),

    auth.profile.role === "admin"
      ? getCompanies({
          page: 1,
          pageSize: 100,
        })
      : Promise.resolve(null),
  ]);

  /*
  |--------------------------------------------------------------------------
  | EMPRESAS PARA EL SELECT DEL ADMIN
  |--------------------------------------------------------------------------
  */

  const companies =
    companiesResult?.data.map((company) => ({
      id: company.id,
      name: company.name,
    })) ?? [];

  return (
    <div className="space-y-8">
      {/* ================================================================
          ENCABEZADO
      ================================================================= */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-[#12365A]/10">
            <Package className="size-5 text-[#12365A]" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Inventario
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Consulta productos, existencias, valorización y movimientos.
            </p>
          </div>
        </div>

        <div className="text-sm text-slate-500">
          {inventoryResult.total === 1
            ? "1 producto registrado"
            : `${inventoryResult.total} productos registrados`}
        </div>
      </div>

      {/* ================================================================
          FILTROS
      ================================================================= */}

      <InventoryFilters
        categories={filterOptions.categories}
        brands={filterOptions.brands}
        companies={companies}
        showCompanyFilter={auth.profile.role === "admin"}
      />

      {/* ================================================================
          TABLA
      ================================================================= */}

      <InventoryTable
        items={inventoryResult.data}
        total={inventoryResult.total}
        page={inventoryResult.page}
        pageSize={inventoryResult.pageSize}
        showCompany={auth.profile.role === "admin"}
      />
    </div>
  );
}
