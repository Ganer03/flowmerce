import fs from "fs";
import { Product } from "@flowmerce/core";
import { HandlebarsStreamWriter } from "@flowmerce/core";
import { Brand, Category } from "@flowmerce/core/src/types";

type CustomProduct = Product & {
  children: Product[];
};

function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

const properties = [
  "ID",
  "ID варианта",
  "Заголовок",
  "Бренд",
  "Категория",
  "Цена",
  "Валюта",
];

async function* fakeApi(products: Product[]) {
  for await (const product of products) {
    await delay(1000 + Math.random() * 2000);
    console.log("API отдал:", `${product.productId} - ${product.variantId}`);
    yield product;
  }
}

function getData(products: CustomProduct[]): Product[] {
  let productNew: Product[] = [];
  products.map((product) => {
    if (product.children?.length) {
      for (const child of product.children) {
        productNew.push({
          ...product,
          ...child,
        });
      }
    } else {
      productNew.push(product);
    }
  });
  return productNew;
}

// Функция для поиска бренда по ID
function findBrandById(brands: Brand[], brandId: number): Brand | undefined {
  return brands.find((brand) => brand.id === brandId);
}

// Функция для поиска категории по ID
function findCategoryById(
  categories: Category[],
  categoryId: number,
): Category | undefined {
  return categories.find((category) => category.id === categoryId);
}

// Функция для экранирования CSV значений
function escapeCsvValue(value: unknown): string {
  if (value === undefined || value === null) return "";

  const str = String(value);

  if (
    str.includes('"') ||
    str.includes(";") ||
    str.includes("\n") ||
    str.includes(",")
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

// Функция для создания CSV с использованием HandlebarsStreamWriter
async function createCsvWithHandlebars(
  products: Product[],
  brands: Brand[],
  categories: Category[],
  outputPath: string,
  customProperties?: string[],
) {
  const hsw = new HandlebarsStreamWriter();

  // Регистрируем хелпер для экранирования CSV значений
  hsw.registerHelper("escapeCsv", function (value: unknown) {
    if (value === undefined || value === null) return "";

    const str = String(value);

    if (
      str.includes('"') ||
      str.includes(";") ||
      str.includes("\n") ||
      str.includes(",")
    ) {
      return `"${str.replace(/"/g, '""')}"`;
    }

    return str;
  });

  // Создаем шаблон для заголовка CSV
  const headerTemplate =
    customProperties && customProperties.length > 0
      ? customProperties.join(";") + "\n"
      : "productId;variantId;title;brand;category;price;currency\n";

  hsw.setHeader(headerTemplate);

  // Создаем шаблон для строки данных с использованием хелпера экранирования
  hsw.setBody(
    `{{#if isFirstProduct}}{{else}};\n{{/if}}{{this.productId}};{{this.variantId}};{{escapeCsv this.title}};{{escapeCsv this.brandName}};{{escapeCsv this.categoryName}};{{this.price}};{{this.currency}}`,
  );

  // Создаем пустой футер
  hsw.setFooter("");

  // Создаем поток и подключаем к файлу
  const stream = hsw.createStream();
  const writeStream = fs.createWriteStream(outputPath);
  stream.pipe(writeStream);

  // Обрабатываем каждый продукт асинхронно
  for (const product of products) {
    // Находим бренд и категорию (используем vendorId вместо brandId)
    const brand = findBrandById(brands, product.vendorId || 0);
    const category = findCategoryById(categories, product.categoryId);

    // Подготавливаем данные для шаблона
    const templateData = {
      ...product,
      brandName: brand?.name || product.vendor || "",
      categoryName: category?.name || "",
    };

    // Асинхронно записываем данные
    await hsw.putData(templateData);
  }

  // Завершаем поток асинхронно
  await hsw.commit();

  // Ждем завершения записи
  await new Promise((resolve, reject) => {
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
  });
}

// Функция для создания JSON с использованием HandlebarsStreamWriter
async function createJsonWithHandlebars(
  products: Product[],
  brands: Brand[],
  categories: Category[],
  outputPath: string,
) {
  const hsw = new HandlebarsStreamWriter();

  // Создаем шаблон для заголовка JSON
  hsw.setHeader("[\n");

  // Создаем шаблон для объекта JSON
  hsw.setBody(
    `{{#if isFirstProduct}}{{else}},\n{{/if}}  {\n    "productId": "{{this.productId}}",\n    "variantId": "{{this.variantId}}",\n    "title": "{{escapeJson this.title}}",\n    "brand": "{{escapeJson this.brandName}}",\n    "category": "{{escapeJson this.categoryName}}",\n    "price": {{this.price}},\n    "currency": "{{this.currency}}"\n  }`,
  );

  // Создаем шаблон для футера JSON
  hsw.setFooter("\n]");

  // Регистрируем хелпер для экранирования JSON значений
  hsw.registerHelper("escapeJson", function (value: unknown) {
    if (value === undefined || value === null) return "";
    return JSON.stringify(String(value));
  });

  // Создаем поток и подключаем к файлу
  const stream = hsw.createStream();
  const writeStream = fs.createWriteStream(outputPath);
  stream.pipe(writeStream);

  // Обрабатываем каждый продукт асинхронно
  for (const product of products) {
    const brand = findBrandById(brands, product.vendorId || 0);
    const category = findCategoryById(categories, product.categoryId);

    const templateData = {
      ...product,
      brandName: brand?.name || product.vendor || "",
      categoryName: category?.name || "",
    };

    await hsw.putData(templateData);
  }

  // Завершаем поток асинхронно
  await hsw.commit();

  // Ждем завершения записи
  await new Promise((resolve, reject) => {
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
  });
}

// Функция для демонстрации ошибки валидации
async function demonstrateValidationError() {
  console.log("\n=== Демонстрация ошибки валидации ===");

  const hsw = new HandlebarsStreamWriter();

  try {
    // Пытаемся записать данные без создания потока
    await hsw.putData({ test: "data" });
  } catch (error) {
    console.log("✅ Поймали ошибку:", (error as Error).message);
  }

  try {
    // Пытаемся записать данные без шаблона тела
    hsw.createStream();
    await hsw.putData({ test: "data" });
  } catch (error) {
    console.log("✅ Поймали ошибку:", (error as Error).message);
  }

  try {
    // Пытаемся создать второй поток
    hsw.createStream();
  } catch (error) {
    console.log("✅ Поймали ошибку:", (error as Error).message);
  }
}

// Функция для демонстрации проблемы с JSON без footer
async function demonstrateJsonWithoutFooter() {
  console.log("\n=== Демонстрация проблемы JSON без footer ===");

  const hsw = new HandlebarsStreamWriter();

  hsw.setHeader("[\n");
  hsw.setBody('  { "data": "{{this.test}}" }');
  // НЕ устанавливаем footer

  const stream = hsw.createStream();
  const writeStream = fs.createWriteStream("invalid.json");
  stream.pipe(writeStream);

  await hsw.putData({ test: "value1" });
  await hsw.putData({ test: "value2" });

  try {
    // Пытаемся завершить без footer - должно выбросить ошибку
    await hsw.commit();
  } catch (error) {
    console.log("✅ Поймали ошибку валидации:", (error as Error).message);
    console.log("Это предотвращает создание некорректного JSON!");
  }
}

// Функция для создания CSV с использованием fakeApi (стриминг)
async function createCsvWithStreamingApi(
  products: Product[],
  brands: Brand[],
  categories: Category[],
  outputPath: string,
) {
  console.log(`\n=== Создание CSV с потоковыми данными (${outputPath}) ===`);

  const hsw = new HandlebarsStreamWriter();

  // Регистрируем хелпер для экранирования CSV значений
  hsw.registerHelper("escapeCsv", function (value: unknown) {
    if (value === undefined || value === null) return "";

    const str = String(value);

    if (
      str.includes('"') ||
      str.includes(";") ||
      str.includes("\n") ||
      str.includes(",")
    ) {
      return `"${str.replace(/"/g, '""')}"`;
    }

    return str;
  });

  // Создаем шаблоны
  hsw.setHeader("productId;variantId;title;brand;category;price;currency\n");
  hsw.setBody(
    `{{#if isFirstProduct}}{{else}};\n{{/if}}{{this.productId}};{{this.variantId}};{{escapeCsv this.title}};{{escapeCsv this.brandName}};{{escapeCsv this.categoryName}};{{this.price}};{{this.currency}}`,
  );
  hsw.setFooter("");

  // Создаем поток и подключаем к файлу
  const stream = hsw.createStream();
  const writeStream = fs.createWriteStream(outputPath);
  stream.pipe(writeStream);

  console.log("📡 Начинаем получать данные из API...");

  // Используем fakeApi для имитации медленного получения данных
  let processedCount = 0;
  for await (const product of fakeApi(products)) {
    // Находим бренд и категорию
    const brand = findBrandById(brands, product.vendorId || 0);
    const category = findCategoryById(categories, product.categoryId);

    // Подготавливаем данные для шаблона
    const templateData = {
      ...product,
      brandName: brand?.name || product.vendor || "",
      categoryName: category?.name || "",
    };

    // Асинхронно записываем данные (сразу в поток, без буферизации)
    await hsw.putData(templateData);
    processedCount++;

    console.log(`✅ Обработано продуктов: ${processedCount}`);
  }

  console.log("📝 Завершаем поток...");
  // Завершаем поток
  await hsw.commit();

  // Ждем завершения записи
  await new Promise((resolve, reject) => {
    writeStream.on("finish", () => {
      console.log(`🎉 Файл ${outputPath} успешно создан!`);
      resolve(true);
    });
    writeStream.on("error", reject);
  });
}

// Функция для тестирования производительности с большим количеством данных
async function testPerformanceWithLargeData() {
  console.log("\n=== Тест производительности с большим количеством данных ===");

  // Создаем большой массив тестовых данных
  const largeDataSet: Product[] = [];
  for (let i = 0; i < 1000; i++) {
    largeDataSet.push({
      productId: i,
      variantId: i,
      title: `Test Product ${i} with some long title to test performance`,
      description: `Description for test product ${i}`,
      vendorId: 1,
      vendor: "Test Vendor",
      categoryId: 1,
      price: 100 + i,
      currency: "USD" as any, // Приводим к типу Currency
      vat: "VAT_20" as any, // Приводим к типу Vat
    });
  }

  const brands = [{ id: 1, name: "Test Brand" }];
  const categories = [{ id: 1, name: "Test Category" }];

  const startTime = Date.now();

  const hsw = new HandlebarsStreamWriter();
  hsw.registerHelper("escapeCsv", function (value: unknown) {
    if (value === undefined || value === null) return "";
    const str = String(value);
    if (
      str.includes('"') ||
      str.includes(";") ||
      str.includes("\n") ||
      str.includes(",")
    ) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  });

  hsw.setHeader("productId;variantId;title;brand;category;price;currency\n");
  hsw.setBody(
    `{{#if isFirstProduct}}{{else}};\n{{/if}}{{this.productId}};{{this.variantId}};{{escapeCsv this.title}};{{escapeCsv this.brandName}};{{escapeCsv this.categoryName}};{{this.price}};{{this.currency}}`,
  );
  hsw.setFooter("");

  const stream = hsw.createStream();
  const writeStream = fs.createWriteStream("performance_test.csv");
  stream.pipe(writeStream);

  console.log("🚀 Начинаем обработку 1000 записей...");

  let processedCount = 0;
  const batchSize = 50; // Обрабатываем батчами для демонстрации

  for (let i = 0; i < largeDataSet.length; i += batchSize) {
    const batch = largeDataSet.slice(i, i + batchSize);

    // Обрабатываем батч
    for (const product of batch) {
      const templateData = {
        ...product,
        brandName: brands[0].name,
        categoryName: categories[0].name,
      };

      await hsw.putData(templateData);
      processedCount++;
    }

    console.log(
      `📊 Обработано: ${processedCount}/${largeDataSet.length} (${Math.round((processedCount / largeDataSet.length) * 100)}%)`,
    );

    // Небольшая пауза между батчами для имитации реальной нагрузки
    if (i + batchSize < largeDataSet.length) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  await hsw.commit();

  const endTime = Date.now();
  const duration = endTime - startTime;

  await new Promise((resolve, reject) => {
    writeStream.on("finish", () => {
      console.log(`🎉 Тест завершен за ${duration}ms`);
      console.log(
        `📈 Скорость: ${Math.round(largeDataSet.length / (duration / 1000))} записей/сек`,
      );
      console.log(
        `💾 Размер файла: ${require("fs").statSync("performance_test.csv").size} байт`,
      );
      resolve(true);
    });
    writeStream.on("error", reject);
  });
}

// Функция для создания JSON с использованием fakeApi (стриминг)
async function createJsonWithStreamingApi(
  products: Product[],
  brands: Brand[],
  categories: Category[],
  outputPath: string,
) {
  console.log(`\n=== Создание JSON с потоковыми данными (${outputPath}) ===`);

  const hsw = new HandlebarsStreamWriter();

  // Создаем шаблоны для JSON
  hsw.setHeader("[\n");
  hsw.setBody(
    `{{#if isFirstProduct}}{{else}},\n{{/if}}  {\n    "productId": "{{this.productId}}",\n    "variantId": "{{this.variantId}}",\n    "title": "{{escapeJson this.title}}",\n    "brand": "{{escapeJson this.brandName}}",\n    "category": "{{escapeJson this.categoryName}}",\n    "price": {{this.price}},\n    "currency": "{{this.currency}}"\n  }`,
  );
  hsw.setFooter("\n]");

  // Регистрируем хелпер для экранирования JSON значений
  hsw.registerHelper("escapeJson", function (value: unknown) {
    if (value === undefined || value === null) return '""';
    return JSON.stringify(String(value));
  });

  // Создаем поток и подключаем к файлу
  const stream = hsw.createStream();
  const writeStream = fs.createWriteStream(outputPath);
  stream.pipe(writeStream);

  console.log("📡 Начинаем получать данные из API для JSON...");

  // Используем fakeApi для имитации медленного получения данных
  let processedCount = 0;
  for await (const product of fakeApi(products)) {
    const brand = findBrandById(brands, product.vendorId || 0);
    const category = findCategoryById(categories, product.categoryId);

    const templateData = {
      ...product,
      brandName: brand?.name || product.vendor || "",
      categoryName: category?.name || "",
    };

    // Асинхронно записываем данные
    await hsw.putData(templateData);
    processedCount++;

    console.log(`✅ JSON: обработано продуктов: ${processedCount}`);
  }

  console.log("📝 Завершаем JSON поток...");
  // Завершаем поток
  await hsw.commit();

  // Ждем завершения записи
  await new Promise((resolve, reject) => {
    writeStream.on("finish", () => {
      console.log(`🎉 JSON файл ${outputPath} успешно создан!`);
      resolve(true);
    });
    writeStream.on("error", reject);
  });
}

const productsData = require("./poizon_10.json");

async function run() {
  const productDataNew = getData(productsData.products);

  // Демонстрируем проблемы валидации
  await demonstrateValidationError();
  await demonstrateJsonWithoutFooter();

  console.log("\n=== Создание CSV файлов ===");
  console.log("Создаем первый CSV файл...");
  await createCsvWithHandlebars(
    productDataNew,
    productsData.brands,
    productsData.categories,
    "out1_handlebars.csv",
  );

  console.log("Создаем второй CSV файл с кастомными свойствами...");
  await createCsvWithHandlebars(
    productDataNew,
    productsData.brands,
    productsData.categories,
    "out2_handlebars.csv",
    properties,
  );

  console.log("Создаем JSON файл...");
  await createJsonWithHandlebars(
    productDataNew,
    productsData.brands,
    productsData.categories,
    "output.json",
  );

  // Демонстрируем стриминг с медленными данными
  console.log("\n=== Демонстрация стриминга с медленными данными ===");
  await createCsvWithStreamingApi(
    productDataNew.slice(0, 5), // Берем только первые 5 для демонстрации
    productsData.brands,
    productsData.categories,
    "streaming_output.csv",
  );

  await createJsonWithStreamingApi(
    productDataNew.slice(0, 5), // Берем только первые 5 для демонстрации
    productsData.brands,
    productsData.categories,
    "streaming_output.json",
  );

  // Тестируем производительность с большим количеством данных
  await testPerformanceWithLargeData();

  console.log("Готово!");
}

run().catch(console.error);
