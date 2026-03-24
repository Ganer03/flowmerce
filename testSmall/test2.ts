import fs from "fs";
import { HandlebarsStreamWriter } from "@flowmerce/core";

function generateBigString(i: number) {
  return (i + "_").repeat(5 * 1024) // ~10KB уникальная строка
}

function formatMB(bytes: number) {
  return Math.round(bytes / 1024 / 1024)
}

function createMemoryTracker() {
  const start = process.memoryUsage()

  let peak = { ...start }

  function track() {
    const current = process.memoryUsage()

    for (const key of Object.keys(current) as (keyof typeof current)[]) {
      if (current[key] > peak[key]) {
        peak[key] = current[key]
      }
    }
  }

  function printFinal(label: string) {
    const end = process.memoryUsage()

    console.log(`\n=== ${label} MEMORY SUMMARY ===`)

    console.table({
      start: {
        rss: formatMB(start.rss),
        heapUsed: formatMB(start.heapUsed),
        heapTotal: formatMB(start.heapTotal),
        external: formatMB(start.external),
      },
      peak: {
        rss: formatMB(peak.rss),
        heapUsed: formatMB(peak.heapUsed),
        heapTotal: formatMB(peak.heapTotal),
        external: formatMB(peak.external),
      },
      end: {
        rss: formatMB(end.rss),
        heapUsed: formatMB(end.heapUsed),
        heapTotal: formatMB(end.heapTotal),
        external: formatMB(end.external),
      },
      diff: {
        rss: formatMB(end.rss - start.rss),
        heapUsed: formatMB(end.heapUsed - start.heapUsed),
        heapTotal: formatMB(end.heapTotal - start.heapTotal),
        external: formatMB(end.external - start.external),
      },
    })
  }

  return { track, printFinal }
}


function generateProducts(count: number) {
    const arr = []
    for (let i = 0; i < count; i++) {
        arr.push({
            "productId": 718165 + i,
            "variantId": 718165 + i,
            "url": "https://www.thepoizon.ru/product/8900049401587678" + i,
            "title": generateBigString(i),
            "description": i,
            "vendorCode": "3WD30301349" + i,
            "categoryId": 6573 + i,
            "vendorId": 168 + i,
            "images": [
                "https://cdn.poizon.com/pro-img/origin-img/20250320/397cdde90d2f4e7bab1ef156e4b1e69e.jpg" + i,
                "https://cdn.poizon.com/pro-img/origin-img/2025061613/60288da6932de420bf4b84144cde2fcb.jpg" + i,
                "https://cdn.poizon.com/pro-img/origin-img/20250320/eaff15743b9a465895400713a4e0d04b.jpg" + i,
                "https://cdn.poizon.com/pro-img/origin-img/20250320/5cf8a86617254c8aa02bbad789b9cff5.jpg" + i,
                "https://cdn.poizon.com/pro-img/origin-img/2025061613/1cdfb2e54643ca68ee80a315fc58ea22.jpg" + i
            ],
            "favoriteCount": i,
            "countryOfOrigin": "Китай" + i,
            "properties": [
                {
                    "key": "Верхняя высота",
                    "value": "Низкий вырез"
                },
                {
                    "key": "Стиль носка",
                    "value": "Круглая голова"
                },
                {
                    "key": "Применимый сезон",
                    "value": "Весна, лето, осень, зима"
                },
                {
                    "key": "Тип каблука",
                    "value": "Толстое дно"
                },
                {
                    "key": "Основной цвет",
                    "value": "Розовый"
                },
                {
                    "key": "Дата выхода",
                    "value": "2023.10"
                },
                {
                    "key": "Подбор цветов",
                    "value": "Розовый"
                },
                {
                    "key": "Цена предложения",
                    "value": "¥1628"
                },
                {
                    "key": "Основной номер товара",
                    "value": "3WD30301349"
                }
            ],
            "seriesName": "" + i,
            "relatedProducts": [],
            "gender": "Женщины" + i,
            "sizes": [],
            "vat": "NO_VAT" + i,
            "currency": "RUB" + i,
            "keywords": [],
            "vendor": "On" + i,
            price: i,
        })
    }
    return arr
}

async function testWithArray() {
    console.log("\n=== ARRAY TEST ===")
    
    const tracker = createMemoryTracker()

    const products = generateProducts(1_000_000)

    // logMemory("before")

    const start = Date.now()

    const result = []

    for (const p of products) {
        result.push(p)
    }

    const hsw = new HandlebarsStreamWriter()
    hsw.setHeader("")
    hsw.setBody(`{{this.productId}}\n`)
    hsw.setFooter("")

    const stream = hsw.createStream()
    stream.pipe(fs.createWriteStream("array.txt"))

    let i = 0
    for (const p of result) {
        if (i % 10000 === 0) {
            tracker.track()
        }

        await hsw.putData(p)
        i++
    }

    await hsw.commit()

    const end = Date.now()

  tracker.printFinal("ARRAY")

    console.log("time:", end - start, "ms")
}

function delay(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
}

async function* generateProductsStream(count: number) {
    for (let i = 0; i < count; i++) {
        // await delay(1) // убрать для временной проверки

        yield {
            "productId": 718165 + i,
            "variantId": 718165 + i,
            "url": "https://www.thepoizon.ru/product/8900049401587678" + i,
            "title": generateBigString(i),
            "description": i,
            "vendorCode": "3WD30301349" + i,
            "categoryId": 6573 + i,
            "vendorId": 168 + i,
            "images": [
                "https://cdn.poizon.com/pro-img/origin-img/20250320/397cdde90d2f4e7bab1ef156e4b1e69e.jpg" + i,
                "https://cdn.poizon.com/pro-img/origin-img/2025061613/60288da6932de420bf4b84144cde2fcb.jpg" + i,
                "https://cdn.poizon.com/pro-img/origin-img/20250320/eaff15743b9a465895400713a4e0d04b.jpg" + i,
                "https://cdn.poizon.com/pro-img/origin-img/20250320/5cf8a86617254c8aa02bbad789b9cff5.jpg" + i,
                "https://cdn.poizon.com/pro-img/origin-img/2025061613/1cdfb2e54643ca68ee80a315fc58ea22.jpg" + i
            ],
            "favoriteCount": i,
            "countryOfOrigin": "Китай" + i,
            "properties": [
                {
                    "key": "Верхняя высота",
                    "value": "Низкий вырез"
                },
                {
                    "key": "Стиль носка",
                    "value": "Круглая голова"
                },
                {
                    "key": "Применимый сезон",
                    "value": "Весна, лето, осень, зима"
                },
                {
                    "key": "Тип каблука",
                    "value": "Толстое дно"
                },
                {
                    "key": "Основной цвет",
                    "value": "Розовый"
                },
                {
                    "key": "Дата выхода",
                    "value": "2023.10"
                },
                {
                    "key": "Подбор цветов",
                    "value": "Розовый"
                },
                {
                    "key": "Цена предложения",
                    "value": "¥1628"
                },
                {
                    "key": "Основной номер товара",
                    "value": "3WD30301349"
                }
            ],
            "seriesName": "" + i,
            "relatedProducts": [],
            "gender": "Женщины" + i,
            "sizes": [],
            "vat": "NO_VAT" + i,
            "currency": "RUB" + i,
            "keywords": [],
            "vendor": "On" + i,
            price: i,
        };
    }
}

async function testWithStream() {
    console.log("\n=== STREAM TEST ===")

    const tracker = createMemoryTracker()

    const start = Date.now()

    const hsw = new HandlebarsStreamWriter()
    hsw.setHeader("")
    hsw.setBody(`{{this.productId}}\n`)
    hsw.setFooter("")

    const stream = hsw.createStream()
    stream.pipe(fs.createWriteStream("stream.txt"))

    let i = 0
    for await (const p of generateProductsStream(6_000_000)) {
        if (i % 10000 === 0) {
            tracker.track()
        }

        await hsw.putData(p)
        i++
    }

    await hsw.commit()

    const end = Date.now()

    tracker.printFinal("STREAM")

    console.log("time:", end - start, "ms")
}

async function run() {
    // await testWithArray()
    await testWithStream()
}

run().catch(console.error);