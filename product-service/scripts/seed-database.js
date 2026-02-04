/**
 * Database Seed Script
 * 
 * This script populates DynamoDB tables with test data.
 * It reads from mock product data and creates corresponding stock entries.
 * 
 * 
 * Usage: npm run seed
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchWriteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { products } from '../src/data/products.js';

const REGION = 'us-east-1';
const PRODUCTS_TABLE = 'products';
const STOCKS_TABLE = 'stock';
const FIXED_STOCK_COUNT = 10; 

const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

/**
 * Generates stock data from product data
 * Each product gets a corresponding stock entry with fixed count
 * 
 * @param {Array} products - Array of product objects
 * @returns {Array} Array of stock objects
 */
function generateStockData(products) {
  return products.map(product => ({
    product_id: product.id,
    count: FIXED_STOCK_COUNT
  }));
}

/**
 * Splits an array into chunks of specified size
 * DynamoDB BatchWriteItem has a limit of 25 items per request
 * 
 * @param {Array} array - Array to chunk
 * @param {Number} size - Chunk size (max 25 for DynamoDB)
 * @returns {Array} Array of chunks
 */
function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Seeds products table with batch write operations
 * Handles up to 25 items per batch as per DynamoDB limits
 * 
 * @param {Array} productData - Array of products to insert
 */
async function seedProducts(productData) {
  console.log(`\n📦 Seeding ${productData.length} products...`);
  
  const chunks = chunkArray(productData, 25);
  let totalInserted = 0;

  for (const chunk of chunks) {
    const putRequests = chunk.map(product => ({
      PutRequest: {
        Item: product
      }
    }));

    const params = {
      RequestItems: {
        [PRODUCTS_TABLE]: putRequests
      }
    };

    try {
      await docClient.send(new BatchWriteCommand(params));
      
      totalInserted += chunk.length;
      console.log(`   ✓ Inserted ${chunk.length} products (${totalInserted}/${productData.length})`);
    } catch (error) {
      console.error('❌ Error seeding products:', error.message);
      throw error;
    }
  }

  console.log(`✅ Successfully seeded ${totalInserted} products to '${PRODUCTS_TABLE}' table`);
}

/**
 * Seeds stocks table with batch write operations
 * 
 * @param {Array} stockData - Array of stock items to insert
 */
async function seedStocks(stockData) {
  console.log(`\n📊 Seeding ${stockData.length} stock entries...`);
  
  const chunks = chunkArray(stockData, 25);
  let totalInserted = 0;

  for (const chunk of chunks) {
    const putRequests = chunk.map(stock => ({
      PutRequest: {
        Item: stock
      }
    }));

    const params = {
      RequestItems: {
        [STOCKS_TABLE]: putRequests
      }
    };

    try {
      await docClient.send(new BatchWriteCommand(params));
      
      totalInserted += chunk.length;
      console.log(`   ✓ Inserted ${chunk.length} stock entries (${totalInserted}/${stockData.length})`);
    } catch (error) {
      console.error('❌ Error seeding stocks:', error.message);
      throw error;
    }
  }

  console.log(`✅ Successfully seeded ${totalInserted} stock entries to '${STOCKS_TABLE}' table`);
}

/**
 * Verifies data was inserted by counting items in tables
 */
async function verifyData() {
  console.log('\n🔍 Verifying inserted data...');
  
  try {
    const productsResult = await docClient.send(new ScanCommand({
      TableName: PRODUCTS_TABLE,
      Select: 'COUNT'
    }));
    
    const stocksResult = await docClient.send(new ScanCommand({
      TableName: STOCKS_TABLE,
      Select: 'COUNT'
    }));
    
    console.log(`   Products in database: ${productsResult.Count}`);
    console.log(`   Stocks in database: ${stocksResult.Count}`);
    
    if (productsResult.Count === products.length && stocksResult.Count === products.length) {
      console.log('✅ Verification passed - all data inserted correctly!');
    } else {
      console.warn('⚠️  Warning: Item counts do not match expected values');
    }
  } catch (error) {
    console.error('❌ Error verifying data:', error.message);
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('🌱 DATABASE SEED SCRIPT');
  console.log('═══════════════════════════════════════════════');
  console.log(`Region: ${REGION}`);
  console.log(`Products Table: ${PRODUCTS_TABLE}`);
  console.log(`Stocks Table: ${STOCKS_TABLE}`);
  console.log(`Fixed Stock Count: ${FIXED_STOCK_COUNT}`);
  console.log('═══════════════════════════════════════════════');

  try {
    // Generate stock data from products
    const stockData = generateStockData(products);
    
    // Seed products table
    await seedProducts(products);
    
    // Seed stocks table
    await seedStocks(stockData);
    
    // Verify insertion
    await verifyData();
    
    console.log('\n═══════════════════════════════════════════════');
    console.log('✨ Database seeding completed successfully!');
    console.log('═══════════════════════════════════════════════\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n═══════════════════════════════════════════════');
    console.error('❌ DATABASE SEEDING FAILED');
    console.error('═══════════════════════════════════════════════');
    console.error('Error:', error.message);
    
    if (error.name === 'ResourceNotFoundException') {
      console.error('\n💡 Solution: Make sure DynamoDB tables exist:');
      console.error('   1. Go to AWS Console → DynamoDB');
      console.error('   2. Verify tables "products" and "stocks" are created');
    } else if (error.name === 'CredentialsError' || error.name === 'ConfigError') {
      console.error('\n💡 Solution: Configure AWS credentials:');
      console.error('   Run: aws configure');
    } else {
      console.error('\n💡 Check AWS Console for more details');
    }
    
    console.error('═══════════════════════════════════════════════\n');
    process.exit(1);
  }
}

main();
