# @flowmerce/core

Core types and utilities for Flowmerce packages.

## Installation

```bash
pnpm add @flowmerce/core
# или
npm install @flowmerce/core
```

## Usage

### HandlebarsStreamWriter

`HandlebarsStreamWriter` - это класс для потоковой записи данных с использованием шаблонов Handlebars. Он позволяет эффективно работать с большими объемами данных, не загружая их полностью в память.

**Особенности:**
- ✅ **Асинхронная запись** - предотвращает блокировку event loop
- ✅ **Backpressure поддержка** - автоматически управляет потоком данных
- ✅ **Валидация состояния** - предотвращает создание некорректных файлов (JSON без закрывающих скобок)
- ✅ **Стриминг** - данные записываются по мере поступления

```typescript
import { HandlebarsStreamWriter } from '@flowmerce/core';
import fs from 'fs';

// Создаем экземпляр writer с валидацией (по умолчанию включена)
const hsw = new HandlebarsStreamWriter();

// Устанавливаем шаблоны
hsw.setHeader("[\n");
hsw.setBody('{{#if isFirstProduct}}{{else}},\n{{/if}}  {"id": {{this.id}}, "name": "{{this.name}}"}');
hsw.setFooter("\n]");

// Регистрируем хелпер для экранирования
hsw.registerHelper('escapeJson', (value: unknown) => {
  if (value === undefined || value === null) return '""';
  return JSON.stringify(String(value));
});

// Создаем поток
const stream = hsw.createStream();

// Направляем поток в файл
stream.pipe(fs.createWriteStream('output.json'));

// Асинхронно записываем данные
await hsw.putData({ id: 1, name: "Item 1" });
await hsw.putData({ id: 2, name: "Item 2" });

// Завершаем запись (запишет футер)
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

  // Имитация медленного API
  for (const product of await fetchProductsFromApi()) {
    await hsw.putData(product); // Записываем сразу в поток
  }

  await hsw.commit();
}
```

### Потоковая обработка продуктов

```typescript
import { HandlebarsStreamWriter } from '@flowmerce/core';
import fs from 'fs';

async function parseProducts() {
  const hsw = new HandlebarsStreamWriter();
  
  // Настраиваем шаблоны для YML формата
  hsw.setHeader('<?xml version="1.0" encoding="UTF-8"?>\n<yml_catalog date="{{date}}">\n<shop>\n<categories>\n{{#each categories}}\n<category id="{{id}}">{{name}}</category>\n{{/each}}\n</categories>\n<offers>\n');
  
  hsw.setBody('<offer id="{{productId}}" available="{{available}}">\n<url>{{url}}</url>\n<price>{{price}}</price>\n<currencyId>{{currency}}</currencyId>\n<categoryId>{{categoryId}}</categoryId>\n<name>{{title}}</name>\n<description>{{description}}</description>\n{{#if vendor}}<vendor>{{vendor}}</vendor>{{/if}}\n</offer>\n');
  
  hsw.setFooter('</offers>\n</shop>\n</yml_catalog>');
  
  // Создаем поток
  const stream = hsw.createStream({
    date: new Date().toISOString().split('T')[0],
    categories: [
      { id: 1, name: "Электроника" },
      { id: 2, name: "Одежда" }
    ]
  });
  
  // Направляем в файл
  stream.pipe(fs.createWriteStream('products.yml'));
  
  // Имитация получения данных из API
  for (const product of await fetchProductsFromAPI()) {
    hsw.putData(product);
  }
  
  // Завершаем
  hsw.commit();
}

parseProducts();
```

## License

MIT