/**
 * Input validation utilities for Lambda functions
 * Provides validation functions for file names and CSV data
 */

/**
 * Validates if a filename is safe for S3 operations
 * Checks for:
 * - .csv extension
 * - No path traversal attempts (../)
 * - No special characters that could cause issues
 * - Not empty
 * 
 * @param {string} fileName - The filename to validate
 * @returns {Object} Validation result with isValid flag and errors array
 * 
 */
export function validateFileName(fileName) {
  const errors = [];

  if (!fileName || typeof fileName !== 'string') {
    errors.push('Filename is required');
    return { isValid: false, errors };
  }

  const trimmedName = fileName.trim();

  if (trimmedName.length === 0) {
    errors.push('Filename cannot be empty');
    return { isValid: false, errors };
  }

  if (trimmedName.includes('..') || trimmedName.includes('/') || trimmedName.includes('\\')) {
    errors.push('Filename contains invalid path characters');
  }

  if (!trimmedName.toLowerCase().endsWith('.csv')) {
    errors.push('Filename must have .csv extension');
  }

  const invalidCharsRegex = /[<>:"|?*\x00-\x1f]/;
  if (invalidCharsRegex.test(trimmedName)) {
    errors.push('Filename contains invalid characters');
  }

  if (trimmedName.length > 255) {
    errors.push('Filename is too long (max 255 characters)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates if a value is a non-empty string
 * 
 * @param {*} value - The value to validate
 * @returns {boolean} True if non-empty string, false otherwise
 */
export function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validates a CSV record for product import
 * Expected fields: title, description, price, count
 * 
 * @param {Object} record - CSV record object
 * @param {number} rowNumber - Row number for error reporting
 * @returns {Object} Validation result with isValid flag and errors array
 */
export function validateProductRecord(record, rowNumber) {
  const errors = [];

  if (!isNonEmptyString(record.title)) {
    errors.push(`Row ${rowNumber}: Title is required`);
  }

  if (!record.price || isNaN(parseFloat(record.price)) || parseFloat(record.price) <= 0) {
    errors.push(`Row ${rowNumber}: Price must be a positive number`);
  }

  if (!record.count || isNaN(parseInt(record.count)) || parseInt(record.count) < 0) {
    errors.push(`Row ${rowNumber}: Count must be a non-negative number`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
