/**
 * Error Handler Utility
 * 
 * Provides centralized error handling for Lambda functions.
 * Catches all errors and returns appropriate HTTP responses with status 500.
 */

import { createErrorResponse, HTTP_STATUS } from './responseBuilder.js';
import { logError } from './logger.js';

/**
 * Wraps a Lambda handler with error handling
 * Catches all errors and returns a 500 Internal Server Error response
 * 
 * @param {Function} handler - The Lambda handler function to wrap
 * @param {string} functionName - Name of the function (for logging)
 * @returns {Function} Wrapped handler with error handling
 * 
 */
export function withErrorHandler(handler, functionName) {
  return async (event) => {
    try {
      return await handler(event);
    } catch (error) {
      logError(error, functionName, {
        eventPath: event.path,
        eventMethod: event.requestContext?.http?.method,
        pathParameters: event.pathParameters,
      });

      let errorMessage = 'Internal server error';
      let statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;

      if (error.name === 'ValidationError') {
        errorMessage = error.message;
        statusCode = HTTP_STATUS.BAD_REQUEST;
      } else if (error.name === 'SyntaxError') {
        errorMessage = 'Invalid JSON in request body';
        statusCode = HTTP_STATUS.BAD_REQUEST;
      } else if (error.name === 'ResourceNotFoundException') {
        errorMessage = 'Database resource not found';
        logError(
          new Error('DynamoDB table not found'),
          functionName,
          { tableName: error.message }
        );
      } else if (error.name === 'ValidationException') {
        errorMessage = 'Invalid request data';
        statusCode = HTTP_STATUS.BAD_REQUEST;
      } else if (error.name === 'ConditionalCheckFailedException') {
        errorMessage = 'Resource conflict';
        statusCode = 409; 
      }

      return createErrorResponse(errorMessage, statusCode);
    }
  };
}

/**
 * Custom error class for application-specific errors
 */
export class ApplicationError extends Error {
  constructor(message, statusCode = 500, details = {}) {
    super(message);
    this.name = 'ApplicationError';
    this.statusCode = statusCode;
    this.details = details;
  }
}
