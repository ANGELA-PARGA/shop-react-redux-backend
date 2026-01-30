import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { products } from '../src/data/products.js';

import * as dbMocks from './__mocks__/db.js';

jest.unstable_mockModule('../src/utils/db.js', () => dbMocks);

const { getProductsById } = await import('../src/functions/getProductsById/handler.js');

describe('getProductsById Lambda Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return product with status code 200 for valid product ID', async () => {
    const targetProduct = products.find(p => p.id === '7567ec4b-b10c-48c5-9345-fc73c48a80aa');
    const { count, ...productWithoutCount } = targetProduct;
    
    dbMocks.getProduct.mockResolvedValue(productWithoutCount);
    dbMocks.getStock.mockResolvedValue({ product_id: targetProduct.id, count });
    dbMocks.joinProductWithStock.mockReturnValue(targetProduct);

    const event = {
      pathParameters: { productId: '7567ec4b-b10c-48c5-9345-fc73c48a80aa' }
    };

    const response = await getProductsById(event);
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(200);
    expect(body).toEqual(targetProduct);
    
    expect(dbMocks.getProduct).toHaveBeenCalledWith('7567ec4b-b10c-48c5-9345-fc73c48a80aa');
    expect(dbMocks.getStock).toHaveBeenCalledWith('7567ec4b-b10c-48c5-9345-fc73c48a80aa');
    expect(dbMocks.joinProductWithStock).toHaveBeenCalledTimes(1);
  });

  test('should return 404 for non-existent product', async () => {
    dbMocks.getProduct.mockResolvedValue(null);
    dbMocks.getStock.mockResolvedValue(null);
    dbMocks.joinProductWithStock.mockReturnValue(null);

    const event = {
      pathParameters: { productId: '11111111-1234-4abc-8abc-123456789012' }
    };

    const response = await getProductsById(event);
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(404);
    expect(body.message).toContain('not found');
    

    expect(dbMocks.getProduct).toHaveBeenCalledWith('11111111-1234-4abc-8abc-123456789012');
  });

  test('should return 400 for invalid UUID format', async () => {
    const event = {
      pathParameters: { productId: 'invalid-uuid' }
    };

    const response = await getProductsById(event);

    expect(response.statusCode).toBe(400);
    
    expect(dbMocks.getProduct).not.toHaveBeenCalled();
    expect(dbMocks.getStock).not.toHaveBeenCalled();
  });

  test('should include CORS headers', async () => {
    const targetProduct = products[0];
    const { count, ...productWithoutCount } = targetProduct;
    
    dbMocks.getProduct.mockResolvedValue(productWithoutCount);
    dbMocks.getStock.mockResolvedValue({ product_id: targetProduct.id, count });
    dbMocks.joinProductWithStock.mockReturnValue(targetProduct);

    const event = {
      pathParameters: { productId: targetProduct.id }
    };

    const response = await getProductsById(event);

    expect(response.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
    expect(response.headers).toHaveProperty('Access-Control-Allow-Credentials', true);
  });
});