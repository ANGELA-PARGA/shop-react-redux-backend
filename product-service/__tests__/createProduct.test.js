import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import * as dbMocks from './__mocks__/db.js';

jest.unstable_mockModule('../src/utils/db.js', () => dbMocks);

const { createProduct } = await import('../src/functions/createProduct/handler.js');

describe('createProduct Lambda Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: Success - Valid product creation
  test('should create product with status code 201 for valid product data', async () => {
    const event = {
      body: JSON.stringify({
        title: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        count: 10
      })
    };

    const response = await createProduct(event);
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(201);
    expect(response.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
    expect(response.headers).toHaveProperty('Access-Control-Allow-Credentials', true);
    expect(body).toHaveProperty('id');
    expect(body.title).toBe('Test Product');
    expect(body.description).toBe('Test Description');
    expect(body.price).toBe(99.99);
    expect(body.count).toBe(10);
    
    // Verify the database transaction was called with correct data
    expect(dbMocks.createProductTransaction).toHaveBeenCalledTimes(1);
    expect(dbMocks.createProductTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        count: 10,
        id: expect.any(String)
      }),
      expect.objectContaining({
        product_id: expect.any(String),
        count: 10
      })
    );
  });

  // Test 2: Validation - Missing required field (title)
  test('should return 400 when title is missing', async () => {
    const event = {
      body: JSON.stringify({
        description: 'Test Description',
        price: 99.99,
        count: 10
      })
    };

    const response = await createProduct(event);
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(400);
    expect(body.message).toContain('Invalid product data');
    expect(dbMocks.createProductTransaction).not.toHaveBeenCalled();
  });

  // Test 3: Validation - Negative price
  test('should return 400 for negative price', async () => {
    const event = {
      body: JSON.stringify({
        title: 'Test Product',
        description: 'Test Description',
        price: -10,
        count: 5
      })
    };

    const response = await createProduct(event);
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(400);
    expect(body.message).toContain('Invalid product data');
    expect(dbMocks.createProductTransaction).not.toHaveBeenCalled();
  });

  // Test 4: Validation - Negative count
  test('should return 400 for negative count', async () => {
    const event = {
      body: JSON.stringify({
        title: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        count: -5
      })
    };

    const response = await createProduct(event);
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(400);
    expect(body.message).toContain('Invalid product data');
    expect(dbMocks.createProductTransaction).not.toHaveBeenCalled();
  });

  // Test 5: Validation - Invalid data type for price
  test('should return 400 for non-numeric price', async () => {
    const event = {
      body: JSON.stringify({
        title: 'Test Product',
        description: 'Test Description',
        price: 'invalid',
        count: 5
      })
    };

    const response = await createProduct(event);
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(400);
    expect(body.message).toContain('Invalid product data');
    expect(dbMocks.createProductTransaction).not.toHaveBeenCalled();
  });

  // Test 6: Validation - Invalid data type for count
  test('should return 400 for non-numeric count', async () => {
    const event = {
      body: JSON.stringify({
        title: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        count: 'invalid'
      })
    };

    const response = await createProduct(event);
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(400);
    expect(body.message).toContain('Invalid product data');
    expect(dbMocks.createProductTransaction).not.toHaveBeenCalled();
  });

  // Test 7: Error handling - Invalid JSON
  test('should return 400 for invalid JSON', async () => {
    const event = {
      body: 'invalid json {'
    };

    const response = await createProduct(event);
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(400);
    expect(body.message).toContain('Invalid JSON in request body');
    expect(dbMocks.createProductTransaction).not.toHaveBeenCalled();
  });
});
