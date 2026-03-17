import { Brand, Category, Product } from "src/types";
import { Transform } from "stream";
import { Transformer } from ".";

export interface ConverterOptions {
  products: Iterable<Product>;

  categories?: Category[];

  brands?: Brand[];

  formatter: Transform;

  transformers?: Transformer[];

  batchSize?: number;

  output: NodeJS.WritableStream;
}