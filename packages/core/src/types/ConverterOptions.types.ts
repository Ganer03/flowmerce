import { Product } from "src/types";
import { Transform } from "stream";
import { Transformer } from ".";

export interface ConverterOptions {
  products: Iterable<Product>;

  formatter: Transform;

  transformers?: Transformer[];

  batchSize?: number;

  output: NodeJS.WritableStream;

  collectColumns?: boolean;
}