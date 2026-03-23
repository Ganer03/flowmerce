import { describe, it, expect, vi } from "vitest";
import { PassThrough } from "stream";
import { HandlebarsStreamWriter } from "../src/HandlebarsStreamWriter";

describe("HandlebarsStreamWriter", () => {
  it("должен создавать поток с заголовком", () => {
    const writer = new HandlebarsStreamWriter();
    writer.setHeader("{ categories: [{{#each categories }}...{{/each}}], goods: [");
    
    const stream = writer.createStream({
      categories: [{ id: 1, name: "Category 1" }]
    });
    
    expect(stream).toBeInstanceOf(PassThrough);
  });

  it("должен асинхронно записывать данные в поток", async () => {
    const writer = new HandlebarsStreamWriter();
    writer.setHeader("{ categories: [], goods: [");
    writer.setBody('{"cnyPrice": {{this.price}},"title": "{{this.title}}"}');
    
    const stream = writer.createStream({ categories: [] });
    
    // Создаем массив для сбора данных из потока
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    
    await writer.putData({ price: 100, title: "Test Product" });
    
    // Даем время на обработку события data
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Проверяем, что данные были записаны
    expect(chunks.length).toBeGreaterThan(0);
    const result = Buffer.concat(chunks).toString();
    expect(result).toContain('{"cnyPrice": 100,"title": "Test Product"}');
  });

  it("должен асинхронно завершать поток с футером", async () => {
    const writer = new HandlebarsStreamWriter();
    writer.setHeader("{ categories: [], goods: [");
    writer.setBody('{"cnyPrice": {{this.price}},"title": "{{this.title}}"}');
    writer.setFooter("]}");
    
    const stream = writer.createStream({ categories: [] });
    
    // Создаем массив для сбора данных из потока
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    
    await writer.putData({ price: 100, title: "Test Product" });
    await writer.commit();
    
    // Проверяем, что футер был добавлен
    const result = Buffer.concat(chunks).toString();
    expect(result).toContain('{"cnyPrice": 100,"title": "Test Product"}');
    expect(result).toContain("]}");
  });

  it("должен регистрировать и использовать хелперы", async () => {
    const writer = new HandlebarsStreamWriter();
    writer.setHeader("{ categories: [], goods: [");
    writer.setBody('{"cnyPrice": {{this.price}},"title": "{{deleteChineese this.title}}"}');
    writer.setFooter("]}");
    
    // Регистрируем хелпер
    writer.registerHelper('deleteChineese', (str: string) => {
      return str.replace(/[\u4e00-\u9fff]/g, '');
    });
    
    const stream = writer.createStream({ categories: [] });
    
    // Создаем массив для сбора данных из потока
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    
    await writer.putData({ price: 100, title: "Test中文Product" });
    await writer.commit();
    
    // Проверяем, что хелпер сработал
    const result = Buffer.concat(chunks).toString();
    expect(result).toContain('{"cnyPrice": 100,"title": "TestProduct"}');
  });

  it("должен обрабатывать isFirstProduct флаг", async () => {
    const writer = new HandlebarsStreamWriter();
    writer.setHeader("{ categories: [], goods: [");
    writer.setBody('{{#if isFirstProduct}}{{this.title}}{{else}},{{this.title}}{{/if}}');
    writer.setFooter("]}");
    
    const stream = writer.createStream({ categories: [] });
    
    // Создаем массив для сбора данных из потока
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    
    await writer.putData({ title: "Product1" });
    await writer.putData({ title: "Product2" });
    await writer.commit();
    
    // Проверяем, что флаг isFirstProduct работает
    const result = Buffer.concat(chunks).toString();
    expect(result).toContain("Product1,Product2");
  });

  it("должен выбрасывать ошибку при асинхронном вызове putData без createStream", async () => {
    const writer = new HandlebarsStreamWriter();
    writer.setBody('{"title": "{{this.title}}"}');
    
    await expect(writer.putData({ title: "Test" }))
      .rejects.toThrow("Stream не создан. Сначала вызовите createStream()");
  });

  it("должен выбрасывать ошибку при асинхронном вызове putData без setBody", async () => {
    const writer = new HandlebarsStreamWriter();
    writer.setHeader("header\n"); // Устанавливаем заголовок для создания потока
    writer.createStream();
    
    await expect(writer.putData({ title: "Test" }))
      .rejects.toThrow("Шаблон тела не установлен. Сначала вызовите setBody()");
  });

  it("должен выбрасывать ошибку при асинхронном вызове commit без createStream", async () => {
    const writer = new HandlebarsStreamWriter();
    
    await expect(writer.commit())
      .rejects.toThrow("Stream не создан. Сначала вызовите createStream()");
  });

  it("должен валидировать состояние и предотвращать запись после commit", async () => {
    const writer = new HandlebarsStreamWriter();
    writer.setHeader("header\n");
    writer.setBody("data\n");
    writer.setFooter("footer\n");
    
    const stream = writer.createStream();
    await writer.putData({ test: "value1" });
    await writer.commit();
    
    // Попытка записать данные после commit должна вызвать ошибку
    await expect(writer.putData({ test: "value2" }))
      .rejects.toThrow("Stream уже завершен. Нельзя записывать данные после commit()");
  });

  it("должен предотвращать создание второго потока", () => {
    const writer = new HandlebarsStreamWriter();
    writer.setHeader("header\n");
    writer.createStream();
    
    expect(() => writer.createStream())
      .toThrow("Stream уже создан. Используйте один экземпляр для одного потока.");
  });

  it("должен создавать корректный JSON с валидацией footer", async () => {
    const writer = new HandlebarsStreamWriter();
    writer.setHeader("[\n");
    writer.setBody('{{#if isFirstProduct}}{{else}},\n{{/if}}  {"id": {{this.id}}, "name": "{{this.name}}"}');
    writer.setFooter("\n]");
    
    const stream = writer.createStream();
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    
    await writer.putData({ id: 1, name: "Item1" });
    await writer.putData({ id: 2, name: "Item2" });
    await writer.commit();
    
    const result = Buffer.concat(chunks).toString();
    
    // Проверяем корректность JSON
    expect(result).toContain('[\n');
    expect(result).toContain('  {"id": 1, "name": "Item1"}');
    expect(result).toContain(',\n  {"id": 2, "name": "Item2"}');
    expect(result).toContain('\n]');
    
    // Проверяем, что JSON валидный
    const json = JSON.parse(result);
    expect(json).toHaveLength(2);
    expect(json[0]).toEqual({ id: 1, name: "Item1" });
    expect(json[1]).toEqual({ id: 2, name: "Item2" });
  });

  it("должен выбрасывать ошибку при попытке завершить JSON без footer", async () => {
    const writer = new HandlebarsStreamWriter();
    writer.setHeader("[\n");
    writer.setBody('  {"data": "{{this.test}}" }');
    // НЕ устанавливаем footer
    
    const stream = writer.createStream();
    await writer.putData({ test: "value1" });
    
    // Попытка завершить JSON без footer должна вызвать ошибку валидации
    await expect(writer.commit())
      .rejects.toThrow("Шаблон футера не установлен. Для корректного JSON вызовите setFooter()");
  });

  it("должен поддерживать стриминг с backpressure", async () => {
    const writer = new HandlebarsStreamWriter();
    writer.setHeader("data:\n");
    writer.setBody("{{this.value}}\n");
    writer.setFooter("end\n");
    
    const stream = writer.createStream();
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    
    // Записываем много данных для проверки backpressure
    for (let i = 0; i < 100; i++) {
      await writer.putData({ value: `item-${i}` });
    }
    
    await writer.commit();
    
    const result = Buffer.concat(chunks).toString();
    expect(result).toContain("data:\n");
    expect(result).toContain("item-0\n");
    expect(result).toContain("item-99\n");
    expect(result).toContain("end\n");
  });

  it("должен предоставлять информацию о состоянии", async () => {
    const writer = new HandlebarsStreamWriter();
    
    expect(writer.hasHeaderWritten).toBe(false);
    expect(writer.hasFooterWritten).toBe(false);
    expect(writer.isFinished).toBe(false);
    
    writer.setHeader("header\n");
    writer.setBody("data\n");
    writer.setFooter("footer\n");
    
    const stream = writer.createStream();
    
    expect(writer.hasHeaderWritten).toBe(true);
    expect(writer.hasFooterWritten).toBe(false);
    expect(writer.isFinished).toBe(false);
    
    await writer.putData({ test: "value" });
    await writer.commit();
    
    expect(writer.hasHeaderWritten).toBe(true);
    expect(writer.hasFooterWritten).toBe(true);
    expect(writer.isFinished).toBe(true);
  });
});