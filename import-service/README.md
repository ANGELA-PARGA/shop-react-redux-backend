# Import Service

AWS Lambda-based serverless service for importing product data via CSV files uploaded to S3.

## Overview

This service handles CSV file uploads and processing for the shop application. It provides:
- Pre-signed URL generation for secure S3 uploads
- Automatic CSV parsing when files are uploaded
- File organization (uploaded → parsed folders)
- CloudWatch logging for monitoring

## Architecture

### Lambda Functions

#### 1. `importProductsFile` (HTTP GET /import)
Generates pre-signed URLs for CSV file uploads to S3.

**Endpoint**: `GET /import?name={fileName}`

**Request**:
```
GET /import?name=products.csv
```

**Response**:
```json
{
  "url": "https://s3.amazonaws.com/bucket/uploaded/products.csv?X-Amz-..."
}
```

**Features**:
- Validates filename (must be .csv, no path traversal)
- Generates signed URL valid for 5 minutes
- Returns URL for direct S3 upload from frontend

#### 2. `importFileParser` (S3 Trigger)
Automatically processes CSV files uploaded to S3.

**Trigger**: `s3:ObjectCreated:*` on `uploaded/*.csv`

**Process**:
1. Streams CSV file from S3
2. Parses each row using `csv-parser`
3. Validates product data
4. Logs records to CloudWatch
5. Moves file from `uploaded/` to `parsed/`

**CSV Format**:
```csv
title,description,price,count
Product Name,Product Description,10.99,5
```

## Project Structure

```
import-service/
├── src/
│   ├── functions/
│   │   ├── importProductsFile/
│   │   │   └── handler.js          # Signed URL generation
│   │   └── importFileParser/
│   │       └── handler.js          # CSV parsing & processing
│   └── utils/
│       ├── s3.js                   # S3 operations
│       ├── responseBuilder.js      # HTTP response helpers
│       ├── errorHandler.js         # Error handling wrappers
│       ├── logger.js               # CloudWatch logging
│       └── validators.js           # Input validation
├── __tests__/
│   ├── importProductsFile.test.js  # Unit tests
│   └── __mocks__/
│       └── s3.js                   # S3 mocks for testing
├── serverless.yml                  # Infrastructure configuration
├── package.json                    # Dependencies
└── jest.config.js                  # Test configuration
```

## Setup

### Prerequisites
- Node.js 20.x
- AWS CLI configured
- Serverless Framework
- S3 bucket created with `uploaded/` and `parsed/` folders

### Installation

```bash
npm install
```

### Dependencies
- `@aws-sdk/client-s3` - AWS S3 client (v3)
- `@aws-sdk/s3-request-presigner` - Generate signed URLs
- `csv-parser` - Stream-based CSV parsing

### Environment Variables

Configured in `serverless.yml`:

```yaml
BUCKET_NAME: angela-shop-upload-2026
SIGNED_URL_EXPIRATION: 300 
UPLOADED_FOLDER: uploaded
PARSED_FOLDER: parsed
```

## Deployment

### Deploy to AWS

```bash
# Deploy to dev stage
npm run deploy:dev

# Deploy to production
npm run deploy:prod

# Remove service
npm run remove
```

### Post-Deployment

After deployment, you'll get API endpoints:
```
GET - https://{api-id}.execute-api.us-east-1.amazonaws.com/import
```

Update your frontend API configuration with this endpoint.

## Testing

### Run Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Coverage
- Target: 90% coverage (branches, functions, lines, statements)
- Current: 12 test cases for `importProductsFile`


## License

MIT
