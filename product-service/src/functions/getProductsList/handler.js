import { getAllProducts, getAllStocks, joinProductsWithStocks } from '../../utils/db.js';
import { createSuccessResponse, HTTP_STATUS } from '../../utils/responseBuilder.js';
import { withErrorHandler } from '../../utils/errorHandler.js';
import { logRequest, logSuccess } from '../../utils/logger.js';

/**
 * Get Products List Handler
 * 
 * Retrieves all products from DynamoDB and joins them with stock data.
 * Returns a combined array of products with count information.
 * 
 * @param {Object} event - Lambda event object
 * @returns {Object} HTTP response with products array
 */
const handler = async (event) => {
  logRequest(event, 'getProductsList');

  const [products, stocks] = await Promise.all([
    getAllProducts(),
    getAllStocks(),
  ]);

  const productsWithStock = joinProductsWithStocks(products, stocks);

  logSuccess(HTTP_STATUS.OK, 'Products retrieved successfully', productsWithStock);

  return createSuccessResponse(productsWithStock, HTTP_STATUS.OK);
};

export const getProductsList = withErrorHandler(handler, 'getProductsList');