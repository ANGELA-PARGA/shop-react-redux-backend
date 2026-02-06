/**
 * Input validation utilities for authorization functions
 * Provides validation functions for authentication tokens and credentials
 */

/**
 * Validates the format of the Authorization header
 * Checks that it starts with "Basic " and has a token
 * 
 * @param {string} authorizationHeader - The Authorization header value
 * @returns {Object} Validation result with isValid flag and errors array
 */
export function validateAuthorizationHeader(authorizationHeader) {
  const errors = [];

  if (!authorizationHeader || typeof authorizationHeader !== 'string') {
    errors.push('Authorization header is required');
    return { isValid: false, errors };
  }

  const trimmedHeader = authorizationHeader.trim();

  if (trimmedHeader.length === 0) {
    errors.push('Authorization header cannot be empty');
    return { isValid: false, errors };
  }

  if (!trimmedHeader.startsWith('Basic ')) {
    errors.push('Authorization header must start with "Basic "');
  }

  const token = trimmedHeader.substring(6); 

  if (!token || token.length === 0) {
    errors.push('Authorization token is missing');
  }

  return {
    isValid: errors.length === 0,
    errors,
    token: errors.length === 0 ? token : null,
  };
}

/**
 * Decodes and validates a Base64-encoded Basic Auth token
 * Expected format after decoding: "username:password"
 * 
 * @param {string} token - Base64-encoded token
 * @returns {Object} Decoded credentials with username and password, or errors
 */
export function decodeBasicAuthToken(token) {
  const errors = [];

  if (!token || typeof token !== 'string') {
    errors.push('Token is required');
    return { isValid: false, errors };
  }

  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');

    if (!decoded.includes(':')) {
      errors.push('Invalid token format. Expected "username:password"');
      return { isValid: false, errors };
    }

    const colonIndex = decoded.indexOf(':');
    const username = decoded.substring(0, colonIndex);
    const password = decoded.substring(colonIndex + 1);

    if (!username || username.length === 0) {
      errors.push('Username is missing in token');
    }

    if (!password || password.length === 0) {
      errors.push('Password is missing in token');
    }

    return {
      isValid: errors.length === 0,
      errors,
      username: errors.length === 0 ? username : null,
      password: errors.length === 0 ? password : null,
    };
  } catch (error) {
    errors.push('Invalid Base64 token encoding');
    return { isValid: false, errors };
  }
}

/**
 * Validates credentials against environment variables
 * Checks if the username exists as an environment variable
 * and if its value matches the provided password
 * 
 * @param {string} username - Username to validate
 * @param {string} password - Password to validate
 * @returns {Object} Validation result
 */
export function validateCredentials(username, password) {
  const errors = [];

  if (!username || !password) {
    errors.push('Username and password are required');
    return { isValid: false, errors };
  }

  const expectedPassword = process.env[username];

  if (!expectedPassword) {
    errors.push('Invalid credentials');
    return { isValid: false, errors };
  }

  if (expectedPassword !== password) {
    errors.push('Invalid credentials');
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
  };
}
