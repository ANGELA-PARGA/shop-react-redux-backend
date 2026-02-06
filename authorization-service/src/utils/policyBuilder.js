/**
 * IAM Policy Builder Utility
 * Generates IAM policy documents for API Gateway Lambda authorizers.
 * These policies control access to API Gateway resources.
 */

/**
 * Generates an IAM policy document for API Gateway
 * 
 * @param {string} principalId - The principal user identifier (username)
 * @param {string} effect - The policy effect: 'Allow' or 'Deny'
 * @param {string} resource - The ARN of the API Gateway resource (methodArn)
 * @param {Object} context - Optional context data to pass to the Lambda function
 * @returns {Object} IAM policy document formatted for API Gateway
 * 
 * @example
 * generatePolicy('user123', 'Allow', 'arn:aws:execute-api:us-east-1:123456789012:abcdef/dev/GET/import')
 * // Returns:
 * // {
 * //   principalId: 'user123',
 * //   policyDocument: {
 * //     Version: '2012-10-17',
 * //     Statement: [{
 * //       Action: 'execute-api:Invoke',
 * //       Effect: 'Allow',
 * //       Resource: 'arn:aws:execute-api:...'
 * //     }]
 * //   }
 * // }
 */
export function generatePolicy(principalId, effect, resource, context = {}) {
  const authResponse = {
    principalId,
  };

  if (effect && resource) {
    const policyDocument = {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource,
        },
      ],
    };
    authResponse.policyDocument = policyDocument;
  }

  if (Object.keys(context).length > 0) {
    authResponse.context = context;
  }

  return authResponse;
}

/**
 * Generates an Allow policy for a specific user
 * 
 * @param {string} username - The authenticated username
 * @param {string} resource - The ARN of the API Gateway resource
 * @returns {Object} IAM policy document with Allow effect
 */
export function generateAllowPolicy(username, resource) {
  return generatePolicy(username, 'Allow', resource, {
    username,
    authenticated: 'true',
  });
}

/**
 * Generates a Deny policy for an unauthorized user
 * 
 * @param {string} username - The username (if available)
 * @param {string} resource - The ARN of the API Gateway resource
 * @returns {Object} IAM policy document with Deny effect
 */
export function generateDenyPolicy(username, resource) {
  return generatePolicy(username || 'unauthorized', 'Deny', resource, {
    authenticated: 'false',
  });
}

/**
 * Generates a wildcard resource ARN for the policy
 * This allows/denies access to all methods in the same API
 * 
 * @param {string} methodArn - The specific method ARN from the event
 * @returns {string} Wildcard ARN
 * 
 * @example
 * generateWildcardResource('arn:aws:execute-api:us-east-1:123456789012:abcdef/dev/GET/import')
 * // Returns: 'arn:aws:execute-api:us-east-1:123456789012:abcdef/dev/*\/*'
 */
export function generateWildcardResource(methodArn) {
  const arnParts = methodArn.split('/');
  const apiGatewayArnPart = arnParts.slice(0, 2).join('/');
  
  return `${apiGatewayArnPart}/*/*`;
}
