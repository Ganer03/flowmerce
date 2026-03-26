# @flowmerce/formats

> Пакет для форматирования данных в формат, совместимый с интеграцией с платформой Insales.

## Основные возможности

- Генерация CSV-файлов для импорта в Insales
- Поддержка сложных структур: бренды, категории, товары с вариантами
- Гибкая настройка колонок: параметры и свойства
- Поддержка шаблонов через Handlebars
- Потоковая обработка данных для эффективного использования памяти

## Установка

```bash
pnpm add @flowmerce/formats
```

## Использование

### Основной пример

```ts
import { insalesStreamWriter } from "@flowmerce/formats";
import { Brand, Category, Product } from "@flowmerce/formats/types";

// Заготовленные параметры и свойства
const params = [
  "Цвет",
  "Размер",
  "Верхняя высота"
];

const properties = [
  "Верхняя высота",
  "Стиль носка",
  "Применимый сезон",
  "Тип каблука",
  "Основной цвет",
  "Дата выхода",
  "Подбор цветов",
  "Цена предложения",
  "Основной номер товара",
  "Применимые сценарии",
  "Функциональная",
  "Применимое место проведения",
  "Класс кроссовок для бега",
  "Общий вес обуви (приблизительно)",
  "Подошва",
  "Верхний",
  "Промежуточная подошва",
  "Верхний материал",
  "Закрытый режим",
  "Материал подошвы",
  "Дополнительный цвет",
  "Типы шипов",
  "Сорт обуви",
  "Применимая ширина стопы"
];

// Создание writer
const writer = insalesStreamWriter({
  categories: categories, // категории
  brands: brands, // бренды
  columns: { // дополнительные данные для параметров и свойств
    properties: properties,
    params: params,
  }
});

// Создание потока
const stream = writer.createStream();

// Запись в файл
const fileStream = fs.createWriteStream("out.csv");
stream.pipe(fileStream);

// Стримим данные
for await (const product of fakeApi(productDataNew)) {
  await writer.putData({
    product, // важно: шаблон ожидает product
  });
}

// Закрываем поток
await writer.commit();

console.log("✅ Готово");
```

### Подробное описание

#### Параметры (params)

Параметры — это характеристики товара, которые могут быть разными для разных вариантов. Они отображаются в колонках с префиксом `Параметр: `.

Примеры параметров:
- Цвет
- Размер
- Верхняя высота

#### Свойства (properties)

Свойства — это дополнительные характеристики товара, которые могут быть общими для всех вариантов. Они отображаются в колонках с префиксом `Свойство: `.

Примеры свойств:
- Верхняя высота
- Стиль носка
- Применимый сезон
- Тип каблука

#### Колонки

Колонки определяют структуру выходного CSV-файла. Основные колонки включают:

- `Внешний ID` — уникальный идентификатор товара
- `Ссылка на товар` — URL товара
- `Артикул` — артикул товара
- `Название товара или услуги` — название товара
- `Цена продажи` — цена продажи
- `Старая цена` — старая цена
- `Остаток` — количество товара на складе
- `Изображения варианта` — изображения товара
- `Параметры` — все параметры товара
- `Свойства` — все свойства товара
- `Размерная сетка` — размерная сетка
- `Связанные товары` — связанные товары
- `Ключевые слова` — ключевые слова

#### Типы данных

- `Product` — основной тип товара
- `Brand` — тип бренда
- `Category` — тип категории
- `IParam` — тип параметра
- `ISize` — тип размерной сетки

## Пример данных

```ts
const product: Product = {
  productId: 12345,
  variantId: 67890,
  title: "Ударная дрель Makita HP1630, 710 Вт",
  description: "В комплекте с детским микроскопом есть все, что нужно вашему ребенку для изучения микромира",
  vendor: "LEVENHUK",
  vendorCode: "VNDR-0005A",
  saleDate: "01.01.2000",
  vendorId: 1001,
  categoryId: 2002,
  countryOfOrigin: "Россия",
  images: [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  videos: [
    "https://example.com/video1.mp4"
  ],
  price: 240,
  oldPrice: 250,
  purchasePrice: 200,
  additionalExpenses: 75,
  cofinancePrice: 300,
  currency: "RUB",
  url: "http://best.seller.ru/product_page.asp?pid=12346",
  disabled: false,
  count: 7,
  available: true,
  timeDelivery: { min: 1, max: 3 },
  minQuantity: 1,
  stepQuantity: 1,
  barcode: "46012300000000",
  codesTN: ["8517610008"],
  age: { unit: "year", value: 6 },
  weight: 3.1,
  dimensions: "20.1/20.551/22.5",
  boxCount: 2,
  vat: "VAT_20",
  params: [
    { key: "Цвет", value: "Красный" },
    { key: "Размер", value: "M" }
  ],
  properties: [
    { key: "Верхняя высота", value: "15 см" },
    { key: "Стиль носка", value: "Открытый" }
  ],
  tags: ["apple", "до 500 рублей"],
  adult: false,
  downloadable: false,
  validityPeriod: "P1Y",
  validityComment: "Хранить в сухом помещении",
  serviceLifePeriod: "P2Y6M10D",
  serviceLifeComment: "Использовать при температуре не ниже −10 градусов",
  warrantyPeriod: "P1Y",
  warrantyComment: "Гарантия на аккумулятор — 6 месяцев",
  manufacturerWarranty: true,
  certificate: "6241421",
  keywords: ["Кроссовки", "высокая подошва"],
  sizes: [
    { name: "Размер", delimiter: ",", value: "36,37,38,39,40" }
  ],
  relatedProducts: [1234],
  seriesName: "Jordan 4",
  gender: "Женское",
  favoriteCount: 982134
};
```

## Поддержка

Если у вас есть вопросы или предложения по улучшению, пожалуйста, откройте issue в репозитории.

## Лицензия

MIT
