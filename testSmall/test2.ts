import fs from "fs";
import { HandlebarsStreamWriter } from "@flowmerce/core";

function logMemory(label: string) {
    const used = process.memoryUsage()
    console.log(label, {
        rss: Math.round(used.rss / 1024 / 1024) + " MB",
        heapUsed: Math.round(used.heapUsed / 1024 / 1024) + " MB",
    })
}

function generateProducts(count: number) {
    const arr = []
    for (let i = 0; i < count; i++) {
        arr.push({
            productId: i,
            variantId: i,
            title: "Product " + i,
            vendorId: 1,
            categoryId: 1,
            price: i,
            currency: "USD",
        })
    }
    return arr
}

async function testWithArray() {
    console.log("\n=== ARRAY TEST ===")

    const products = generateProducts(1_000_000)

    logMemory("before")

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
            logMemory(`array step ${i}`)
        }

        await hsw.putData(p)
        i++
    }

    await hsw.commit()

    const end = Date.now()

    logMemory("after")

    console.log("time:", end - start, "ms")
}

async function* generateProductsStream(count: number) {
    for (let i = 0; i < count; i++) {
        yield {
            productId: i,
            variantId: i,
            title: "Product " + i,
            vendorId: 1,
            categoryId: 1,
            price: i,
            currency: "USD",
        }
    }
}

async function testWithStream() {
    console.log("\n=== STREAM TEST ===")

    logMemory("before")

    const start = Date.now()

    const hsw = new HandlebarsStreamWriter()
    hsw.setHeader("")
    hsw.setBody(`{{this.productId}}\n`)
    hsw.setFooter("")

    const stream = hsw.createStream()
    stream.pipe(fs.createWriteStream("stream.txt"))

    let i = 0
    for await (const p of generateProductsStream(1_000_000)) {
        if (i % 10000 === 0) {
            logMemory(`stream step ${i}`)
        }

        await hsw.putData(p)
        i++
    }

    await hsw.commit()

    const end = Date.now()

    logMemory("after")

    console.log("time:", end - start, "ms")
}

async function run() {
    await testWithArray()
    await testWithStream()
}

run().catch(console.error);