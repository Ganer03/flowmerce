import { describe, it, expect, vi } from 'vitest';
import { CSVStream } from '../src/CSVStream';

describe('CSVStream', () => {
  it('должен создавать экземпляр с настройками по умолчанию', () => {
    const csvStream = new CSVStream({});
    expect(csvStream).toBeDefined();
    expect(csvStream.writableStream).toBeDefined();
  });

  it('должен создавать экземпляр с пользовательскими настройками', () => {
    const csvStream = new CSVStream({
      delimiter: ',',
      lineSeparator: '\r\n',
      emptyFieldValue: 'N/A'
    });
    expect(csvStream).toBeDefined();
  });

  it('должен устанавливать колонки и записывать заголовок', async () => {
    const csvStream = new CSVStream({});
    const columns = new Set(['name', 'age', 'city']);
    
    const results: string[] = [];
    csvStream.writableStream.on('data', (chunk) => {
      results.push(chunk.toString());
    });

    csvStream.setColumns(columns);

    expect(results).toEqual(['name;age;city\n']);
  });

  it('должен добавлять строки данных', async () => {
    const csvStream = new CSVStream({});
    const columns = new Set(['name', 'age', 'city']);
    
    const results: string[] = [];
    csvStream.writableStream.on('data', (chunk) => {
      results.push(chunk.toString());
    });

    csvStream.setColumns(columns);
    await csvStream.addRow({ name: 'John', age: '30', city: 'Moscow' });

    expect(results).toEqual(['name;age;city\n', 'John;30;Moscow\n']);
  });

  it('должен обрабатывать пустые значения', async () => {
    const csvStream = new CSVStream({});
    const columns = new Set(['name', 'age', 'city']);
    
    const results: string[] = [];
    csvStream.writableStream.on('data', (chunk) => {
      results.push(chunk.toString());
    });

    csvStream.setColumns(columns);
    await csvStream.addRow({ name: 'John', age: undefined, city: 'Moscow' });

    expect(results).toEqual(['name;age;city\n', 'John;;Moscow\n']);
  });

  it('должен использовать пользовательское значение для пустых полей', async () => {
    const csvStream = new CSVStream({ emptyFieldValue: 'N/A' });
    const columns = new Set(['name', 'age', 'city']);
    
    const results: string[] = [];
    csvStream.writableStream.on('data', (chunk) => {
      results.push(chunk.toString());
    });

    csvStream.setColumns(columns);
    await csvStream.addRow({ name: 'John', age: undefined, city: 'Moscow' });

    expect(results).toEqual(['name;age;city\n', 'John;N/A;Moscow\n']);
  });

  it('должен использовать пользовательский разделитель', async () => {
    const csvStream = new CSVStream({ delimiter: ',' });
    const columns = new Set(['name', 'age', 'city']);
    
    const results: string[] = [];
    csvStream.writableStream.on('data', (chunk) => {
      results.push(chunk.toString());
    });

    csvStream.setColumns(columns);
    await csvStream.addRow({ name: 'John', age: '30', city: 'Moscow' });

    expect(results).toEqual(['name,age,city\n', 'John,30,Moscow\n']);
  });

  it('должен использовать пользовательский разделитель строк', async () => {
    const csvStream = new CSVStream({ lineSeparator: '\r\n' });
    const columns = new Set(['name', 'age']);
    
    const results: string[] = [];
    csvStream.writableStream.on('data', (chunk) => {
      results.push(chunk.toString());
    });

    csvStream.setColumns(columns);
    await csvStream.addRow({ name: 'John', age: '30' });

    expect(results).toEqual(['name;age\r\n', 'John;30\r\n']);
  });

  it('должен обрабатывать несколько строк', async () => {
    const csvStream = new CSVStream({});
    const columns = new Set(['name', 'age']);
    
    const results: string[] = [];
    csvStream.writableStream.on('data', (chunk) => {
      results.push(chunk.toString());
    });

    csvStream.setColumns(columns);
    await csvStream.addRow({ name: 'John', age: '30' });
    await csvStream.addRow({ name: 'Jane', age: '25' });

    expect(results).toEqual([
      'name;age\n',
      'John;30\n',
      'Jane;25\n'
    ]);
  });
});