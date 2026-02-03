/**
 * Common HTTP response utilities for Lambda functions
 * This module provides helper functions to create standardized API responses
 */

/**
 * Default CORS headers for all responses
 */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
  'Content-Type': 'application/json',
};

/**
 * Creates a successful HTTP response
 * 
 * @param {*} data - The data to return in the response body
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {Object} additionalHeaders - Optional additional headers to include
 * @returns {Object} Formatted Lambda response object
 * 
 * @example
 * return createSuccessResponse({ message: 'Success' });
 * // Returns: { statusCode: 200, headers: {...}, body: '{"message":"Success"}' }
 */
export const createSuccessResponse = (data, statusCode = 200, additionalHeaders = {}) => {
  return {
    statusCode,
    headers: {
      ...CORS_HEADERS,
      ...additionalHeaders,
    },
    body: JSON.stringify(data),
  };
};

/**
 * Creates an error HTTP response
 * 
 * @param {string} message - Error message to return
 * @param {number} statusCode - HTTP error status code (default: 500)
 * @param {Object} additionalHeaders - Optional additional headers to include
 * @returns {Object} Formatted Lambda error response object
 * 
 * @example
 * return createErrorResponse('Product not found', 404);
 * // Returns: { statusCode: 404, headers: {...}, body: '{"message":"Product not found"}' }
 */
export const createErrorResponse = (message, statusCode = 500, additionalHeaders = {}) => {
  return {
    statusCode,
    headers: {
      ...CORS_HEADERS,
      ...additionalHeaders,
    },
    body: JSON.stringify({ message }),
  };
};

/**
 * HTTP status codes enum for better code readability
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};
