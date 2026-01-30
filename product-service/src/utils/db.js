/**
 * DynamoDB Client Configuration and Helper Functions
 * 
 * This module provides a configured DynamoDB client and helper functions
 * for common database operations used across Lambda functions.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, ScanCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';

// Get configuration from environment variables
const REGION = process.env.AWS_REGION || process.env.REGION || 'us-east-1';
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || 'products';
const STOCKS_TABLE = process.env.STOCKS_TABLE || 'stock';

// Initialize DynamoDB client
const client = new DynamoDBClient({ region: REGION });

// Create DocumentClient with marshalling options
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

/**
 * Get a single product by ID from products table
 * 
 * @param {string} productId - Product UUID
 * @returns {Promise<Object|null>} Product object or null if not found
 */
export async function getProduct(productId) {
  const params = {
    TableName: PRODUCTS_TABLE,
    Key: { id: productId },
  };

  const result = await docClient.send(new GetCommand(params));
  return result.Item || null;
}

/**
 * Get stock information for a product by product_id
 * 
 * @param {string} productId - Product UUID
 * @returns {Promise<Object|null>} Stock object or null if not found
 */
export async function getStock(productId) {
  const params = {
    TableName: STOCKS_TABLE,
    Key: { product_id: productId },
  };

  const result = await docClient.send(new GetCommand(params));
  return result.Item || null;
}

/**
 * Get all products from products table
 * 
 * @returns {Promise<Array>} Array of product objects
 */
export async function getAllProducts() {
  const params = {
    TableName: PRODUCTS_TABLE,
  };

  const result = await docClient.send(new ScanCommand(params));
  return result.Items || [];
}

/**
 * Get all stocks from stocks table
 * 
 * @returns {Promise<Array>} Array of stock objects
 */
export async function getAllStocks() {
  const params = {
    TableName: STOCKS_TABLE,
  };

  const result = await docClient.send(new ScanCommand(params));
  return result.Items || [];
}

/**
 * Join product and stock data
 * Combines product data with its corresponding stock count
 * 
 * @param {Object} product - Product object
 * @param {Object|null} stock - Stock object (can be null if no stock found)
 * @returns {Object} Joined product with count field
 */
export function joinProductWithStock(product, stock) {
  return {
    ...product,
    count: stock ? stock.count : 0
  };
}

/**
 * Join multiple products with their stocks
 * Maps through products and finds matching stock for each
 * 
 * @param {Array} products - Array of product objects
 * @param {Array} stocks - Array of stock objects
 * @returns {Array} Array of joined product objects with count
 */
export function joinProductsWithStocks(products, stocks) {
  const stockMap = new Map(
    stocks.map(stock => [stock.product_id, stock])
  );

  return products.map(product => {
    const stock = stockMap.get(product.id);
    return joinProductWithStock(product, stock);
  });
}

/**
 * Create product and stock in a transaction
 * @param {Object} product - Product data with id, title, description, price, count
 * @param {Object} stock - Stock data with product_id, count
 * @returns {Promise<void>}
 */
export const createProductTransaction = async (product, stock) => {
   const params = {
    TransactItems: [
      {
        Put: {
          TableName: PRODUCTS_TABLE,
          Item: product,
          ConditionExpression: 'attribute_not_exists(id)',
        }
      },
      {
        Put: {
          TableName: STOCKS_TABLE,
          Item: stock,
        }
      }
    ]
  }

  const result = await docClient.send(new TransactWriteCommand(params));
  return result

};


export { docClient, PRODUCTS_TABLE, STOCKS_TABLE };
