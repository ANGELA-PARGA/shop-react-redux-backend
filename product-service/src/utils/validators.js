/**
 * Input validation utilities for Lambda functions
 * Provides validation functions for common data types and formats
 */

/**
 * UUID v4 regex pattern
 * Matches standard UUID format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates if a string is a valid UUID v4 format
 * 
 * @param {string} uuid - The string to validate
 * @returns {boolean} True if valid UUID v4, false otherwise
 * 
 */
export const isValidUUID = (uuid) => {
  if (!uuid || typeof uuid !== 'string') {
    return false;
  }
  return UUID_V4_REGEX.test(uuid);
};

/**
 * Validates if a value is a non-empty string
 * 
 * @param {*} value - The value to validate
 * @returns {boolean} True if non-empty string, false otherwise
 */
export const isNonEmptyString = (value) => {
  return typeof value === 'string' && value.trim().length > 0;
};

/**
 * Validates if a value is a positive number
 * 
 * @param {*} value - The value to validate
 * @returns {boolean} True if positive number, false otherwise
 */
export const isPositiveNumber = (value) => {
  return typeof value === 'number' && value > 0 && !isNaN(value);
};

/**
 * Validates a product object structure * 
 * @param {Object} product - The product object to validate
 * @returns {Object} Validation result with isValid flag and errors array
 * 
 */
export const validateProduct = (product) => {
  const errors = [];
  
  if (!product || typeof product !== 'object') {
    return { isValid: false, errors: ['Product must be an object'] };
  }
  
  if (!isValidUUID(product.id)) {
    errors.push('Product ID must be a valid UUID');
  }
  
  if (!isNonEmptyString(product.title)) {
    errors.push('Product title must be a non-empty string');
  }
  
  if (!isNonEmptyString(product.description)) {
    errors.push('Product description must be a non-empty string');
  }
  
  if (!isPositiveNumber(product.price)) {
    errors.push('Product price must be a positive number');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateProductBody = (data) => {
  const errors = [];

  if (!data.title || typeof data.title !== 'string' || !data.title.trim()) {
    errors.push('title is required and must be a string');
  } else if (data.title.trim().length === 0) {
    errors.push('title cannot be empty');
  } else if (data.title.length > 255) {
    errors.push('title must be less than 255 characters');
  }

  if (!data.description || typeof data.description !== 'string' || !data.description.trim()) {
    errors.push('description is required and must be a string');
  } else if (data.description.trim().length === 0) {
    errors.push('description cannot be empty');
  } else if (data.description.length > 1000) {
    errors.push('description must be less than 1000 characters');
  }

  if (data.price === undefined || data.price === null) {
    errors.push('price is required');
  } else if (typeof data.price !== 'number') {
    errors.push('price must be a number');
  } else if (data.price <= 0) {
    errors.push('price must be greater than 0');
  } else if (!Number.isFinite(data.price)) {
    errors.push('price must be a finite number');
  }

  if (data.count === undefined || data.count === null) {
    errors.push('count is required');
  } else if (typeof data.count !== 'number') {
    errors.push('count must be a number');
  } else if (!Number.isInteger(data.count)) {
    errors.push('count must be an integer');
  } else if (data.count < 0) {
    errors.push('count must be non-negative');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};