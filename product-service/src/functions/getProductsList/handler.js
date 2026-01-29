import { products } from '../../data/products.js';
import { createSuccessResponse, HTTP_STATUS } from '../../utils/responseBuilder.js';

export const getProductsList = async (event) => {
  return createSuccessResponse(products, HTTP_STATUS.OK);
};