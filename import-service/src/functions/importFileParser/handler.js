/**
 * Import File Parser Handler
 * 
 * Triggered by S3 when a CSV file is uploaded to the 'uploaded/' folder.
 * Streams the file, parses CSV records, logs each record to CloudWatch,
 * and moves the file to 'parsed/' folder when complete.
 * 
 * S3 Event Trigger: s3:ObjectCreated:* for uploaded/*.csv
 */

import { pipeline } from 'stream/promises';
import { Transform } from 'stream';
import csvParser from 'csv-parser';
import { getObjectStream, moveFromUploadedToParsed } from '../../utils/s3.js';
import { withErrorHandler } from '../../utils/errorHandler.js';
import { logSuccess, logWarning, logRequest } from '../../utils/logger.js';
import { validateProductRecord } from '../../utils/validators.js';
import { createSuccessResponse } from '../../utils/responseBuilder.js';

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
        console.log('[CSV_RECORD]', JSON.stringify({
          timestamp: new Date().toISOString(),
          type: 'CSV_RECORD',
          rowNumber: totalRows,
          record: row,
        }));
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
  
  const fileName = key.split('/').pop();
  await moveFromUploadedToParsed(bucket, fileName);
  
  logSuccess(200, 'File processed and moved to parsed folder', { 
    fileName, 
    totalRows,
    validRows,
    invalidRows 
  });

  return {
    key,
    totalRows,
    validRows,
    invalidRows,
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
