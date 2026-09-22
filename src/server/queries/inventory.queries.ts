import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  ilike,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

import { PERMISSIONS } from "@/config/permissions";

import { db } from "@/db";

import { companies, inventoryItems, inventoryMovements } from "@/db/schema";

import { requireAuth } from "@/server/services/auth.service";

import { requirePermission } from "@/server/services/authorization.service";

/*
|--------------------------------------------------------------------------
| TIPOS
|--------------------------------------------------------------------------
*/

export type InventorySortField =
  | "sku"
  | "description"
  | "category"
  | "brand"
  | "stock"
  | "unitCost"
  | "stockValue"
  | "lastMovementAt"
  | "createdAt";

export type InventorySortDirection = "asc" | "desc";

export type InventoryStockFilter = "with-stock" | "zero-stock";

export type InventoryFilters = {
  search?: string;

  companyId?: string;

  category?: string;

  brand?: string;

  status?: "active" | "inactive";

  stock?: InventoryStockFilter;

  sort?: InventorySortField;

  direction?: InventorySortDirection;

  page?: number;

  pageSize?: number;
};

/*
|--------------------------------------------------------------------------
| EMPRESA
|--------------------------------------------------------------------------
|
| Usuario:
| solamente puede ver su propia empresa.
|
| Administrador:
| puede ver todas o filtrar una empresa.
|
*/

function resolveInventoryCompanyFilter(
  auth: Awaited<ReturnType<typeof requireAuth>>,
  requestedCompanyId?: string,
): SQL | undefined {
  if (auth.profile.role === "user") {
    if (!auth.company) {
      return sql`false`;
    }

    return eq(inventoryItems.companyId, auth.company.id);
  }

  if (requestedCompanyId) {
    return eq(inventoryItems.companyId, requestedCompanyId);
  }

  return undefined;
}

/*
|--------------------------------------------------------------------------
| ORDENAMIENTO
|--------------------------------------------------------------------------
*/

function getOrderBy(
  sort: InventorySortField,
  direction: InventorySortDirection,
) {
  const column = {
    sku: inventoryItems.sku,

    description: inventoryItems.description,

    category: inventoryItems.category,

    brand: inventoryItems.brand,

    stock: inventoryItems.stockQuantity,

    unitCost: inventoryItems.unitCost,

    stockValue: inventoryItems.stockValue,

    lastMovementAt: inventoryItems.lastMovementDate,

    createdAt: inventoryItems.createdAt,
  }[sort];

  if (direction === "asc") {
    return asc(column);
  }

  return desc(column);
}

/*
|--------------------------------------------------------------------------
| LISTAR / BUSCAR / FILTRAR / ORDENAR / PAGINAR
|--------------------------------------------------------------------------
*/

export async function getInventoryItems(filters: InventoryFilters = {}) {
  const auth = await requireAuth();

  requirePermission(auth, PERMISSIONS.INVENTORY_VIEW);

  const page = Math.max(filters.page ?? 1, 1);

  const pageSize = Math.min(Math.max(filters.pageSize ?? 20, 1), 100);

  const sort = filters.sort ?? "lastMovementAt";

  const direction = filters.direction ?? "desc";

  const conditions: SQL[] = [];

  /*
   * FILTRO EMPRESA
   */
  const companyCondition = resolveInventoryCompanyFilter(
    auth,
    filters.companyId,
  );

  if (companyCondition) {
    conditions.push(companyCondition);
  }

  /*
   * BÚSQUEDA
   *
   * SKU
   * descripción
   * categoría
   * marca
   * ubicación
   */
  if (filters.search?.trim()) {
    const term = `%${filters.search.trim()}%`;

    const searchCondition = or(
      ilike(inventoryItems.sku, term),

      ilike(inventoryItems.description, term),

      ilike(inventoryItems.category, term),

      ilike(inventoryItems.brand, term),

      ilike(inventoryItems.location, term),
    );

    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  /*
   * CATEGORÍA
   */
  if (filters.category) {
    conditions.push(eq(inventoryItems.category, filters.category));
  }

  /*
   * MARCA
   */
  if (filters.brand) {
    conditions.push(eq(inventoryItems.brand, filters.brand));
  }

  /*
   * ESTADO
   */
  if (filters.status) {
    conditions.push(eq(inventoryItems.status, filters.status));
  }

  /*
   * STOCK
   */
  if (filters.stock === "with-stock") {
    conditions.push(gt(inventoryItems.stockQuantity, 0));
  }

  if (filters.stock === "zero-stock") {
    conditions.push(lte(inventoryItems.stockQuantity, 0));
  }

  const where = conditions.length ? and(...conditions) : undefined;

  /*
   * CONSULTA + TOTAL
   */
  const [rows, totalRows] = await Promise.all([
    db
      .select({
        id: inventoryItems.id,

        companyId: inventoryItems.companyId,

        companyName: companies.name,

        sku: inventoryItems.sku,

        description: inventoryItems.description,

        category: inventoryItems.category,

        brand: inventoryItems.brand,

        /*
         * Backend expone stock,
         * aunque en DB sea stock_quantity.
         */
        stock: inventoryItems.stockQuantity,

        unitCost: inventoryItems.unitCost,

        stockValue: inventoryItems.stockValue,

        /*
         * Backend expone lastMovementAt.
         */
        lastMovementAt: inventoryItems.lastMovementDate,

        location: inventoryItems.location,

        status: inventoryItems.status,

        createdAt: inventoryItems.createdAt,

        updatedAt: inventoryItems.updatedAt,
      })

      .from(inventoryItems)

      .innerJoin(companies, eq(companies.id, inventoryItems.companyId))

      .where(where)

      .orderBy(
        getOrderBy(sort, direction),

        asc(inventoryItems.sku),
      )

      .limit(pageSize)

      .offset((page - 1) * pageSize),

    db
      .select({
        total: count(),
      })

      .from(inventoryItems)

      .where(where),
  ]);

  return {
    data: rows,

    total: totalRows[0]?.total ?? 0,

    page,

    pageSize,

    sort,

    direction,
  };
}

/*
|--------------------------------------------------------------------------
| OPCIONES DE FILTROS
|--------------------------------------------------------------------------
|
| Obtenemos categorías y marcas disponibles.
|
*/

export async function getInventoryFilterOptions(companyId?: string) {
  const auth = await requireAuth();

  requirePermission(auth, PERMISSIONS.INVENTORY_VIEW);

  const companyCondition = resolveInventoryCompanyFilter(auth, companyId);

  const [categories, brands] = await Promise.all([
    db
      .selectDistinct({
        value: inventoryItems.category,
      })

      .from(inventoryItems)

      .where(
        and(
          companyCondition,

          sql`
              ${inventoryItems.category}
              is not null
            `,

          sql`
              ${inventoryItems.category}
              <> ''
            `,
        ),
      )

      .orderBy(asc(inventoryItems.category)),

    db
      .selectDistinct({
        value: inventoryItems.brand,
      })

      .from(inventoryItems)

      .where(
        and(
          companyCondition,

          sql`
              ${inventoryItems.brand}
              is not null
            `,

          sql`
              ${inventoryItems.brand}
              <> ''
            `,
        ),
      )

      .orderBy(asc(inventoryItems.brand)),
  ]);

  return {
    categories: categories.flatMap((row) => (row.value ? [row.value] : [])),

    brands: brands.flatMap((row) => (row.value ? [row.value] : [])),
  };
}

/*
|--------------------------------------------------------------------------
| DETALLE DEL PRODUCTO
|--------------------------------------------------------------------------
*/

export async function getInventoryItemById(itemId: string) {
  const auth = await requireAuth();

  requirePermission(auth, PERMISSIONS.INVENTORY_VIEW);

  const conditions: SQL[] = [eq(inventoryItems.id, itemId)];

  /*
   * Usuario normal:
   * restringimos nuevamente a su empresa.
   */
  const companyCondition = resolveInventoryCompanyFilter(auth);

  if (companyCondition) {
    conditions.push(companyCondition);
  }

  const [item] = await db
    .select({
      id: inventoryItems.id,

      companyId: inventoryItems.companyId,

      companyName: companies.name,

      sku: inventoryItems.sku,

      description: inventoryItems.description,

      category: inventoryItems.category,

      brand: inventoryItems.brand,

      stock: inventoryItems.stockQuantity,

      unitCost: inventoryItems.unitCost,

      stockValue: inventoryItems.stockValue,

      lastMovementAt: inventoryItems.lastMovementDate,

      location: inventoryItems.location,

      status: inventoryItems.status,

      sales30d: inventoryItems.sales30d,

      sales90d: inventoryItems.sales90d,

      sales180d: inventoryItems.sales180d,

      createdAt: inventoryItems.createdAt,

      updatedAt: inventoryItems.updatedAt,
    })

    .from(inventoryItems)

    .innerJoin(companies, eq(companies.id, inventoryItems.companyId))

    .where(and(...conditions))

    .limit(1);

  if (!item) {
    return null;
  }

  /*
   * HISTORIAL DE MOVIMIENTOS
   */
  const movements = await db
    .select({
      id: inventoryMovements.id,

      movementType: inventoryMovements.movementType,

      quantity: inventoryMovements.quantity,

      movementDate: inventoryMovements.movementDate,

      createdAt: inventoryMovements.createdAt,
    })

    .from(inventoryMovements)

    .where(
      and(
        eq(inventoryMovements.inventoryItemId, item.id),

        eq(inventoryMovements.companyId, item.companyId),
      ),
    )

    .orderBy(desc(inventoryMovements.movementDate))

    .limit(100);

  return {
    ...item,

    movements,
  };
}
