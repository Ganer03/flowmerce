import { Readable } from "stream";
import { pipeline } from "stream/promises";

import { BatchStream } from "./batchStream";
import { createTransformerStream } from "./createTransformerStream";
import type { ConverterOptions } from "./types";

export async function convert({
  products,
  formatter,
  transformers = [],
  batchSize = 10,
  output,
}: ConverterOptions) {
  const input = Readable.from(products, {
    objectMode: true,
  });

  const batcher = new BatchStream(batchSize);

  const transformerStreams = transformers.map(createTransformerStream);

  const streams = [
    input,
    batcher,
    ...transformerStreams,
    formatter,
    output,
  ];

  await pipeline(streams);
}