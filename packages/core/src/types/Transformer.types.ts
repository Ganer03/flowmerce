import type { Product } from ".";

export type Transformer = (
  products: Product[]
) => Promise<Product[]> | Product[];