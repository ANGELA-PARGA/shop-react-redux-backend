/**
 * Import Products File Handler
 * 
 * Generates pre-signed URLs for uploading CSV files to S3.
 * Allows frontend to upload files directly to S3 without going through Lambda.
 */

import { getUploadSignedUrl } from '../../utils/s3.js';
import { createSuccessResponse, createErrorResponse, HTTP_STATUS } from '../../utils/responseBuilder.js';
import { validateFileName } from '../../utils/validators.js';
import { withErrorHandler } from '../../utils/errorHandler.js';
import { logRequest, logSuccess, logWarning } from '../../utils/logger.js';

/**
 * Handler function to generate signed URL for file upload
 * 
 * @param {Object} event - Lambda HTTP event
 * @param {Object} event.queryStringParameters - Query parameters
 * @param {string} event.queryStringParameters.name - CSV filename
 * @returns {Object} HTTP response with signed URL
 */
const handler = async (event) => {
  logRequest(event, 'importProductsFile');

  const fileName = event.queryStringParameters?.name;

  const validation = validateFileName(fileName);
  if (!validation.isValid) {
    logWarning('Invalid filename provided', { 
      fileName, 
      errors: validation.errors 
    });
    return createErrorResponse(
      `Invalid filename: ${validation.errors.join(', ')}`,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const signedUrl = await getUploadSignedUrl(fileName);

  logSuccess(HTTP_STATUS.OK, 'Signed URL generated successfully', { fileName });

  return createSuccessResponse(
    { url: signedUrl },
    HTTP_STATUS.OK
  );
};

/**
 * Exported handler with error handling wrapper
 */
export const importProductsFile = withErrorHandler(handler, 'importProductsFile');
