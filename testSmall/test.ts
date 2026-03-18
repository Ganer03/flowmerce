import fs from 'fs';
import { convert, Product } from "@flowmerce/core";
import { insalesFormatter } from "@flowmerce/insales";

function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function* fakeApi(products: Product[]) {
  for (const product of products) {
    await delay(1000 + Math.random() * 2000);
    console.log("API отдал:", product.productId);
    yield product;
  }
}

const productsData = require("./product.json");

async function run() {
  const output = fs.createWriteStream("out1.csv");

  await convert({
    products: fakeApi(productsData),
    formatter: insalesFormatter(),
    batchSize: 2,
    output,
  });

  console.log("Готово");
}

run();