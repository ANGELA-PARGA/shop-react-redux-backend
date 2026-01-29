import { products } from '../../data/products.js';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  HTTP_STATUS 
} from '../../utils/responseBuilder.js';
import { isValidUUID } from '../../utils/validators.js';

export const getProductsById = async (event) => {
  const { productId } = event.pathParameters;
  
  if (!isValidUUID(productId)) {
    return createErrorResponse(
      'Invalid product ID format. Expected UUID.',
      HTTP_STATUS.BAD_REQUEST
    );
  }
  
  const product = products.find(p => p.id.toLowerCase() === productId.toLowerCase());
  
  if (!product) {
    return createErrorResponse(
      'Product not found',
      HTTP_STATUS.NOT_FOUND
    );
  }
  
  return createSuccessResponse(product, HTTP_STATUS.OK);
};