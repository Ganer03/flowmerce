export function buildRowTemplate(columns: string[]) {
  return columns
    .map((col) => {
      switch (col) {
        case "Внешний ID":
        case "Артикул":
          return `{{escape product.productId}}-{{escape product.variantId}}`;

        case "Ссылка на товар":
          return `{{escape product.url}}`;

        case "Название товара или услуги":
          return `{{escape product.title}}`;

        case "Время доставки: Минимальное":
          return `{{escape product.timeDelivery.min}}`;

        case "Время доставки: Максимальное":
          return `{{escape product.timeDelivery.max}}`;

        case "Старая цена":
          return `{{escape product.oldPrice}}`;

        case "Цена продажи":
          return `{{escape product.price}}`;

        case "Cебестоимость":
          return `{{escape product.purchasePrice}}`;

        case "Остаток":
          return `{{escape product.count}}`;

        case "Штрих-код":
          return `{{escape product.barcode}}`;

        case "Полное описание":
          return `{{escape product.description}}`;

        case "Габариты варианта":
          return `{{escape product.dimensions}}`;

        case "Вес":
          return `{{escape product.weight}}`;

        case "Размещение на сайте":
          return `{{escape product.available}}`;

        case "НДС":
          return `{{escape product.vat}}`;

        case "Валюта склада":
          return `{{escape product.currency}}`;

        case "Изображения варианта":
          return `{{escape (if (not product.parentId) (join product.images " "))}}`;

        case "Изображения":
          return `{{escape (if product.parentId (join product.images " "))}}`;

        case "Ссылка на видео":
          return `{{escape (lookup product.videos 0)}}`;

        case "Параметр: Артикул":
          return `{{escape product.vendorCode}}`;

        case "Параметр: Пол (Системный)":
          return `{{escape product.gender}}`;

        case "Параметр: Бренд (Системный)":
          return `{{escape product.vendor}}`;

        case "Параметр: Логотип бренда (Системный)":
          return `{{escape (brandLogo product)}}`;

        case "Параметр: Серия (Системный)":
          return `{{escape product.seriesName}}`;

        case "Параметр: Дата релиза (Системный)":
          return `{{escape product.saleDate}}`;

        case "Размерная сетка":
          return `{{escape (json product.sizes)}}`;

        case "Связанные товары":
          return `{{escape (join product.relatedProducts ",")}}`;

        case "Ключевые слова":
          return `{{escape (join product.keywords ",")}}`;

        default:
          if (col === "Корневая" || col.startsWith("Подкатегория")) {
            return `{{escape (category product "${col}")}}`;
          }

          if (col.startsWith("Параметр: ")) {
            const key = col.replace("Параметр: ", "");
            return `{{escape (property product "${key}")}}`;
          }

          if (col.startsWith("Свойство: ")) {
            const key = col.replace("Свойство: ", "");
            return `{{escape (param product "${key}")}}`;
          }

          return `""`;
      }
    })
    .join(";") + `\n`;
}