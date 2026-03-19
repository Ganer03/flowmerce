# @flowmerce/insales

InSales integration for Flowmerce packages - CSV formatter for InSales import.

## Installation

```bash
pnpm add @flowmerce/insales
# или
npm install @flowmerce/insales
```

## Usage

```typescript
import { convert } from '@flowmerce/core';
import { insalesFormatter } from '@flowmerce/insales';
import { createWriteStream } from 'fs';

// Создание форматировщика для InSales
const formatter = insalesFormatter({
  categories: categoryArray,
  brands: brandArray
});

// Конвертация продуктов в формат InSales
await convert({
  products: productArray,
  formatter,
  output: createWriteStream('insales-products.csv')
});
```

## API

### `insalesFormatter(options?: Options)`

Создает поток-трансформер для форматирования продуктов в CSV формат InSales.

**Parameters:**
- `options.categories?: Category[]` - массив категорий для маппинга
- `options.brands?: Brand[]` - массив брендов для маппинга

**Returns:** `Transform` stream

### Options

```typescript
interface Options {
  categories?: Category[];
  brands?: Brand[];
}
```

## Features

- Автоматическое экранирование специальных символов в CSV
- Поддержка категорий и брендов
- Фиксированные колонки для совместимости с InSales
- Обработка null/undefined значений

## CSV Format

Форматировщик создает CSV с колонками:
- id
- title
- description
- price
- category
- brand
- и другие поля, специфичные для InSales

## License

MIT