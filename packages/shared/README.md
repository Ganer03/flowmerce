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
import { writeWithDrain } from '@flowmerce/shared';

// Запись в поток с обработкой backpressure
const writer = writeWithDrain(writableStream);
await writer('data chunk');
```

## API

### `writeWithDrain(stream: Writable)`

Создает функцию для безопасной записи в поток с обработкой backpressure.

**Parameters:**
- `stream` - writable поток

**Returns:** асинхронная функция для записи данных

## License

MIT