import { describe, it, expect, vi } from "vitest";
import { Readable, Writable, Transform } from "stream";
import { convert } from "../src/converter";
import { Currency, Vat, Product } from "../src/types";

describe("convert", () => {
  it("должен обрабатывать продукты через стрим", async () => {
    const productsData: Product[] = [
      {
        productId: 1,
        variantId: 1,
        title: "Test Product 1",
        description: "Description 1",
        categoryId: 1,
        price: 100,
        currency: Currency.RUB,
        vat: Vat.VAT_20,
      },
      {
        productId: 2,
        variantId: 2,
        title: "Test Product 2",
        description: "Description 2",
        categoryId: 1,
        price: 200,
        currency: Currency.RUB,
        vat: Vat.VAT_20,
      },
    ];

    // Создаем Readable поток из массива продуктов
    const products = Readable.from(productsData, { objectMode: true });

    // Создаем Writable поток для output
    const mockOutput = new Writable({
      objectMode: true,
      write(chunk: any, encoding: any, callback: any) {
        callback();
      }
    });

    // Создаем Transform поток для formatter, который принимает массивы продуктов
    const mockFormatter = new Transform({
      objectMode: true,
      transform(batch: Product[], encoding: any, callback: any) {
        // Просто передаем батч дальше
        callback(null, batch);
      },
    });

    // Проверяем, что функция не бросает ошибку
    await expect(convert({
      products,
      formatter: mockFormatter,
      output: mockOutput,
      batchSize: 2,
    })).resolves.not.toThrow();
  });

  it("должен работать с трансформерами", async () => {
    const productsData: Product[] = [
      {
        productId: 1,
        variantId: 1,
        title: "Test Product",
        description: "Description",
        categoryId: 1,
        price: 100,
        currency: Currency.RUB,
        vat: Vat.VAT_20,
      },
    ];

    // Создаем Readable поток из массива продуктов
    const products = Readable.from(productsData, { objectMode: true });

    // Создаем Writable поток для output
    const mockOutput = new Writable({
      objectMode: true,
      write(chunk: any, encoding: any, callback: any) {
        callback();
      }
    });

    // Создаем Transform поток для formatter, который принимает массивы продуктов
    const mockFormatter = new Transform({
      objectMode: true,
      transform(batch: Product[], encoding: any, callback: any) {
        // Просто передаем батч дальше
        callback(null, batch);
      },
    });

    const transformer = async (batch: Product[]) => {
      return batch.map((product) => ({
        ...product,
        title: `Transformed: ${product.title}`,
      }));
    };

    // Проверяем, что функция не бросает ошибку
    await expect(convert({
      products,
      formatter: mockFormatter,
      transformers: [transformer],
      output: mockOutput,
      batchSize: 1,
    })).resolves.not.toThrow();
  });
});
