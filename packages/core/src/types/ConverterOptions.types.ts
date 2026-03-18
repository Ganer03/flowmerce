import { Transform } from "stream";
import { Transformer, Product } from ".";

export interface ConverterOptions {
  products: Iterable<Product> | AsyncIterable<Product>;

  formatter: Transform;

  transformers?: Transformer[];

  batchSize?: number;

  flashInterval?: number;

  output: NodeJS.WritableStream;
}