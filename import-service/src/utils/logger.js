/**
 * Logger Utility
 * 
 * Provides structured logging for Lambda functions.
 * All logs are sent to CloudWatch Logs for monitoring and debugging.
 */

/**
 * Log incoming request details
 * Helps with debugging and audit trail
 * 
 * @param {Object} event - Lambda event object
 * @param {string} functionName - Name of the Lambda function
 */
export function logRequest(event, functionName) {
  const logData = {
    timestamp: new Date().toISOString(),
    function: functionName,
    method: event.requestContext?.http?.method || event.httpMethod,
    path: event.requestContext?.http?.path || event.path,
    pathParameters: event.pathParameters,
    queryStringParameters: event.queryStringParameters,
    sourceIp: event.requestContext?.http?.sourceIp || event.requestContext?.identity?.sourceIp,
  };

  if (event.body && (logData.method === 'POST' || logData.method === 'PUT')) {
    logData.body = event.body;
  }

  console.log('[REQUEST]', JSON.stringify(logData));
}

/**
 * Log successful response
 * 
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 * @param {Object} data - Optional response data (will not log full body for large responses)
 */
export function logSuccess(statusCode, message, data = null) {
  const logData = {
    timestamp: new Date().toISOString(),
    level: 'INFO',
    statusCode,
    message,
  };

  if (data) {
    if (Array.isArray(data)) {
      logData.itemCount = data.length;
    } else {
      logData.data = data;
    }
  }

  console.log('[SUCCESS]', JSON.stringify(logData));
}

/**
 * Log error with details
 * 
 * @param {Error} error - Error object
 * @param {string} context - Context where error occurred
 * @param {Object} additionalInfo - Additional information for debugging
 */
export function logError(error, context, additionalInfo = {}) {
  const logData = {
    timestamp: new Date().toISOString(),
    level: 'ERROR',
    context,
    errorName: error.name,
    errorMessage: error.message,
    errorStack: error.stack,
    ...additionalInfo,
  };

  console.error('[ERROR]', JSON.stringify(logData));
}

/**
 * Log warning
 * 
 * @param {string} message - Warning message
 * @param {Object} details - Additional details
 */
export function logWarning(message, details = {}) {
  const logData = {
    timestamp: new Date().toISOString(),
    level: 'WARNING',
    message,
    ...details,
  };

  console.warn('[WARNING]', JSON.stringify(logData));
}
