import { Readable } from "stream";
import { pipeline } from "stream/promises";

import { BatchStream } from "./batchStream";
import { createTransformerStream } from "./createTransformerStream";
import type { ConverterOptions, Product } from "./types";
import { collectColumns } from "./collectColumns";

type ColumnAwareFormatter = NodeJS.ReadWriteStream & {
  setColumns?: (columns: Set<string>) => void;
  mapRow?: (p: Product) => Record<string, any>;
};

export async function convert({
  products,
  formatter,
  transformers = [],
  batchSize = 10,
  output,
  collectColumns: shouldCollectColumns = false,
}: ConverterOptions) {

  const transformerStreams = transformers.map(createTransformerStream);

  if (shouldCollectColumns) {
    const f = formatter as ColumnAwareFormatter;

    if (!f.mapRow) {
      throw new Error(
        "Formatter must provide mapRow() when collectColumns is enabled",
      );
    }

    const columns = await collectColumns(products, transformers, f.mapRow);

    f.setColumns?.(columns);
  }

  const input = Readable.from(products, {
    objectMode: true,
  });

  const batcher = new BatchStream(batchSize);

  const streams = [
    input,
    batcher,
    ...transformerStreams,
    formatter,
    output,
  ];

  await pipeline(streams);
}