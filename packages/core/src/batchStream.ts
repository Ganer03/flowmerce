import { Transform } from "stream";
import { Product } from ".";

export class BatchStream extends Transform {
  private buffer: Product[] = [];
  private timer?: NodeJS.Timeout;

  constructor(
    private batchSize: number,
    private flushInterval: number
  ) {
    super({ objectMode: true });
  }

  _transform(chunk: Product, _: any, cb: any) {
    this.buffer.push(chunk);

    if (this.buffer.length >= this.batchSize) {
      this.flush();
    } else {
      this.schedule();
    }

    cb();
  }

  private flush() {
    if (!this.buffer.length) return;

    this.push(this.buffer);
    this.buffer = [];

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }

  private schedule() {
    if (this.timer) return;

    this.timer = setTimeout(() => this.flush(), this.flushInterval);
  }

  _flush(cb: any) {
    this.flush();
    cb();
  }
}