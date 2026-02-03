/**
 * Unit tests for importProductsFile Lambda function
 * Tests signed URL generation and error handling
 */

import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/utils/s3.js', () => ({
  getUploadSignedUrl: jest.fn(async (fileName) => {
    return `https://s3.amazonaws.com/test-bucket/uploaded/${fileName}?X-Amz-Signature=mock`;
  }),
  BUCKET_NAME: 'test-bucket',
}));

const { importProductsFile } = await import('../src/functions/importProductsFile/handler.js');

describe('importProductsFile Lambda Function', () => {
  
  describe('Successful scenarios', () => {
    
    test('should return signed URL for valid CSV filename', async () => {
      const event = {
        queryStringParameters: {
          name: 'products.csv',
        },
        requestContext: {
          http: {
            method: 'GET',
            path: '/import',
          },
        },
      };

      const result = await importProductsFile(event);

      expect(result.statusCode).toBe(200);
      
      const body = JSON.parse(result.body);
      expect(body).toHaveProperty('url');
      expect(body.url).toContain('https://s3.amazonaws.com');
      expect(body.url).toContain('products.csv');
      expect(body.url).toContain('X-Amz-Signature');
    });

    test('should handle CSV filename with uppercase extension', async () => {
      const event = {
        queryStringParameters: {
          name: 'PRODUCTS.CSV',
        },
        requestContext: {
          http: {
            method: 'GET',
            path: '/import',
          },
        },
      };

      const result = await importProductsFile(event);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body).toHaveProperty('url');
    });

    test('should handle CSV filename with spaces', async () => {
      const event = {
        queryStringParameters: {
          name: 'my products.csv',
        },
        requestContext: {
          http: {
            method: 'GET',
            path: '/import',
          },
        },
      };

      const result = await importProductsFile(event);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body).toHaveProperty('url');
    });

  });

  describe('Error scenarios', () => {

    test('should return 400 if name parameter is missing', async () => {
      const event = {
        queryStringParameters: {},
        requestContext: {
          http: {
            method: 'GET',
            path: '/import',
          },
        },
      };

      const result = await importProductsFile(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body).toHaveProperty('message');
      expect(body.message).toContain('Filename is required');
    });

    test('should return 400 if name parameter is empty', async () => {
      const event = {
        queryStringParameters: {
          name: '',
        },
        requestContext: {
          http: {
            method: 'GET',
            path: '/import',
          },
        },
      };

      const result = await importProductsFile(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.message).toContain('Invalid filename');
    });

    test('should return 400 if filename does not have .csv extension', async () => {
      const event = {
        queryStringParameters: {
          name: 'products.txt',
        },
        requestContext: {
          http: {
            method: 'GET',
            path: '/import',
          },
        },
      };

      const result = await importProductsFile(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.message).toContain('.csv extension');
    });

    test('should return 400 if filename contains path traversal', async () => {
      const event = {
        queryStringParameters: {
          name: '../../../etc/passwd.csv',
        },
        requestContext: {
          http: {
            method: 'GET',
            path: '/import',
          },
        },
      };

      const result = await importProductsFile(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.message).toContain('Invalid filename');
    });

    test('should return 400 if filename contains forward slash', async () => {
      const event = {
        queryStringParameters: {
          name: 'folder/products.csv',
        },
        requestContext: {
          http: {
            method: 'GET',
            path: '/import',
          },
        },
      };

      const result = await importProductsFile(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.message).toContain('invalid path characters');
    });

    test('should return 400 if filename contains invalid characters', async () => {
      const event = {
        queryStringParameters: {
          name: 'products<>.csv',
        },
        requestContext: {
          http: {
            method: 'GET',
            path: '/import',
          },
        },
      };

      const result = await importProductsFile(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.message).toContain('Invalid filename');
    });

    test('should return 400 if filename is too long', async () => {
      const longName = 'a'.repeat(256) + '.csv';
      const event = {
        queryStringParameters: {
          name: longName,
        },
        requestContext: {
          http: {
            method: 'GET',
            path: '/import',
          },
        },
      };

      const result = await importProductsFile(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.message).toContain('too long');
    });

  });

  describe('Response structure', () => {

    test('should include CORS headers in response', async () => {
      const event = {
        queryStringParameters: {
          name: 'products.csv',
        },
        requestContext: {
          http: {
            method: 'GET',
            path: '/import',
          },
        },
      };

      const result = await importProductsFile(event);

      expect(result.headers).toHaveProperty('Access-Control-Allow-Origin');
      expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(result.headers).toHaveProperty('Content-Type');
      expect(result.headers['Content-Type']).toBe('application/json');
    });

    test('should return valid JSON in body', async () => {
      const event = {
        queryStringParameters: {
          name: 'products.csv',
        },
        requestContext: {
          http: {
            method: 'GET',
            path: '/import',
          },
        },
      };

      const result = await importProductsFile(event);

      expect(() => JSON.parse(result.body)).not.toThrow();
    });

  });

});
