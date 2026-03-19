# @flowmerce/csv

CSV stream writer for Flowmerce packages.

## Installation

```bash
pnpm add @flowmerce/csv
# или
npm install @flowmerce/csv
```

## Usage

```typescript
import { CSVStream } from '@flowmerce/csv';

// Создание экземпляра с настройками по умолчанию
const csvStream = new CSVStream({});

// Создание с пользовательскими настройками
const csvStream = new CSVStream({
  delimiter: ',',           // разделитель полей (по умолчанию ';')
  lineSeparator: '\r\n',    // разделитель строк (по умолчанию '\n')
  emptyFieldValue: 'N/A'    // значение для пустых полей (по умолчанию '')
});

// Установка колонок
csvStream.setColumns(new Set(['name', 'age', 'city']));

// Добавление строк данных
await csvStream.addRow({ name: 'John', age: '30', city: 'Moscow' });
await csvStream.addRow({ name: 'Jane', age: '25', city: 'London' });

// Подписка на данные потока
csvStream.writableStream.on('data', (chunk) => {
  console.log(chunk.toString());
});
```

## API

### CSVStreamOptions

- `delimiter?: string` - разделитель полей (по умолчанию ';')
- `lineSeparator?: string` - разделитель строк (по умолчанию '\n')
- `emptyFieldValue?: string` - значение для пустых полей (по умолчанию '')

### Methods

#### `setColumns(columns: Set<string>)`

Устанавливает колонки и записывает заголовок CSV.

#### `async addRow(items: Record<string, any>)`

Добавляет строку данных в CSV.

### Properties

#### `writableStream: PassThrough`

Доступ к underlying потоку для подписки на данные.

## License

MIT