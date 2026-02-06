import { 
  createSuccessResponse, 
  HTTP_STATUS 
} from '../../utils/responseBuilder.js';
import { withErrorHandler } from '../../utils/errorHandler.js';
import { logRequest, logSuccess } from '../../utils/logger.js';
import { createProductWithStock } from '../../utils/productCreator.js';

/**
 * Create Product Handler
 * 
 * Creates a new product in DynamoDB with stock information.
 * 
 * @param {Object} event - Lambda event object
 * @returns {Object} HTTP response with created product or error
 */
const handler = async (event) => {
  logRequest(event, 'createProduct');

  const productData = JSON.parse(event.body || '{}');

  const product = await createProductWithStock(productData);

  logSuccess(HTTP_STATUS.CREATED, 'Product created successfully', { productId: product.id });

  const { count, ...productWithoutStock } = product;
  return createSuccessResponse(productWithoutStock, HTTP_STATUS.CREATED);
};

export const createProduct = withErrorHandler(handler, 'createProduct');