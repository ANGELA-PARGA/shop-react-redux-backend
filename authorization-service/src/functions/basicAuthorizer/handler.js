/**
 * Basic Authorizer Lambda Function
 * 
 * Validates Basic Authentication tokens for API Gateway requests.
 * Returns IAM policy documents to allow or deny access to API resources.
 * 
 * Flow:
 * 1. Extract Authorization header from event
 * 2. Validate header format (must be "Basic <token>")
 * 3. Decode Base64 token to get username:password
 * 4. Validate credentials against environment variables
 * 5. Generate and return IAM policy (Allow or Deny)
 * 
 * Status Codes:
 * - 401 Unauthorized: Missing or malformed Authorization header
 * - 403 Forbidden: Invalid credentials (returns Deny policy)
 * - 200 OK: Valid credentials (returns Allow policy)
 */

import { logRequest, logSuccess, logWarning, logError } from '../../utils/logger.js';
import { 
  validateAuthorizationHeader, 
  decodeBasicAuthToken, 
  validateCredentials 
} from '../../utils/validators.js';
import { 
  generateAllowPolicy, 
  generateDenyPolicy 
} from '../../utils/policyBuilder.js';

/**
 * Main handler function for Basic Authentication
 * 
 * @param {Object} event - API Gateway Lambda Authorizer event
 * @param {string} event.type - The authorizer type (TOKEN or REQUEST)
 * @param {string} event.authorizationToken - The Authorization header value
 * @param {string} event.methodArn - The ARN of the API Gateway method being called
 * @returns {Object} IAM policy document
 * @throws {Error} Throws "Unauthorized" for 401 errors
 */
const handler = async (event) => {
  logRequest(event, 'basicAuthorizer');

  const { authorizationToken, methodArn } = event;

  try {
    const headerValidation = validateAuthorizationHeader(authorizationToken);
    
    if (!headerValidation.isValid) {
      logWarning('Invalid authorization header', { 
        errors: headerValidation.errors 
      });
      throw new Error('Unauthorized');
    }

    const tokenDecoding = decodeBasicAuthToken(headerValidation.token);
    
    if (!tokenDecoding.isValid) {
      logWarning('Failed to decode token', { 
        errors: tokenDecoding.errors 
      });
      throw new Error('Unauthorized');
    }

    const { username, password } = tokenDecoding;

    const credentialsValidation = validateCredentials(username, password);

    if (!credentialsValidation.isValid) {
      logWarning('Invalid credentials provided', { 
        username,
        errors: credentialsValidation.errors 
      });

      const denyPolicy = generateDenyPolicy(username, methodArn);
      
      logWarning('Access denied - invalid credentials', { username });
      
      return denyPolicy;
    }

    const allowPolicy = generateAllowPolicy(username, methodArn);

    logSuccess(200, 'Access granted', { username });

    return allowPolicy;

  } catch (error) {
    if (error.message === 'Unauthorized') {
      logError(error, 'basicAuthorizer', {
        methodArn,
        reason: 'Missing or malformed authorization header'
      });
      throw new Error('Unauthorized'); 
    }

    logError(error, 'basicAuthorizer', {
      methodArn,
      errorName: error.name,
      errorMessage: error.message
    });
    throw new Error('Unauthorized');
  }
};

export const basicAuthorizer = handler;
