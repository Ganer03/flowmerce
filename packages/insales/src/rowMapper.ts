import { Product, Brand } from "@goods-converter/core";
import { getParams, getProperties } from "./paramsMapper";

export function createRowMapper(mappedBrands: Record<number, Brand>, getCategories: any) {
  return function mapProduct(product: Product) {
    const externalId = `${product.productId}-${product.variantId}`;

    return {
      "Внешний ID": externalId,
      "Ссылка на товар": product.url,
      Артикул: externalId,
      "Название товара или услуги": product.title,
      "Время доставки: Минимальное": product.timeDelivery?.min,
      "Время доставки: Максимальное": product.timeDelivery?.max,
      "Старая цена": product.oldPrice,
      "Цена продажи": product.price,
      Cебестоимость: product.purchasePrice,

      ...getCategories(product),

      Остаток: product.count,
      "Штрих-код": product.barcode,
      "Полное описание": product.description,
      "Габариты варианта": product.dimensions,
      Вес: product.weight,

      НДС: product.vat?.toString(),
      "Валюта склада": product.currency.toString(),

      "Ссылка на видео": product.videos?.[0],

      "Параметр: Пол (Системный)": product.gender,
      "Параметр: Бренд (Системный)": product.vendor,
      "Параметр: Логотип бренда (Системный)":
        product.vendorId === undefined
          ? undefined
          : mappedBrands[product.vendorId]?.logoUrl,

      "Параметр: Серия (Системный)": product.seriesName,
      "Параметр: Дата релиза (Системный)": product.saleDate,

      ...getParams(product),
      ...getProperties(product),

      "Размерная сетка": JSON.stringify(product.sizes),
      "Связанные товары": product.relatedProducts?.join(","),
      "Ключевые слова": product.keywords?.join(","),
    };
  };
}