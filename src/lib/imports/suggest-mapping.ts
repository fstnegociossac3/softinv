function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const aliases: Record<string, string[]> = {
  sku: [
    "sku",
    "codigo",
    "codigo producto",
    "codigo de producto",
    "cod producto",
    "cod",
    "item",
    "codigo item",
  ],

  description: [
    "descripcion",
    "producto",
    "nombre",
    "nombre producto",
    "descripcion producto",
    "articulo",
    "nombre articulo",
  ],

  stockQuantity: [
    "stock",
    "stock actual",
    "existencia",
    "existencias",
    "cantidad",
    "saldo",
    "cantidad actual",
    "inventario",
  ],

  unitCost: [
    "costo",
    "costo unitario",
    "costo promedio",
    "costo prom",
    "precio costo",
    "coste",
    "coste unitario",
  ],

  category: ["categoria", "familia", "linea", "tipo", "grupo"],

  brand: ["marca", "brand", "fabricante"],

  location: [
    "ubicacion",
    "localizacion",
    "almacen",
    "bodega",
    "sede",
    "rack",
    "estante",
    "ubicacion almacen",
  ],

  lastMovementDate: [
    "ultima fecha movimiento",
    "ultimo movimiento",
    "fecha ultimo movimiento",
    "fecha movimiento",
    "ultima salida",
    "fecha ultima salida",
  ],

  sales30d: ["ventas 30", "ventas 30d", "ventas 30 dias"],

  sales90d: ["ventas 90", "ventas 90d", "ventas 90 dias"],

  sales180d: ["ventas 180", "ventas 180d", "ventas 180 dias"],
};

export function suggestMapping(headers: string[]) {
  const normalizedHeaders = headers.map((header) => ({
    original: header,

    normalized: normalize(header),
  }));

  const result: Record<string, string> = {};

  for (const [field, names] of Object.entries(aliases)) {
    const match = normalizedHeaders.find((header) =>
      names.includes(header.normalized),
    );

    if (match) {
      result[field] = match.original;
    }
  }

  return result;
}
