/**
 * Import File Parser Handler
 * 
 * Triggered by S3 when a CSV file is uploaded to the 'uploaded/' folder.
 * Streams the file, parses CSV records, sends each record to SQS,
 * and moves the file to 'parsed/' folder when complete.
 * 
 * S3 Event Trigger: s3:ObjectCreated:* for uploaded/*.csv
 */

import { pipeline } from 'stream/promises';
import { Transform } from 'stream';
import csvParser from 'csv-parser';
import { SQSClient, SendMessageBatchCommand } from '@aws-sdk/client-sqs';
import { getObjectStream, moveFromUploadedToParsed } from '../../utils/s3.js';
import { withErrorHandler } from '../../utils/errorHandler.js';
import { logSuccess, logWarning, logRequest } from '../../utils/logger.js';
import { validateProductRecord } from '../../utils/validators.js';
import { createSuccessResponse } from '../../utils/responseBuilder.js';

const sqsClient = new SQSClient({ region: 'us-east-1' });

/**
 * Send products to SQS in batches
 * 
 * @param {Array} products - Array of product records
 * @returns {Promise<void>}
 */
async function sendToSQS(products) {
  const batchSize = 10; 
  
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    
    const entries = batch.map((product, index) => ({
      Id: `${Date.now()}-${i + index}`,
      MessageBody: JSON.stringify({
        title: product.title,
        description: product.description || '',
        price: parseFloat(product.price),
        count: parseInt(product.count, 10)
      }),
      MessageAttributes: {
        productTitle: {
          DataType: 'String',
          StringValue: product.title
        },
        productPrice: {
          DataType: 'Number',
          StringValue: String(parseFloat(product.price))
        }
      }
    }));

    const params = {
      QueueUrl: process.env.CATALOG_ITEMS_QUEUE_URL,
      Entries: entries
    };

    const response = await sqsClient.send(new SendMessageBatchCommand(params));
    
    console.log(`[INFO] Batch ${Math.floor(i / batchSize) + 1} sent to SQS: ${entries.length} messages`);
    
    if (response.Failed && response.Failed.length > 0) {
      logWarning('Some messages failed to send to SQS', {
        failures: response.Failed
      });
    }
  }
}

/**
 * Processes a single CSV file from S3
 * 
 * @param {string} bucket - S3 bucket name
 * @param {string} key - S3 object key
 * @returns {Promise<Object>} Processing result
 */
async function processFile(bucket, key) {
  console.log(`[INFO] Processing file: ${key} from bucket: ${bucket}`);

  const stream = await getObjectStream(bucket, key);

  const validProducts = [];
  let totalRows = 0;
  let validRows = 0;
  let invalidRows = 0;

  const processRowStream = new Transform({
    objectMode: true,
    transform(row, encoding, callback) {
      totalRows++;
      
      const validation = validateProductRecord(row, totalRows);
      
      if (validation.isValid) {
        validRows++;
        validProducts.push(row);
      } else {
        invalidRows++;
        logWarning('Invalid CSV record', {
          rowNumber: totalRows,
          errors: validation.errors,
          record: row,
        });
      }
      
      callback();
    }
  });

  await pipeline(
    stream,
    csvParser(),
    processRowStream
  );

  console.log(`[INFO] CSV parsing complete. Total rows: ${totalRows}`);
  
  console.log('[PROCESSING_SUMMARY]', JSON.stringify({
    timestamp: new Date().toISOString(),
    type: 'PROCESSING_SUMMARY',
    fileName: key,
    totalRows,
    validRows,
    invalidRows,
  }));

  if (validProducts.length > 0) {
    await sendToSQS(validProducts);
    console.log(`[INFO] Sent ${validProducts.length} products to SQS queue`);
  }
  
  const fileName = key.split('/').pop();
  await moveFromUploadedToParsed(bucket, fileName);
  
  logSuccess(200, 'File processed and sent to SQS', { 
    fileName, 
    totalRows,
    validRows,
    invalidRows,
    sentToSQS: validProducts.length
  });

  return {
    key,
    totalRows,
    validRows,
    invalidRows,
    sentToSQS: validProducts.length,
    status: 'success'
  };
}

/**
 * Handler function to process CSV files from S3
 * 
 * @param {Object} event - S3 event object
 * @param {Array} event.Records - Array of S3 event records
 * @returns {Promise<Object>} Success response
 */
const handler = async (event) => {
  logRequest(event, 'importFileParser');

  const results = await Promise.allSettled(
    event.Records.map(record => {
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
      return processFile(bucket, key);
    })
  );

  const processedResults = results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      const record = event.Records[index];
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
      logWarning('File processing failed', {
        key,
        error: result.reason.message,
      });
      return {
        key,
        status: 'failed',
        error: result.reason.message
      };
    }
  });

  return createSuccessResponse({
    message: 'File processing completed',
    results: processedResults
  });
};

/**
 * Exported handler with error handling wrapper
 */
export const importFileParser = withErrorHandler(handler, 'importFileParser');
