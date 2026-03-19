import { describe, it, expect, vi } from "vitest";
import { insalesFormatter } from "../src/insalesFormatter";
import type { Product, Category, Brand } from "@flowmerce/core";
import { Currency, Vat } from "@flowmerce/core";

describe("insalesFormatter", () => {
  it("должен создавать formatter stream", () => {
    const formatter = insalesFormatter();
    expect(formatter).toBeDefined();
    expect(typeof formatter._transform).toBe("function");
  });

  it("должен обрабатывать продукты и генерировать CSV", async () => {
    const formatter = insalesFormatter();

    const products: Product[] = [
      {
        productId: 1,
        variantId: 1,
        title: "Test Product",
        description: "Test Description",
        categoryId: 1,
        price: 100,
        currency: Currency.RUB,
        vat: Vat.VAT_20,
        vendor: "TestBrand",
      },
    ];

    const results: string[] = [];

    formatter.on("data", (chunk: Buffer) => {
      results.push(chunk.toString());
    });

    formatter.on("end", () => {
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toContain(";"); // CSV разделитель
    });

    formatter.write(products);
    formatter.end();
  });

  it("должен экранировать специальные символы", async () => {
    const formatter = insalesFormatter();

    const product: Product = {
      productId: 1,
      variantId: 1,
      title: 'Test "Product" with; semicolon',
      description: "Description with\nnewline",
      categoryId: 1,
      price: 100,
      currency: Currency.RUB,
      vat: Vat.VAT_20,
    };

    const results: string[] = [];

    formatter.on("data", (chunk: Buffer) => {
      results.push(chunk.toString());
    });

    formatter.on("end", () => {
      const output = results.join("");
      expect(output).toContain('"Test ""Product"" with; semicolon"');
      expect(output).toContain('"Description with\nnewline"');
    });

    formatter.write([product]);
    formatter.end();
  });

  it("должен работать с категориями и брендами", () => {
    const categories: Category[] = [{ id: 1, name: "Electronics" }];

    const brands: Brand[] = [{ id: 1, name: "TestBrand" }];

    const formatter = insalesFormatter({ categories, brands });
    expect(formatter).toBeDefined();
  });
});
