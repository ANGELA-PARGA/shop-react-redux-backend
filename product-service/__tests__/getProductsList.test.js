import { getProductsList } from '../src/functions/getProductsList/handler.js';
import { products } from '../src/data/products.js';

describe('getProductsList Lambda Handler', () => {
  // Test 1: Should return all products with 200 status
  test('should return all products with status code 200', async () => {
    // Arrange
    const event = {};
    
    // Act
    const response = await getProductsList(event);
    
    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
    expect(response.headers).toHaveProperty('Access-Control-Allow-Credentials', true);
  });

  // Test 2: Should return valid JSON body
  test('should return valid JSON body', async () => {
    // Arrange
    const event = {};
    
    // Act
    const response = await getProductsList(event);
    const body = JSON.parse(response.body);
    
    // Assert
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  // Test 3: Should return products with correct structure
  test('should return products with correct structure', async () => {
    // Arrange
    const event = {};
    
    // Act
    const response = await getProductsList(event);
    const body = JSON.parse(response.body);
    
    // Assert
    body.forEach(product => {
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('title');
      expect(product).toHaveProperty('description');
      expect(product).toHaveProperty('price');
      expect(typeof product.id).toBe('string');
      expect(typeof product.title).toBe('string');
      expect(typeof product.description).toBe('string');
      expect(typeof product.price).toBe('number');
    });
  });

  // Test 4: Should return the same products as mock data
  test('should return all products from mock data', async () => {
    // Arrange
    const event = {};
    
    // Act
    const response = await getProductsList(event);
    const body = JSON.parse(response.body);
    
    // Assert
    expect(body).toEqual(products);
    expect(body.length).toBe(products.length);
  });

  // Test 5: Should include CORS headers
  test('should include proper CORS headers', async () => {
    // Arrange
    const event = {};
    
    // Act
    const response = await getProductsList(event);
    
    // Assert
    expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
    expect(response.headers['Access-Control-Allow-Credentials']).toBe(true);
  });

  // Test 6: Should handle empty event object
  test('should handle request with empty event object', async () => {
    // Arrange
    const event = {};
    
    // Act
    const response = await getProductsList(event);
    
    // Assert
    expect(response).toBeDefined();
    expect(response.statusCode).toBe(200);
  });
});
