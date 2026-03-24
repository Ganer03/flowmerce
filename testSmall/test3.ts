import fs from "fs";
import { HandlebarsStreamWriter } from "@flowmerce/core";

function logMemory(label: string) {
  const used = process.memoryUsage();
  return {
    rss: Math.round(used.rss / 1024 / 1024),
    heap: Math.round(used.heapUsed / 1024 / 1024),
  };
}

function now() {
  return performance.now();
}

// 👉 важно для честности
function forceGC() {
  if (global.gc) {
    global.gc();
  }
}

async function testArray(count: number) {
  forceGC();

  const memBefore = logMemory("before");
  const start = now();

  const products = [];
  for (let i = 0; i < count; i++) {
    products.push({ productId: i });
  }

  const hsw = new HandlebarsStreamWriter();
  hsw.setHeader("");
  hsw.setBody(`{{this.productId}}\n`);
  hsw.setFooter("");

  const stream = hsw.createStream();
  stream.pipe(fs.createWriteStream("array.txt"));

  for (const p of products) {
    await hsw.putData(p);
  }

  await hsw.commit();

  const end = now();
  forceGC();

  const memAfter = logMemory("after");

  return {
    type: "array",
    time: Math.round(end - start),
    memoryDiff: memAfter.heap - memBefore.heap,
  };
}

async function* generate(count: number) {
  for (let i = 0; i < count; i++) {
    if (i % 1000 === 0) {
      await new Promise((r) => setImmediate(r)); // 👈 важно
    }

    yield { productId: i };
  }
}

async function testStream(count: number) {
  forceGC();

  const memBefore = logMemory("before");
  const start = now();

  const hsw = new HandlebarsStreamWriter();
  hsw.setHeader("");
  hsw.setBody(`{{this.productId}}\n`);
  hsw.setFooter("");

  const stream = hsw.createStream();
  stream.pipe(fs.createWriteStream("stream.txt"));

  for await (const p of generate(count)) {
    await hsw.putData(p);
  }

  await hsw.commit();

  const end = now();
  forceGC();

  const memAfter = logMemory("after");

  return {
    type: "stream",
    time: Math.round(end - start),
    memoryDiff: memAfter.heap - memBefore.heap,
  };
}

async function run() {
  const COUNT = 100_000;

  console.log("Running benchmark...\n");

  const arrayRes = await testArray(COUNT);
  const streamRes = await testStream(COUNT);

  console.table([arrayRes, streamRes]);
}

run();