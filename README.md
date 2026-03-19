# Flowmerce

[![npm version](https://img.shields.io/npm/v/@flowmerce/core)](https://www.npmjs.com/package/@flowmerce/core)
![npm](https://img.shields.io/npm/dm/@flowmerce/core)
![GitHub issues](https://img.shields.io/github/issues/flowmerce/flowmerce)
[![License](https://img.shields.io/badge/license-MIT-green)](https://github.com/flowmerce/flowmerce/blob/main/LICENSE)

A modular JavaScript/TypeScript library for data transformation and export. Built with streams for high performance and memory efficiency.

## Features

- **Stream-based processing** for handling large datasets efficiently
- **Modular architecture** with separate packages for different use cases
- **TypeScript support** with comprehensive type definitions
- **Memory efficient** batch processing
- **Extensible** with custom transformers and formatters

## Packages

### Core
- [`@flowmerce/core`](packages/core/README.md) - Core types and utilities
- [`@flowmerce/csv`](packages/csv/README.md) - CSV stream writer
- [`@flowmerce/insales`](packages/insales/README.md) - InSales integration
- [`@flowmerce/shared`](packages/shared/README.md) - Shared utilities

## Installation

Install individual packages:

```bash
# Core functionality
pnpm add @flowmerce/core

# CSV export
pnpm add @flowmerce/csv

# InSales integration
pnpm add @flowmerce/insales

# Shared utilities
pnpm add @flowmerce/shared
```

Or install all packages:

```bash
pnpm add @flowmerce/core @flowmerce/csv @flowmerce/insales @flowmerce/shared
```

## Quick Start

```typescript
import { convert } from '@flowmerce/core';
import { CSVStream } from '@flowmerce/csv';

// Create CSV stream
const csvStream = new CSVStream({});
csvStream.setColumns(new Set(['id', 'name', 'price']));

// Convert products to CSV
await convert({
  products: productArray,
  formatter: csvStream,
  output: process.stdout
});
```

## Streaming Data Processing

Flowmerce поддерживает обработку данных через генераторы и потоки, что позволяет работать с большими объемами данных без загрузки всего массива в память:

```typescript
import fs from 'fs';
import { convert, Product } from "@flowmerce/core";
import { insalesFormatter } from "@flowmerce/insales";

// Имитация API с задержками
function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function* fakeApi(products: Product[]) {
  for (const product of products) {
    await delay(1000 + Math.random() * 2000); // Имитация сетевых задержек
    console.log("API отдал:", product.productId);
    yield product;
  }
}

async function run() {
  const productsData = require("./product.json");
  const output = fs.createWriteStream("output.csv");
  
  await convert({
    products: fakeApi(productsData), // Генератор вместо массива
    formatter: insalesFormatter(),
    batchSize: 2, // Обработка по 2 продукта за раз
    output,
  });
  
  console.log("Готово");
}

run();
```

**Преимущества потоковой обработки:**
- **Экономия памяти** - данные обрабатываются по частям
- **Реальное время** - обработка начинается сразу при получении данных
- **Масштабируемость** - работа с миллионами записей
- **Отзывчивость** - прогресс виден в реальном времени

## InSales Integration

```typescript
import { convert } from '@flowmerce/core';
import { insalesFormatter } from '@flowmerce/insales';
import { createWriteStream } from 'fs';

// Convert products to InSales format
await convert({
  products: productArray,
  formatter: insalesFormatter({
    categories: categoryArray,
    brands: brandArray
  }),
  output: createWriteStream('insales-products.csv')
});
```

## Development

This is a monorepo managed with pnpm workspaces.

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm run build

# Run tests
pnpm run test

# Run tests for specific package
pnpm --filter @flowmerce/csv run test
```

## Architecture

Flowmerce uses a stream-based architecture for data processing:

1. **Input**: Product data streams
2. **Batch Processing**: Groups data into batches for efficiency
3. **Transformers**: Apply transformations to the data
4. **Formatter**: Convert data to target format (CSV, InSales, etc.)
5. **Output**: Write to destination (file, stdout, etc.)

## License

MIT
