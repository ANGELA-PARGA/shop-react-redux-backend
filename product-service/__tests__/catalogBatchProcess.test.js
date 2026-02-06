/**
 * Unit Tests for catalogBatchProcess Lambda Function
 * 
 * Tests batch processing of SQS messages, product creation,
 * validation, error handling, and SNS notifications.
 */

import { jest } from '@jest/globals';

// Mock dependencies before importing the handler
const mockCreateProductTransaction = jest.fn();
const mockSNSClientSend = jest.fn();

jest.unstable_mockModule('../src/utils/db.js', () => ({
  createProductTransaction: mockCreateProductTransaction
}));

jest.unstable_mockModule('@aws-sdk/client-sns', () => ({
  SNSClient: jest.fn().mockImplementation(() => ({
    send: mockSNSClientSend
  })),
  PublishCommand: jest.fn().mockImplementation((params) => params)
}));

const { catalogBatchProcess } = await import('../src/functions/catalogBatchProcess/handler.js');

describe('catalogBatchProcess', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SNS_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:createProductTopic';
    mockSNSClientSend.mockResolvedValue({});
  });

  afterEach(() => {
    delete process.env.SNS_TOPIC_ARN;
  });

  describe('Successful Processing', () => {
    it('should process valid SQS messages and create products', async () => {
      const event = {
        Records: [
          {
            messageId: 'msg-1',
            body: JSON.stringify({
              title: 'Test Product 1',
              description: 'Test Description 1',
              price: 99.99,
              count: 10
            })
          },
          {
            messageId: 'msg-2',
            body: JSON.stringify({
              title: 'Test Product 2',
              description: 'Test Description 2',
              price: 49.99,
              count: 5
            })
          }
        ]
      };

      mockCreateProductTransaction.mockResolvedValue({});

      const result = await catalogBatchProcess(event);

      expect(mockCreateProductTransaction).toHaveBeenCalledTimes(2);
      expect(mockSNSClientSend).toHaveBeenCalledTimes(1);
      expect(result.batchItemFailures).toHaveLength(0);
    });

    it('should send SNS notification with correct attributes', async () => {
      const event = {
        Records: [
          {
            messageId: 'msg-1',
            body: JSON.stringify({
              title: 'Expensive Product',
              description: 'High value item',
              price: 150.00,
              count: 2
            })
          }
        ]
      };

      mockCreateProductTransaction.mockResolvedValue({});

      await catalogBatchProcess(event);

      expect(mockSNSClientSend).toHaveBeenCalledWith(
        expect.objectContaining({
          MessageAttributes: expect.objectContaining({
            totalCount: {
              DataType: 'Number',
              StringValue: '1'
            },
            highValue: {
              DataType: 'String',
              StringValue: 'true'
            }
          })
        })
      );
    });

    it('should fail validation when description is missing', async () => {
      const event = {
        Records: [
          {
            messageId: 'msg-1',
            body: JSON.stringify({
              title: 'Product Without Description',
              price: 29.99,
              count: 15
            })
          }
        ]
      };

      mockCreateProductTransaction.mockResolvedValue({});

      const result = await catalogBatchProcess(event);

      expect(mockCreateProductTransaction).not.toHaveBeenCalled();
      expect(result.batchItemFailures).toHaveLength(1);
      expect(result.batchItemFailures[0].itemIdentifier).toBe('msg-1');
    });
  });

  describe('Validation Errors', () => {
    it('should return batch failure for invalid product data', async () => {
      const event = {
        Records: [
          {
            messageId: 'msg-invalid',
            body: JSON.stringify({
              title: '', // Invalid: empty title
              price: 99.99,
              count: 10
            })
          }
        ]
      };

      const result = await catalogBatchProcess(event);

      expect(mockCreateProductTransaction).not.toHaveBeenCalled();
      expect(result.batchItemFailures).toHaveLength(1);
      expect(result.batchItemFailures[0].itemIdentifier).toBe('msg-invalid');
    });

    it('should return batch failure for missing required fields', async () => {
      const event = {
        Records: [
          {
            messageId: 'msg-missing',
            body: JSON.stringify({
              title: 'Product Without Price'
              // Missing price and count
            })
          }
        ]
      };

      const result = await catalogBatchProcess(event);

      expect(mockCreateProductTransaction).not.toHaveBeenCalled();
      expect(result.batchItemFailures).toHaveLength(1);
    });

    it('should return batch failure for invalid price', async () => {
      const event = {
        Records: [
          {
            messageId: 'msg-invalid-price',
            body: JSON.stringify({
              title: 'Product',
              description: 'Description',
              price: -10, // Invalid: negative price
              count: 5
            })
          }
        ]
      };

      const result = await catalogBatchProcess(event);

      expect(mockCreateProductTransaction).not.toHaveBeenCalled();
      expect(result.batchItemFailures).toHaveLength(1);
    });

    it('should return batch failure for invalid count', async () => {
      const event = {
        Records: [
          {
            messageId: 'msg-invalid-count',
            body: JSON.stringify({
              title: 'Product',
              description: 'Description',
              price: 50.00,
              count: -1 // Invalid: negative count
            })
          }
        ]
      };

      const result = await catalogBatchProcess(event);

      expect(mockCreateProductTransaction).not.toHaveBeenCalled();
      expect(result.batchItemFailures).toHaveLength(1);
    });
  });

  describe('Partial Batch Failures', () => {
    it('should process valid messages and return failures for invalid ones', async () => {
      const event = {
        Records: [
          {
            messageId: 'msg-valid',
            body: JSON.stringify({
              title: 'Valid Product',
              description: 'Valid Description',
              price: 99.99,
              count: 10
            })
          },
          {
            messageId: 'msg-invalid',
            body: JSON.stringify({
              title: '', // Invalid
              price: 50.00,
              count: 5
            })
          },
          {
            messageId: 'msg-valid-2',
            body: JSON.stringify({
              title: 'Another Valid Product',
              description: 'Another Description',
              price: 29.99,
              count: 20
            })
          }
        ]
      };

      mockCreateProductTransaction.mockResolvedValue({});

      const result = await catalogBatchProcess(event);

      expect(mockCreateProductTransaction).toHaveBeenCalledTimes(2);
      expect(mockSNSClientSend).toHaveBeenCalledTimes(1);
      expect(result.batchItemFailures).toHaveLength(1);
      expect(result.batchItemFailures[0].itemIdentifier).toBe('msg-invalid');
    });
  });

  describe('Database Errors', () => {
    it('should return batch failure when database transaction fails', async () => {
      const event = {
        Records: [
          {
            messageId: 'msg-db-error',
            body: JSON.stringify({
              title: 'Product',
              description: 'Description',
              price: 99.99,
              count: 10
            })
          }
        ]
      };

      mockCreateProductTransaction.mockRejectedValue(
        new Error('DynamoDB TransactionCanceledException')
      );

      const result = await catalogBatchProcess(event);

      expect(result.batchItemFailures).toHaveLength(1);
      expect(result.batchItemFailures[0].itemIdentifier).toBe('msg-db-error');
    });
  });

  describe('SNS Notification', () => {
    it('should not send SNS if no products were created', async () => {
      const event = {
        Records: [
          {
            messageId: 'msg-invalid',
            body: JSON.stringify({
              title: '',
              price: 99.99,
              count: 10
            })
          }
        ]
      };

      await catalogBatchProcess(event);

      expect(mockSNSClientSend).not.toHaveBeenCalled();
    });

    it('should continue processing even if SNS notification fails', async () => {
      const event = {
        Records: [
          {
            messageId: 'msg-1',
            body: JSON.stringify({
              title: 'Product',
              description: 'Description',
              price: 99.99,
              count: 10
            })
          }
        ]
      };

      mockCreateProductTransaction.mockResolvedValue({});
      mockSNSClientSend.mockRejectedValue(new Error('SNS Error'));

      const result = await catalogBatchProcess(event);

      expect(mockCreateProductTransaction).toHaveBeenCalledTimes(1);
      expect(result.batchItemFailures).toHaveLength(0);
    });

    it('should detect high value products correctly', async () => {
      const event = {
        Records: [
          {
            messageId: 'msg-low',
            body: JSON.stringify({
              title: 'Cheap Product',
              description: 'Low price',
              price: 50.00,
              count: 10
            })
          },
          {
            messageId: 'msg-high',
            body: JSON.stringify({
              title: 'Expensive Product',
              description: 'High price',
              price: 150.00,
              count: 5
            })
          }
        ]
      };

      mockCreateProductTransaction.mockResolvedValue({});

      await catalogBatchProcess(event);

      expect(mockSNSClientSend).toHaveBeenCalledWith(
        expect.objectContaining({
          MessageAttributes: expect.objectContaining({
            highValue: {
              DataType: 'String',
              StringValue: 'true'
            }
          })
        })
      );
    });
  });

  describe('Empty Batch', () => {
    it('should handle empty Records array', async () => {
      const event = {
        Records: []
      };

      const result = await catalogBatchProcess(event);

      expect(mockCreateProductTransaction).not.toHaveBeenCalled();
      expect(mockSNSClientSend).not.toHaveBeenCalled();
      expect(result.batchItemFailures).toHaveLength(0);
    });
  });
});
