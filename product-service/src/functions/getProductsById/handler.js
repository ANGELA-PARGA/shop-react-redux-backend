import { getProduct, getStock, joinProductWithStock } from '../../utils/db.js';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  HTTP_STATUS 
} from '../../utils/responseBuilder.js';
import { isValidUUID } from '../../utils/validators.js';
import { withErrorHandler } from '../../utils/errorHandler.js';
import { logRequest, logSuccess, logWarning } from '../../utils/logger.js';

/**
 * Get Product By ID Handler
 * 
 * Retrieves a single product from DynamoDB by ID and joins it with stock data.
 * Returns the combined product object with count information.
 * 
 * @param {Object} event - Lambda event object
 * @returns {Object} HTTP response with product object or error
 */
const handler = async (event) => {
  logRequest(event, 'getProductsById');

  const { productId } = event.pathParameters;
  
  if (!isValidUUID(productId)) {
    logWarning('Invalid UUID format provided', { productId });
    return createErrorResponse(
      'Invalid product ID format. Expected UUID.',
      HTTP_STATUS.BAD_REQUEST
    );
  }
  
  const [product, stock] = await Promise.all([
    getProduct(productId),
    getStock(productId),
  ]);
  
  if (!product) {
    logWarning('Product not found', { productId });
    return createErrorResponse(
      'Product not found',
      HTTP_STATUS.NOT_FOUND
    );
  }
  
  const productWithStock = joinProductWithStock(product, stock);

  logSuccess(HTTP_STATUS.OK, 'Product retrieved successfully', { productId });
  
  return createSuccessResponse(productWithStock, HTTP_STATUS.OK);
};

export const getProductsById = withErrorHandler(handler, 'getProductsById');