# @flowmerce/shared

Shared utilities for Flowmerce packages.

## Installation

```bash
pnpm add @flowmerce/shared
# или
npm install @flowmerce/shared
```

## Usage

```typescript
import { urlQueryEncode, writeWithDrain } from '@flowmerce/shared';

// Кодирование URL query параметров
const encodedUrl = urlQueryEncode('https://example.com?param1=value1,param2=value2');

// Запись в поток с обработкой backpressure
const writer = writeWithDrain(writableStream);
await writer('data chunk');
```

## API

### `urlQueryEncode(inputUrl: string): string`

Кодирует URL query параметры, заменяя запятые на `%2C`.

**Parameters:**
- `inputUrl` - исходный URL с query параметрами

**Returns:** строка с закодированным URL

### `writeWithDrain(stream: Writable)`

Создает функцию для безопасной записи в поток с обработкой backpressure.

**Parameters:**
- `stream` - writable поток

**Returns:** асинхронная функция для записи данных

## License

MIT