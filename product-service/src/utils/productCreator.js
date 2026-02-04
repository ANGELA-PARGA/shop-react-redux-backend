/**
 * Product Creator Utility
 * 
 * Shared business logic for creating products.
 * Used by both HTTP handler (createProduct) and SQS handler (catalogBatchProcess).
 */

import { randomUUID } from 'crypto';
import { createProductTransaction } from './db.js';
import { validateProductBody } from './validators.js';
import { logWarning } from './logger.js';

/**
 * Create a product with stock in DynamoDB
 * Validates data and creates product in transaction.
 * 
 * @param {Object} productData - Product data to create
 * @param {string} productData.title - Product title (required)
 * @param {string} productData.description - Product description (required)
 * @param {number} productData.price - Product price (required)
 * @param {number} productData.count - Stock count (required)
 * @returns {Promise<Object>} Created product with stock
 * @throws {ValidationError} If validation fails
 * @throws {Error} If transaction fails
 */
export async function createProductWithStock(productData) {
  const validation = validateProductBody(productData);
  if (!validation.isValid) {
    logWarning('Product validation failed', { errors: validation.errors });
    const error = new Error(`Invalid product data: ${validation.errors.join(', ')}`);
    error.name = 'ValidationError';
    throw error;
  }

  const productId = randomUUID();

  const product = {
    id: productId,
    title: productData.title.trim(),
    description: productData.description.trim(),
    price: productData.price,
  };

  const stock = {
    product_id: productId,
    count: productData.count,
  };

  await createProductTransaction(product, stock);

  return {
    ...product,
    count: stock.count
  };
}
