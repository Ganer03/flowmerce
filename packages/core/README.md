# @flowmerce/core

Core types and utilities for Flowmerce packages.

## Installation

```bash
pnpm add @flowmerce/core
# или
npm install @flowmerce/core
```

## Usage

```typescript
import { convert, Product, Category, Brand } from '@flowmerce/core';
import { CSVStream } from '@flowmerce/csv';

// Определение типов
interface Product {
  id: string;
  name: string;
  price: number;
  category: Category;
  brand: Brand;
  // ... другие поля
}

// Конвертация данных
const csvStream = new CSVStream({});
csvStream.setColumns(new Set(['id', 'name', 'price']));

await convert({
  products: productArray,
  formatter: csvStream,
  transformers: [
    // кастомные трансформеры
  ],
  batchSize: 10,
  flashInterval: 2000,
  output: process.stdout
});
```

## Streaming Data Processing

Flowmerce поддерживает обработку данных через генераторы и потоки, что позволяет работать с большими объемами данных без загрузки всего массива в память:

```typescript
import fs from 'fs';
import { convert, Product } from '@flowmerce/core';
import { insalesFormatter } from '@flowmerce/insales';

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
```

## API

### Types

- `Product` - тип для продукта
- `Category` - тип для категории
- `Brand` - тип для бренда
- `ConverterOptions` - опции для конвертера
- `Transformer` - тип для трансформера

### Functions

#### `convert(options: ConverterOptions)`

Основная функция для конвертации данных через потоки.

**Parameters:**
- `products` - массив продуктов для конвертации
- `formatter` - поток для форматирования вывода
- `transformers` - массив трансформеров (опционально)
- `batchSize` - размер батча (по умолчанию 10)
- `flashInterval` - интервал сброса в миллисекундах (по умолчанию 2000)
- `output` - поток вывода

### Classes

#### `BatchStream`

Класс для группировки данных в батчи.

#### `createTransformerStream`

Функция для создания потока-трансформера.

## License

MIT