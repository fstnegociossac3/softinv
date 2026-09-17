import { parseInventoryFile } from "../src/server/imports/inventory-file.parser";

async function main() {
  const csv = `
SKU,Descripcion,Stock,Costo
A001,Filtro aceite,15,22.50
A002,Pastilla freno,8,90
`.trim();

  const file = new File([csv], "inventario.csv", {
    type: "text/csv",
  });

  const result = await parseInventoryFile(file);

  console.log(result);
}

main().catch(console.error);
