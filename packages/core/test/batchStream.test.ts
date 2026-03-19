import { describe, it, expect, vi } from 'vitest';
import { BatchStream } from '../src/batchStream';
import { Currency, Vat, Product } from '../src/types';

describe('BatchStream', () => {
  it('должен создаваться с правильными параметрами', () => {
    const batchSize = 5;
    const flushInterval = 1000;
    const stream = new BatchStream(batchSize, flushInterval);
    
    expect(stream).toBeDefined();
  });

  it('должен накапливать элементы до размера батча', async () => {
    const batchSize = 2;
    const stream = new BatchStream(batchSize, 1000);
    
    const products: Product[] = [
      {
        productId: 1,
        variantId: 1,
        title: 'Test Product 1',
        description: 'Description 1',
        categoryId: 1,
        price: 100,
        currency: Currency.RUB,
        vat: Vat.VAT_20
      },
      {
        productId: 2,
        variantId: 2,
        title: 'Test Product 2',
        description: 'Description 2',
        categoryId: 1,
        price: 200,
        currency: Currency.RUB,
        vat: Vat.VAT_20
      }
    ];

    const results: Product[][] = [];
    
    stream.on('data', (chunk: Product[]) => {
      results.push(chunk);
    });

    stream.on('end', () => {
      expect(results).toHaveLength(1);
      expect(results[0]).toHaveLength(2);
    });

    products.forEach(product => {
      stream.write(product);
    });

    stream.end();
  });
});