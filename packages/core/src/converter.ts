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
    flashInterval = 2000,
    output
}: ConverterOptions) {
    const input = Readable.from(products, {
        objectMode: true,
    });

    const batcher = new BatchStream(batchSize, flashInterval);

    const transformerStreams = transformers.map(createTransformerStream);

    await pipeline(
        input,
        batcher,
        ...transformerStreams,
        formatter,
        output
    );
}