import { getProductsById } from '../src/functions/getProductsById/handler.js';
import { products } from '../src/data/products.js';

describe('getProductsById Lambda Handler', () => {
  // Test 1: Should return product with 200 status when valid ID is provided
  test('should return product with status code 200 for valid product ID', async () => {
    // Arrange
    const validProductId = products[0].id;
    const event = {
      pathParameters: {
        productId: validProductId
      }
    };
    
    // Act
    const response = await getProductsById(event);
    
    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
    expect(response.headers).toHaveProperty('Access-Control-Allow-Credentials', true);
  });

  // Test 2: Should return correct product by ID
  test('should return the correct product for given ID', async () => {
    // Arrange
    const testProduct = products[0];
    const event = {
      pathParameters: {
        productId: testProduct.id
      }
    };
    
    // Act
    const response = await getProductsById(event);
    const body = JSON.parse(response.body);
    
    // Assert
    expect(body).toEqual(testProduct);
    expect(body.id).toBe(testProduct.id);
    expect(body.title).toBe(testProduct.title);
  });

  // Test 3: Should return 400 for invalid UUID format
  test('should return 400 status code for invalid UUID format', async () => {
    // Arrange
    const invalidProductId = 'not-a-uuid-format';
    const event = {
      pathParameters: {
        productId: invalidProductId
      }
    };
    
    // Act
    const response = await getProductsById(event);
    
    // Assert
    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.message).toContain('Invalid product ID format');
  });

  // Test 4: Should return 404 for valid UUID but non-existent product
  test('should return 404 status code for valid UUID but non-existent product', async () => {
    // Arrange
    const validUUIDButNonExistent = '12345678-1234-4abc-8abc-123456789012';
    const event = {
      pathParameters: {
        productId: validUUIDButNonExistent
      }
    };
    
    // Act
    const response = await getProductsById(event);
    
    // Assert
    expect(response.statusCode).toBe(404);
  });

  // Test 5: Should return error message for non-existent product with valid UUID
  test('should return "Product not found" message for non-existent product with valid UUID', async () => {
    // Arrange
    const validUUIDButNonExistent = '99999999-1234-4abc-8abc-123456789012';
    const event = {
      pathParameters: {
        productId: validUUIDButNonExistent
      }
    };
    
    // Act
    const response = await getProductsById(event);
    const body = JSON.parse(response.body);
    
    // Assert
    expect(response.statusCode).toBe(404);
    expect(body).toHaveProperty('message', 'Product not found');
  });

  // Test 6: Should return valid JSON structure for found product
  test('should return product with correct structure', async () => {
    // Arrange
    const validProductId = products[1].id;
    const event = {
      pathParameters: {
        productId: validProductId
      }
    };
    
    // Act
    const response = await getProductsById(event);
    const body = JSON.parse(response.body);
    
    // Assert
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('title');
    expect(body).toHaveProperty('description');
    expect(body).toHaveProperty('price');
    expect(typeof body.id).toBe('string');
    expect(typeof body.title).toBe('string');
    expect(typeof body.description).toBe('string');
    expect(typeof body.price).toBe('number');
  });

  // Test 7: Should work for all products in the catalog
  test('should successfully retrieve each product in the catalog', async () => {
    // Test each product
    for (const product of products) {
      const event = {
        pathParameters: {
          productId: product.id
        }
      };
      
      const response = await getProductsById(event);
      const body = JSON.parse(response.body);
      
      expect(response.statusCode).toBe(200);
      expect(body.id).toBe(product.id);
    }
  });

  // Test 8: Should include CORS headers in success response
  test('should include proper CORS headers in success response', async () => {
    // Arrange
    const validProductId = products[0].id;
    const event = {
      pathParameters: {
        productId: validProductId
      }
    };
    
    // Act
    const response = await getProductsById(event);
    
    // Assert
    expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
    expect(response.headers['Access-Control-Allow-Credentials']).toBe(true);
  });

  // Test 9: Should include CORS headers in 404 error response
  test('should include proper CORS headers in 404 error response', async () => {
    // Arrange
    const validUUIDButNonExistent = '11111111-1234-4abc-8abc-123456789012';
    const event = {
      pathParameters: {
        productId: validUUIDButNonExistent
      }
    };
    
    // Act
    const response = await getProductsById(event);
    
    // Assert
    expect(response.statusCode).toBe(404);
    expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
    expect(response.headers['Access-Control-Allow-Credentials']).toBe(true);
  });

  // Test 10: Should include CORS headers in 400 error response
  test('should include proper CORS headers in 400 error response', async () => {
    // Arrange
    const invalidFormat = 'invalid-format';
    const event = {
      pathParameters: {
        productId: invalidFormat
      }
    };
    
    // Act
    const response = await getProductsById(event);
    
    // Assert
    expect(response.statusCode).toBe(400);
    expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
    expect(response.headers['Access-Control-Allow-Credentials']).toBe(true);
  });

  // Test 11: Should handle UUIDs case-insensitively
  test('should accept UUIDs in any case (case-insensitive)', async () => {
    // Arrange
    const validProductId = products[0].id;
    const uppercaseId = validProductId.toUpperCase();
    const event = {
      pathParameters: {
        productId: uppercaseId
      }
    };
    
    // Act
    const response = await getProductsById(event);
    const body = JSON.parse(response.body);
    
    // Assert
    // UUID validation is case-insensitive (regex uses /i flag)
    expect(response.statusCode).toBe(200);
    expect(body.id).toBe(validProductId);
  });
});
