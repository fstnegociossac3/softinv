import { normalizeInventoryRow } from "../src/server/imports/inventory-normalizer";

const row = {
  Código: "A001",
  Producto: "Filtro de aceite",
  Existencia: "15",
  Costo: "S/ 22.50",
};

const result = normalizeInventoryRow(row, {
  sku: "Código",

  description: "Producto",

  stockQuantity: "Existencia",

  unitCost: "Costo",
});

console.dir(result, {
  depth: null,
});
