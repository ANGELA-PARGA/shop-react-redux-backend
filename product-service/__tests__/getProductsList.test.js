import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { products } from '../src/data/products.js';

import * as dbMocks from './__mocks__/db.js';

jest.unstable_mockModule('../src/utils/db.js', () => dbMocks);

const { getProductsList } = await import('../src/functions/getProductsList/handler.js');

describe('getProductsList Lambda Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    const mockProducts = products.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      price: p.price
    }));
    
    const mockStocks = products.map(p => ({ 
      product_id: p.id, 
      count: 10
    }));
    
    const productsWithStock = products.map(p => ({
      ...p,
      count: 10
    }));
    
    dbMocks.getAllProducts.mockResolvedValue(mockProducts);
    dbMocks.getAllStocks.mockResolvedValue(mockStocks);
    dbMocks.joinProductsWithStocks.mockReturnValue(productsWithStock); 
  });

  test('should return all products with status code 200', async () => {
    const event = {};
    const response = await getProductsList(event);
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(200);
    expect(response.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(products.length);

    body.forEach(product => {
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('title');
      expect(product).toHaveProperty('description');
      expect(product).toHaveProperty('price');
      expect(product).toHaveProperty('count');
    });
    
    expect(dbMocks.getAllProducts).toHaveBeenCalledTimes(1);
    expect(dbMocks.getAllStocks).toHaveBeenCalledTimes(1);
    expect(dbMocks.joinProductsWithStocks).toHaveBeenCalledTimes(1);
  });

  test('should return products with count field from joined data', async () => {
    const event = {};
    const response = await getProductsList(event);
    const body = JSON.parse(response.body);

    body.forEach(product => {
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('title');
      expect(product).toHaveProperty('description');
      expect(product).toHaveProperty('price');
      expect(product).toHaveProperty('count'); 
      expect(typeof product.count).toBe('number');
    });
  });

  test('should include CORS headers', async () => {
    const event = {};
    const response = await getProductsList(event);

    expect(response.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
    expect(response.headers).toHaveProperty('Access-Control-Allow-Credentials', true);
  });
});