# Flowmerce

[![npm version](https://img.shields.io/npm/v/@flowmerce/core)](https://www.npmjs.com/package/@flowmerce/core)
![npm](https://img.shields.io/npm/dm/@flowmerce/core)
![GitHub issues](https://img.shields.io/github/issues/Ganer03/flowmerce)
[![License](https://img.shields.io/badge/license-MIT-green)](https://github.com/Ganer03/flowmerce/blob/main/LICENSE)

## Пакеты

- [`@flowmerce/core`](packages/core/README.md) - Ядро с шаблонизатором для реализации кастомных решений
- [`@flowmerce/formats`](packages/csv/README.md) - Пакет с заготовленными форматами под разные CMS
- [`@flowmerce/shared`](packages/shared/README.md) - Утилитные функции, которые используются в других пакетах

## Установка

Установка индвидуальных пакетов:

```bash
# Core functionality
pnpm add @flowmerce/core

# Formats stream
pnpm add @flowmerce/formats

# Shared utilities
pnpm add @flowmerce/shared
```

Или все пакеты одновременно:

```bash
pnpm add @flowmerce/core @flowmerce/formats @flowmerce/shared
```

## Пакеты и их функциональность

### `@flowmerce/core`

**Назначение:** Ядро библиотеки для потоковой обработки данных с использованием шаблонов Handlebars.

**Основные возможности:**
- Асинхронная запись данных с поддержкой backpressure
- Валидация состояния для предотвращения создания некорректных файлов
- Поддержка различных форматов: JSON, CSV, YML
- Гибкая настройка шаблонов через Handlebars
- Потоковая обработка больших объемов данных без загрузки в память

**Пример использования:**
```typescript
import { HandlebarsStreamWriter } from '@flowmerce/core';
import fs from 'fs';

const hsw = new HandlebarsStreamWriter();
hsw.setHeader("[");
hsw.setBody('{{#if isFirstProduct}}{{else}},\n{{/if}}  {\"id\": {{this.id}}, \"name\": \"{{this.name}}\"}');
hsw.setFooter("\n]");

const stream = hsw.createStream();
stream.pipe(fs.createWriteStream('output.json'));

await hsw.putData({ id: 1, name: "Item 1" });
await hsw.putData({ id: 2, name: "Item 2" });

await hsw.commit();
```

### Создание CSV с потоковыми данными

```typescript
import { HandlebarsStreamWriter } from '@flowmerce/core';
import fs from 'fs';

async function createCsvFromApi() {
  const hsw = new HandlebarsStreamWriter();
  
  // Настраиваем CSV шаблоны
  hsw.setHeader("id;name;price;currency\n");
  hsw.setBody('{{#if isFirstProduct}}{{else}};\n{{/if}}{{this.id}};{{this.name}};{{this.price}};{{this.currency}}');
  hsw.setFooter("");
  
  // Регистрируем хелпер для экранирования CSV
  hsw.registerHelper("escapeCsv", function (value: unknown) {
    if (value === undefined || value === null) return "";
    const str = String(value);
    if (str.includes('"') || str.includes(";") || str.includes("\n") || str.includes(",")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  });

  const stream = hsw.createStream();
  stream.pipe(fs.createWriteStream('products.csv'));

  // через вызов API
  for (const product of await fetchProductsFromApi()) {
    await hsw.putData(product); // Записываем сразу в поток
  }

  await hsw.commit();
}
```

---

### `@flowmerce/formats`

**Назначение:** Пакет для форматирования данных в формат, совместимый с интеграцией с платформой Insales.

**Основные возможности:**
- Генерация CSV-файлов для импорта в Insales
- Поддержка сложных структур: бренды, категории, товары с вариантами
- Гибкая настройка колонок: параметры и свойства
- Поддержка шаблонов через Handlebars
- Потоковая обработка данных для эффективного использования памяти

**Пример использования:**
```typescript
import { insalesStreamWriter } from "@flowmerce/formats";
import { Brand, Category, Product } from "@flowmerce/formats/types";

const params = ["Цвет", "Размер", "Верхняя высота"];
const properties = ["Верхняя высота", "Стиль носка", "Применимый сезон", "Тип каблука"];

const writer = insalesStreamWriter({
  categories: categories,
  brands: brands,
  columns: {
    properties: properties,
    params: params
  }
});

const stream = writer.createStream();
const fileStream = fs.createWriteStream("out.csv");
stream.pipe(fileStream);

for await (const product of fakeApi(productDataNew)) {
  await writer.putData({ product });
}

await writer.commit();
console.log("✅ Готово");
```

---

### `@flowmerce/shared`

**Назначение:** Общие утилиты для пакетов Flowmerce.

**Основные возможности:**
- Функция `writeWithDrain` для безопасной записи в поток с обработкой backpressure
- Универсальные вспомогательные функции для работы с потоками
- Поддержка различных типов данных

**Пример использования:**
```typescript
import { writeWithDrain } from '@flowmerce/shared';

const writer = writeWithDrain(writableStream);
await writer('data chunk');
```

---

## Общая архитектура

Flowmerce использует потоковую архитектуру для обработки данных:

1. **Входные данные:** Потоки с данными о продуктах
2. **Пакетная обработка:** Группировка данных в пакеты для эффективности
3. **Трансформеры:** Применение преобразований к данным
4. **Форматтеры:** Преобразование данных в целевой формат (CSV, Insales и т.д.)
5. **Выходные данные:** Запись в целевое место (файл, stdout и т.д.)

## Лицензия

MIT