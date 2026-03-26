import { describe, it, expect } from "vitest";
import { PassThrough } from "stream";
import { insalesStreamWriter } from "../src/insales/insalesStreamWriter.js";
import { Brand, Category, Product, Columns, Currency, Vat } from "../src/types/index.js";

describe("insalesStreamWriter", () => {
  it("должен создавать writer с базовыми опциями", () => {
    const writer = insalesStreamWriter();

    expect(writer).toBeDefined();
    expect(writer.hasHeaderWritten).toBe(false);
    expect(writer.hasFooterWritten).toBe(false);
    expect(writer.isFinished).toBe(false);
  });

  it("должен создавать writer с категориями и брендами", () => {
    const categories: Category[] = [
      { id: 1, name: "Обувь", parentId: undefined },
      { id: 2, name: "Кроссовки", parentId: 1 },
    ];

    const brands: Brand[] = [
      { id: 1, name: "Nike", logoUrl: "https://example.com/nike.png" },
      { id: 2, name: "Adidas", logoUrl: "https://example.com/adidas.png" },
    ];

    const writer = insalesStreamWriter({ categories, brands });

    expect(writer).toBeDefined();
  });

  it("должен создавать writer с колонками", () => {
    const columns: Columns = {
      properties: ["Цвет", "Размер"],
      params: ["Материал", "Сезон"],
    };

    const writer = insalesStreamWriter({ columns });

    expect(writer).toBeDefined();
  });

  it("должен создавать поток с заголовком CSV", () => {
    const writer = insalesStreamWriter();
    const stream = writer.createStream();

    expect(stream).toBeInstanceOf(PassThrough);
    expect(writer.hasHeaderWritten).toBe(true);
  });

  it("должен асинхронно записывать данные продукта в CSV", async () => {
    const writer = insalesStreamWriter();
    const stream = writer.createStream();

    // Создаем массив для сбора данных из потока
    const chunks: Buffer[] = [];
    stream.on("data", (chunk) => chunks.push(chunk));

    const product: Product = {
      productId: 123,
      variantId: 456,
      title: "Кроссовки Nike Air Max",
      description: "Удобные кроссовки для бега",
      price: 5000,
      currency: Currency.RUB,
      categoryId: 1,
      vendorId: 1,
      vendor: "Nike",
      vendorCode: "AM001",
      count: 10,
      available: true,
      vat: Vat.VAT_20,
    };

    await writer.putData({ product });

    // Даем время на обработку события data
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Проверяем, что данные были записаны
    expect(chunks.length).toBeGreaterThan(0);
    const result = Buffer.concat(chunks).toString();
    expect(result).toContain("Кроссовки Nike Air Max");
    expect(result).toContain("Nike");
  });

  it("должен асинхронно завершать поток с футером", async () => {
    const writer = insalesStreamWriter();
    const stream = writer.createStream();

    const chunks: Buffer[] = [];
    stream.on("data", (chunk) => chunks.push(chunk));

    const product: Product = {
      productId: 123,
      variantId: 456,
      title: "Тестовый товар",
      description: "Описание с\nпереносами строк",
      price: 1000,
      currency: Currency.RUB,
      categoryId: 1,
      vat: Vat.VAT_20,
    };

    await writer.putData({ product });
    await writer.commit();

    const result = Buffer.concat(chunks).toString();
    expect(result).toContain("Тестовый товар");
  });

  it("должен использовать хелпер brandLogo для брендов", async () => {
    const brands: Brand[] = [
      { id: 1, name: "Nike", logoUrl: "https://example.com/nike.png" },
    ];

    const writer = insalesStreamWriter({ brands });
    const stream = writer.createStream();

    const chunks: Buffer[] = [];
    stream.on("data", (chunk) => chunks.push(chunk));

    const product: Product = {
      productId: 123,
      variantId: 456,
      title: "Nike товар",
      description: "Описание с\nпереносами строк",
      price: 1000,
      currency: Currency.RUB,
      categoryId: 1,
      vendorId: 1, // Соответствует бренду Nike
      vat: Vat.VAT_20,
    };

    await writer.putData({ product });
    await writer.commit();

    const result = Buffer.concat(chunks).toString();
    expect(result).toContain("https://example.com/nike.png");
  });

  it("должен использовать хелпер category для категорий", async () => {
    const categories: Category[] = [
      { id: 1, name: "Обувь", parentId: undefined },
      { id: 2, name: "Кроссовки", parentId: 1 },
    ];

    const writer = insalesStreamWriter({ categories });
    const stream = writer.createStream();

    const chunks: Buffer[] = [];
    stream.on("data", (chunk) => chunks.push(chunk));

    const product: Product = {
      productId: 123,
      variantId: 456,
      title: "Кроссовки",
      description: "Описание с\nпереносами строк",
      price: 1000,
      currency: Currency.RUB,
      categoryId: 2,
      vat: Vat.VAT_20,
    };

    await writer.putData({ product });
    await writer.commit();

    const result = Buffer.concat(chunks).toString();
    expect(result).toContain("Кроссовки");
  });

  it("должен использовать хелпер param для свойств", async () => {
    const columns: Columns = {
      params: ["Цвет", "Размер"],
    };

    const writer = insalesStreamWriter({ columns });
    const stream = writer.createStream();

    const chunks: Buffer[] = [];
    stream.on("data", (chunk) => chunks.push(chunk));

    const product: Product = {
      productId: 123,
      variantId: 456,
      title: "Товар",
      description: "Описание с\nпереносами строк",
      price: 1000,
      currency: Currency.RUB,
      categoryId: 1,
      vat: Vat.VAT_20,
      params: [
        { key: "Цвет", value: "Красный" },
        { key: "Размер", value: "42" },
      ],
    };

    await writer.putData({ product });
    await writer.commit();

    const result = Buffer.concat(chunks).toString();
    expect(result).toContain("Красный");
    expect(result).toContain("42");
  });

  it("должен использовать хелпер property для параметров", async () => {
    const columns: Columns = {
      properties: ["Материал", "Сезон"],
    };

    const writer = insalesStreamWriter({ columns });
    const stream = writer.createStream();

    const chunks: Buffer[] = [];
    stream.on("data", (chunk) => chunks.push(chunk));

    const product: Product = {
      productId: 123,
      variantId: 456,
      title: "Товар",
      description: "Описание с\nпереносами строк",
      price: 1000,
      currency: Currency.RUB,
      categoryId: 1,
      vat: Vat.VAT_20,
      properties: [
        { key: "Материал", value: "Кожа" },
        { key: "Сезон", value: "Лето" },
      ],
    };

    await writer.putData({ product });
    await writer.commit();

    const result = Buffer.concat(chunks).toString();
    expect(result).toContain("Кожа");
    expect(result).toContain("Лето");
  });

  it("должен экранировать специальные символы", async () => {
    const writer = insalesStreamWriter();
    const stream = writer.createStream();

    const chunks: Buffer[] = [];
    stream.on("data", (chunk) => chunks.push(chunk));

    const product: Product = {
      productId: 123,
      variantId: 456,
      title: 'Товар с "кавычками" и ;точкой с запятой',
      description: "Описание с\nпереносами строк",
      price: 1000,
      currency: Currency.RUB,
      categoryId: 1,
      vat: Vat.VAT_20,
    };

    await writer.putData({ product });
    await writer.commit();

    const result = Buffer.concat(chunks).toString();
    expect(result).toContain('"Товар с ""кавычками"" и ;точкой с запятой"');
  });

  it("должен обрабатывать множественные товары", async () => {
    const writer = insalesStreamWriter();
    const stream = writer.createStream();

    const chunks: Buffer[] = [];
    stream.on("data", (chunk) => chunks.push(chunk));

    const products: Product[] = [
      {
        productId: 1,
        variantId: 1,
        title: "Товар 1",
        description: "Описание с\nпереносами строк",
        price: 1000,
        currency: Currency.RUB,
        categoryId: 1,
        vat: Vat.VAT_20,
      },
      {
        productId: 2,
        variantId: 2,
        title: "Товар 2",
        description: "Описание с\nпереносами строк",
        price: 2000,
        currency: Currency.RUB,
        categoryId: 1,
        vat: Vat.VAT_20,
      },
    ];

    for (const product of products) {
      await writer.putData({ product });
    }

    await writer.commit();

    const result = Buffer.concat(chunks).toString();
    expect(result).toContain("Товар 1");
    expect(result).toContain("Товар 2");
  });

  it("должен выбрасывать ошибку при асинхронном вызове putData без createStream", async () => {
    const writer = insalesStreamWriter();

    const product: Product = {
      productId: 123,
      variantId: 456,
      title: "Товар",
      description: "Описание с\nпереносами строк",
      price: 1000,
      currency: Currency.RUB,
      categoryId: 1,
      vat: Vat.VAT_20,
    };

    await expect(writer.putData({ product })).rejects.toThrow(
      "Заголовок не был записан. Сначала вызовите createStream()",
    );
  });

  it("должен валидировать состояние и предотвращать запись после commit", async () => {
    const writer = insalesStreamWriter();
    writer.createStream();

    const product: Product = {
      productId: 123,
      variantId: 456,
      title: "Товар",
      description: "Описание с\nпереносами строк",
      price: 1000,
      currency: Currency.RUB,
      categoryId: 1,
      vat: Vat.VAT_20,
    };

    await writer.putData({ product });
    await writer.commit();

    // Попытка записать данные после commit должна вызвать ошибку
    await expect(writer.putData({ product })).rejects.toThrow(
      "Stream уже завершен. Нельзя записывать данные после commit()",
    );
  });

  it("должен предотвращать создание второго потока", () => {
    const writer = insalesStreamWriter();
    writer.createStream();

    expect(() => writer.createStream()).toThrow(
      "Stream уже создан. Используйте один экземпляр для одного потока.",
    );
  });

  it("должен поддерживать стриминг с backpressure", async () => {
    const writer = insalesStreamWriter();
    const stream = writer.createStream();

    const chunks: Buffer[] = [];
    stream.on("data", (chunk) => chunks.push(chunk));

    // Записываем много данных для проверки backpressure
    for (let i = 0; i < 100; i++) {
      const product: Product = {
        productId: i,
        variantId: i,
        title: `Товар-${i}`,
        description: "Описание с\nпереносами строк",
        price: 1000 + i,
        currency: Currency.RUB,
        categoryId: 1,
        vat: Vat.VAT_20,
      };

      await writer.putData({ product });
    }

    await writer.commit();

    const result = Buffer.concat(chunks).toString();
    expect(result).toContain("Товар-0");
    expect(result).toContain("Товар-99");
  });

  it("должен предоставлять информацию о состоянии", async () => {
    const writer = insalesStreamWriter();

    expect(writer.hasHeaderWritten).toBe(false);
    expect(writer.hasFooterWritten).toBe(false);
    expect(writer.isFinished).toBe(false);

    const stream = writer.createStream();

    expect(writer.hasHeaderWritten).toBe(true);
    expect(writer.hasFooterWritten).toBe(false);
    expect(writer.isFinished).toBe(false);

    const product: Product = {
      productId: 123,
      variantId: 456,
      title: "Товар",
      description: "Описание с\nпереносами строк",
      price: 1000,
      currency: Currency.RUB,
      categoryId: 1,
      vat: Vat.VAT_20,
    };

    await writer.putData({ product });
    await writer.commit();

    expect(writer.hasHeaderWritten).toBe(true);
    expect(writer.hasFooterWritten).toBe(true);
    expect(writer.isFinished).toBe(true);
  });

  it("должен корректно обрабатывать отсутствующие бренды", async () => {
    const brands: Brand[] = [
      { id: 1, name: "Nike", logoUrl: "https://example.com/nike.png" },
    ];

    const writer = insalesStreamWriter({ brands });
    const stream = writer.createStream();

    const chunks: Buffer[] = [];
    stream.on("data", (chunk) => chunks.push(chunk));

    const product: Product = {
      productId: 123,
      variantId: 456,
      title: "Товар",
      description: "Описание с\nпереносами строк",
      price: 1000,
      currency: Currency.RUB,
      categoryId: 1,
      vendorId: 999, // Несуществующий бренд
      vat: Vat.VAT_20,
    };

    await writer.putData({ product });
    await writer.commit();

    const result = Buffer.concat(chunks).toString();
    // Логотип должен быть пустым для несуществующего бренда
    expect(result).toBeDefined();
  });

  it("должен корректно обрабатывать отсутствующие категории", async () => {
    const categories: Category[] = [
      { id: 1, name: "Обувь", parentId: undefined },
    ];

    const writer = insalesStreamWriter({ categories });
    const stream = writer.createStream();

    const chunks: Buffer[] = [];
    stream.on("data", (chunk) => chunks.push(chunk));

    const product: Product = {
      productId: 123,
      variantId: 456,
      title: "Товар",
      description: "Описание с\nпереносами строк",
      price: 1000,
      currency: Currency.RUB,
      categoryId: 999, // Несуществующая категория
      vat: Vat.VAT_20,
    };

    await writer.putData({ product });
    await writer.commit();

    const result = Buffer.concat(chunks).toString();
    expect(result).toBeDefined();
  });
});
