import { Transform } from "stream";
import type { Product } from "./types";

export class BatchStream extends Transform {
  private buffer: Product[] = [];

  constructor(private batchSize: number) {
    super({ objectMode: true });
  }

  _transform(chunk: Product, _: any, cb: any) {
    this.buffer.push(chunk);

    if (this.buffer.length >= this.batchSize) {
      this.push(this.buffer);
      this.buffer = [];
    }

    cb();
  }

  _flush(cb: any) {
    if (this.buffer.length) {
      this.push(this.buffer);
    }

    cb();
  }
}