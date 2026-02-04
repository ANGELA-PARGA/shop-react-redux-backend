/**
 * Catalog Batch Process Handler
 * 
 * Triggered by SQS catalogItemsQueue with batches of 5 messages.
 * Creates products in DynamoDB using transactions and sends SNS notifications.
 * 
 * SQS Event Trigger: catalogItemsQueue with batchSize: 5
 */

import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { logRequest, logSuccess, logError } from '../../utils/logger.js';
import { createProductWithStock } from '../../utils/productCreator.js';

const snsClient = new SNSClient({ region: 'us-east-1' });

/**
 * Process a single SQS message and create product
 * 
 * @param {Object} message - SQS message with product data
 * @returns {Promise<Object>} Created product with stock
 * @throws {ValidationError} If validation fails (message goes to DLQ after retries)
 * @throws {Error} If transaction fails
 */
async function processMessage(message) {
  const productData = JSON.parse(message.body);
  return await createProductWithStock(productData);
}

/**
 * Send SNS notification for created products
 * 
 * @param {Array} products - Array of created products
 * @returns {Promise<void>}
 */
async function sendNotification(products) {
  const totalCount = products.length;
  const totalValue = products.reduce((sum, p) => sum + p.price, 0);
  const hasHighValueProducts = products.some(p => p.price > 100);

  const message = {
    event: 'PRODUCTS_CREATED',
    timestamp: new Date().toISOString(),
    summary: {
      totalProducts: totalCount,
      totalValue: totalValue.toFixed(2),
      hasHighValueItems: hasHighValueProducts
    },
    products: products.map(p => ({
      id: p.id,
      title: p.title,
      price: p.price,
      count: p.count
    }))
  };

  const params = {
    TopicArn: process.env.SNS_TOPIC_ARN,
    Subject: `🛍️ New Products Created: ${totalCount} product${totalCount > 1 ? 's' : ''}`,
    Message: JSON.stringify(message, null, 2),
    MessageAttributes: {
      totalCount: {
        DataType: 'Number',
        StringValue: String(totalCount)
      },
      totalValue: {
        DataType: 'Number',
        StringValue: String(totalValue.toFixed(2))
      },
      highValue: {
        DataType: 'String',
        StringValue: hasHighValueProducts ? 'true' : 'false'
      }
    }
  };

  await snsClient.send(new PublishCommand(params));
  logSuccess(200, 'SNS notification sent', { productCount: totalCount });
}

/**
 * Handler function to process SQS messages in batch
 * Manages its own error handling for partial batch failures.
 * No wrapper needed - SQS expects {batchItemFailures}, not HTTP responses.
 * 
 * @param {Object} event - SQS event object
 * @param {Array} event.Records - Array of SQS message records
 * @returns {Promise<Object>} Batch processing result with failures
 */
export const catalogBatchProcess = async (event) => {
  logRequest(event, 'catalogBatchProcess');

  const processedProducts = [];
  const batchItemFailures = [];

  for (const record of event.Records) {
    try {
      const product = await processMessage(record);
      processedProducts.push(product);
      
      logSuccess(200, 'Product created successfully', { 
        productId: product.id,
        title: product.title 
      });
    } catch (error) {
      logError(error, 'catalogBatchProcess', {
        messageId: record.messageId,
        body: record.body
      });
      
      batchItemFailures.push({
        itemIdentifier: record.messageId
      });
    }
  }

  if (processedProducts.length > 0) {
    try {
      await sendNotification(processedProducts);
    } catch (error) {
      logError(error, 'catalogBatchProcess - SNS notification failed', {
        productCount: processedProducts.length
      });
    }
  }

  logSuccess(200, 'Batch processing completed', {
    successful: processedProducts.length,
    failed: batchItemFailures.length,
    totalMessages: event.Records.length
  });

  return {
    batchItemFailures
  };
};
