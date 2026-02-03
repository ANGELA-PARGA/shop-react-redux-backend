import { randomUUID } from 'crypto';
import { createProductTransaction } from '../../utils/db.js';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  HTTP_STATUS 
} from '../../utils/responseBuilder.js';
import { validateProductBody } from '../../utils/validators.js';
import { withErrorHandler } from '../../utils/errorHandler.js';
import { logRequest, logSuccess, logWarning } from '../../utils/logger.js';

/**
 * Create Product Handler
 * 
 * Creates a new product in DynamoDB with stock information.
 * Uses transaction.
 * 
 * @param {Object} event - Lambda event object
 * @returns {Object} HTTP response with created product or error
 */
const handler = async (event) => {
  logRequest(event, 'createProduct');

  let productData;
  try {
    productData = JSON.parse(event.body || '{}');
  } catch (parseError) {
    logWarning('Invalid JSON in request body', { error: parseError.message });
    return createErrorResponse(
      'Invalid JSON in request body',
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const validation = validateProductBody(productData);
  if (!validation.isValid) {
    logWarning('Product validation failed', { errors: validation.errors });
    return createErrorResponse(
      `Invalid product data: ${validation.errors.join(', ')}`,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const productId = randomUUID();

  const product = {
    id: productId,
    title: productData.title.trim(),
    description: productData.description?.trim() || '',
    price: productData.price,
  };

  const stock = {
    product_id: productId,
    count: productData.count,
  };

  await createProductTransaction(product, stock);

  logSuccess(HTTP_STATUS.CREATED, 'Product created successfully', { productId });


  return createSuccessResponse(product, HTTP_STATUS.CREATED);
};

export const createProduct = withErrorHandler(handler, 'createProduct');