import fs from "fs";
import { insalesStreamWriter } from "@flowmerce/formats";
import { Brand, Category, Product } from "@flowmerce/formats/types";

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
// Заготовленные свойства которые необходимо вывести
const params = [
    "Цвет",
    "Размер",
    "Верхняя высота"
];
// Заготовленные параметры которые необходимо вывести
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

function getData(products: any[]): Product[] {
  const productNew: any[] = [];

  products.forEach((product) => {
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

// Обращение к апи
async function* fakeApi(products: Product[]) {
  for (const product of products) {
    await delay(100 + Math.random() * 100);

    console.log(
      "API отдал:",
      `${product.productId} - ${product.variantId}`
    );

    yield product;
  }
}

async function run() {
  const productsData = require("./poizon_10.json");
  const productDataNew: Product[] = getData(productsData.products);
  const catrgories: Category[] = productsData.categories;
  const brands: Brand[] = productsData.brands;

  const writer = insalesStreamWriter({
        categories: catrgories, //категории
        brands: brands, //бренды
        columns: { //доп данные для параметров и свойств
            properties: properties,
            params: params,
        }
  });

  // 👉 создаём stream
  const stream = writer.createStream();

  // 👉 пишем в файл
  const fileStream = fs.createWriteStream("out.csv");
  stream.pipe(fileStream);

  // 👉 стримим данные
  for await (const product of fakeApi(productDataNew)) {
    await writer.putData({
      product, // 👈 важно: шаблон ожидает product
    });
  }

  // 👉 закрываем поток
  await writer.commit();

  console.log("✅ Готово");
}

run();