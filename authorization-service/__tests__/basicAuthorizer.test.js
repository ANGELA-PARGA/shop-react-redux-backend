/**
 * Unit tests for basicAuthorizer Lambda function
 */

import { basicAuthorizer } from '../src/functions/basicAuthorizer/handler.js';

describe('basicAuthorizer', () => {
  const mockMethodArn = 'arn:aws:execute-api:us-east-1:123456789012:abcdef123/dev/GET/import';

  beforeEach(() => {
    // Set up test environment variable
    process.env['ANGELA_PARGA'] = 'TEST_PASSWORD';
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env['ANGELA_PARGA'];
  });

  describe('Valid credentials', () => {
    it('should return Allow policy for valid credentials', async () => {
      const validToken = Buffer.from('ANGELA_PARGA:TEST_PASSWORD').toString('base64');
      const event = {
        type: 'TOKEN',
        authorizationToken: `Basic ${validToken}`,
        methodArn: mockMethodArn,
      };

      const result = await basicAuthorizer(event);

      expect(result).toHaveProperty('principalId', 'ANGELA_PARGA');
      expect(result).toHaveProperty('policyDocument');
      expect(result.policyDocument.Statement[0].Effect).toBe('Allow');
      expect(result.policyDocument.Statement[0].Resource).toBe(mockMethodArn);
      expect(result.context).toHaveProperty('username', 'ANGELA_PARGA');
      expect(result.context).toHaveProperty('authenticated', 'true');
    });
  });

  describe('Invalid credentials', () => {
    it('should return Deny policy for invalid password', async () => {
      const invalidToken = Buffer.from('ANGELA_PARGA:WRONG_PASSWORD').toString('base64');
      const event = {
        type: 'TOKEN',
        authorizationToken: `Basic ${invalidToken}`,
        methodArn: mockMethodArn,
      };

      const result = await basicAuthorizer(event);

      expect(result).toHaveProperty('principalId', 'ANGELA_PARGA');
      expect(result).toHaveProperty('policyDocument');
      expect(result.policyDocument.Statement[0].Effect).toBe('Deny');
      expect(result.context).toHaveProperty('authenticated', 'false');
    });

    it('should return Deny policy for non-existent user', async () => {
      const invalidToken = Buffer.from('UNKNOWN-USER:TEST_PASSWORD').toString('base64');
      const event = {
        type: 'TOKEN',
        authorizationToken: `Basic ${invalidToken}`,
        methodArn: mockMethodArn,
      };

      const result = await basicAuthorizer(event);

      expect(result).toHaveProperty('principalId', 'UNKNOWN-USER');
      expect(result).toHaveProperty('policyDocument');
      expect(result.policyDocument.Statement[0].Effect).toBe('Deny');
    });
  });

  describe('Missing Authorization header', () => {
    it('should throw Unauthorized for missing authorizationToken', async () => {
      const event = {
        type: 'TOKEN',
        methodArn: mockMethodArn,
      };

      await expect(basicAuthorizer(event)).rejects.toThrow('Unauthorized');
    });

    it('should throw Unauthorized for empty authorizationToken', async () => {
      const event = {
        type: 'TOKEN',
        authorizationToken: '',
        methodArn: mockMethodArn,
      };

      await expect(basicAuthorizer(event)).rejects.toThrow('Unauthorized');
    });
  });

  describe('Malformed Authorization header', () => {
    it('should throw Unauthorized for header not starting with "Basic "', async () => {
      const token = Buffer.from('ANGELA-PARGA:TEST_PASSWORD').toString('base64');
      const event = {
        type: 'TOKEN',
        authorizationToken: `Bearer ${token}`, // Wrong format
        methodArn: mockMethodArn,
      };

      await expect(basicAuthorizer(event)).rejects.toThrow('Unauthorized');
    });

    it('should throw Unauthorized for header with no token', async () => {
      const event = {
        type: 'TOKEN',
        authorizationToken: 'Basic ',
        methodArn: mockMethodArn,
      };

      await expect(basicAuthorizer(event)).rejects.toThrow('Unauthorized');
    });

    it('should throw Unauthorized for invalid Base64 encoding', async () => {
      const event = {
        type: 'TOKEN',
        authorizationToken: 'Basic invalid@base64!',
        methodArn: mockMethodArn,
      };

      await expect(basicAuthorizer(event)).rejects.toThrow('Unauthorized');
    });

    it('should throw Unauthorized for token without colon separator', async () => {
      const invalidToken = Buffer.from('ANGELA-PARGA_TEST_PASSWORD').toString('base64');
      const event = {
        type: 'TOKEN',
        authorizationToken: `Basic ${invalidToken}`,
        methodArn: mockMethodArn,
      };

      await expect(basicAuthorizer(event)).rejects.toThrow('Unauthorized');
    });

    it('should throw Unauthorized for token with empty username', async () => {
      const invalidToken = Buffer.from(':TEST_PASSWORD').toString('base64');
      const event = {
        type: 'TOKEN',
        authorizationToken: `Basic ${invalidToken}`,
        methodArn: mockMethodArn,
      };

      await expect(basicAuthorizer(event)).rejects.toThrow('Unauthorized');
    });

    it('should throw Unauthorized for token with empty password', async () => {
      const invalidToken = Buffer.from('ANGELA-PARGA:').toString('base64');
      const event = {
        type: 'TOKEN',
        authorizationToken: `Basic ${invalidToken}`,
        methodArn: mockMethodArn,
      };

      await expect(basicAuthorizer(event)).rejects.toThrow('Unauthorized');
    });
  });
});
