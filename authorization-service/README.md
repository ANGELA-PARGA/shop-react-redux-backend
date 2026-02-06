# Authorization Service

AWS Lambda-based authorization service for the shop backend application using the Serverless Framework.

## Overview

This service provides Basic Authentication for the Import Service API endpoints. It implements a Lambda authorizer that validates credentials and generates IAM policies for API Gateway access control.

## Features

- **Basic Authentication**: Token-based authentication using Base64-encoded credentials
- **Lambda Authorizer**: Custom authorizer for API Gateway integration
- **Secure Credentials**: Environment variables managed via `.env` file (not committed to git)
- **IAM Policy Generation**: Dynamic policy generation for Allow/Deny access

## Architecture

### Lambda Functions

#### `basicAuthorizer`
- **Purpose**: Validates Basic Auth tokens and generates IAM policies
- **Trigger**: API Gateway authorizer (not directly invoked)
- **Input**: Authorizer event with `authorizationToken` header
- **Output**: IAM policy document with Allow/Deny effect
- **Environment Variables**: Credentials loaded from `.env` file

### Authentication Flow

1. Client sends request with `Authorization: Basic <token>` header
2. API Gateway invokes `basicAuthorizer` lambda
3. Lambda decodes and validates credentials against environment variables
4. Lambda returns IAM policy (Allow or Deny)
5. API Gateway uses policy to allow/deny the request

### Status Codes

- **200**: Authorized - IAM policy with Allow effect
- **401**: Unauthorized - Missing or malformed Authorization header
- **403**: Forbidden - Invalid credentials (IAM policy with Deny effect)

## Setup

### Prerequisites

- Node.js 20.x
- AWS CLI configured with appropriate credentials
- Serverless Framework installed globally: `npm install -g serverless`

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Serverless plugin:
   ```bash
   npm install --save-dev serverless-dotenv-plugin
   ```

3. Create `.env` file (see Configuration section below)

### Configuration

Create a `.env` file in the root of the service:

```env
ANGELA_PARGA=TEST_PASSWORD
```

**Important**: 
- Never commit the `.env` file to git. Use `.env.example` as a template.
- Use underscores `_` not hyphens `-` in variable names (AWS Lambda requirement)

### Deployment

Deploy to AWS:

```bash
npm run deploy
```

Or deploy to specific stage:

```bash
npm run deploy:dev
npm run deploy:prod
```

### Testing

Run tests:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Usage

### Integration with Import Service

The `basicAuthorizer` is referenced in the Import Service's `serverless.yml`:

```yaml
functions:
  importProductsFile:
    handler: src/functions/importProductsFile/handler.importProductsFile
    events:
      - httpApi:
          method: get
          path: /import
          authorizer:
            name: basicAuthorizer
            type: request
            identitySource: $request.header.Authorization
            arn: ${cf:authorization-service-dev.BasicAuthorizerArn}
```

### Client-Side Implementation

Clients must include the Authorization header:

```javascript
const username = 'ANGELA_PARGA';
const password = 'TEST_PASSWORD';
const token = btoa(`${username}:${password}`);

fetch(apiUrl, {
  headers: {
    'Authorization': `Basic ${token}`
  }
});
```

Or retrieve from localStorage:

```javascript
const authToken = localStorage.getItem('authorization_token');

fetch(apiUrl, {
  headers: {
    'Authorization': `Basic ${authToken}`
  }
});
```

## Project Structure

```
authorization-service/
├── .env                          # Environment variables (not committed)
├── .env.example                  # Template for .env file
├── .gitignore                    # Git ignore rules
├── package.json                  # Dependencies and scripts
├── serverless.yml                # Serverless Framework configuration
├── jest.config.js                # Jest test configuration
├── README.md                     # This file
├── src/
│   ├── functions/
│   │   └── basicAuthorizer/
│   │       └── handler.js        # Main authorizer logic
│   └── utils/
│       ├── logger.js             # Logging utility
│       ├── validators.js         # Input validation
│       ├── policyBuilder.js      # IAM policy generation
│       └── errorHandler.js       # Error handling wrapper
└── __tests__/
    ├── basicAuthorizer.test.js   # Unit tests
    └── __mocks__/                # Jest mocks
```

## Security Considerations

- ✅ Credentials stored in environment variables (not in code)
- ✅ `.env` file excluded from git
- ✅ Basic Auth should only be used over HTTPS
- ✅ API Gateway handles HTTPS termination
- ✅ Least privilege IAM policies
- ⚠️ Consider rotating credentials periodically
- ⚠️ For production, consider using AWS Secrets Manager or Parameter Store

## Monitoring and Logs

View logs:

```bash
npm run logs:basicAuthorizer
```

Or use AWS CloudWatch console to view detailed logs.

## Troubleshooting

### 401 Unauthorized
- Check if Authorization header is present
- Verify header format: `Authorization: Basic <base64-token>`
- Ensure token is properly Base64-encoded

### 403 Forbidden
- Verify credentials match environment variables
- Check .env file is properly loaded
- Ensure username and password are correct

### Deployment Issues
- Verify AWS credentials are configured
- Check Serverless Framework version compatibility
- Ensure all dependencies are installed

## References

- [AWS Lambda Authorizers](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html)
- [Serverless Framework Documentation](https://www.serverless.com/framework/docs)
- [Basic Authentication RFC](https://tools.ietf.org/html/rfc7617)

## License

MIT
