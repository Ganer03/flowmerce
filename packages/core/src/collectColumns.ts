import type { Product, Transformer } from "./types";

export async function collectColumns(
  products: Iterable<Product>,
  transformers: Transformer[],
  mapRow: (p: Product) => Record<string, any>,
) {
  const columns = new Set<string>();

  for (const product of products) {
    let batch = [product];

    for (const transformer of transformers) {
      batch = await transformer(batch);
    }

    for (const p of batch) {
      const row = mapRow(p);
      Object.keys(row).forEach((k) => columns.add(k));
    }
  }

  return columns;
}