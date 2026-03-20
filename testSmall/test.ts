import fs from 'fs';
import { convert, Product } from "@flowmerce/core";
import { insalesFormatter } from "@flowmerce/insales";
type CustomProduct = Product & {
    children: Product[];
};
function delay(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
}

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

async function* fakeApi(products: Product[]) {
    for await (const product of products) {
        await delay(100 + Math.random() * 200);
        console.log("API отдал:", `${product.productId} - ${product.variantId}`);
        yield product;
    }
}

function getData(products: CustomProduct[]): Product[] {
    let productNew: Product[] = [];
    products.map((product) => {
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

const productsData = require("./poizon_10.json");

async function run() {
    const output = fs.createWriteStream("out1.csv");

    const productDataNew = getData(productsData.products);

    await convert({
        products: fakeApi(productDataNew),
        formatter: insalesFormatter({
            categories: productsData.categories,
            brands: productsData.brands
        }),
        batchSize: 2,
        output,
    });

    const outputSecond = fs.createWriteStream("out2.csv");

    await convert({
        products: productDataNew,
        formatter: insalesFormatter({
            categories: productsData.categories,
            brands: productsData.brands,
            columns: {
                properties: properties,
            }
        }),
        batchSize: 5,
        output: outputSecond,
    });

    console.log("Готово");
}

run();