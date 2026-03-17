import { Transform } from "stream";
import type { Transformer, Product } from "./types";

export function createTransformerStream(transformer: Transformer) {
  return new Transform({
    objectMode: true,

    async transform(batch: Product[], _, callback) {
      try {
        const result = await transformer(batch);
        callback(null, result);
      } catch (err) {
        callback(err as Error);
      }
    },
  });
}