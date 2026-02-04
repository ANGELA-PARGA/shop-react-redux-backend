/**
 * Mock implementation of S3 utilities for testing
 * Simulates AWS S3 operations without making actual API calls
 */

export const mockSignedUrl = 'https://s3.amazonaws.com/test-bucket/uploaded/test.csv?X-Amz-Signature=mock';

export const getUploadSignedUrl = jest.fn(async (fileName) => {
  return mockSignedUrl;
});

export const getObjectStream = jest.fn(async (bucket, key) => {
  const { Readable } = await import('stream');
  const stream = new Readable();
  stream.push('title,description,price,count\n');
  stream.push('Test Product,Test Description,10.99,5\n');
  stream.push(null);
  return stream;
});

export const moveFile = jest.fn(async (bucket, sourceKey, destinationKey) => {
  return Promise.resolve();
});

export const moveFromUploadedToParsed = jest.fn(async (bucket, fileName) => {
  return Promise.resolve();
});

export const s3Client = {};
export const BUCKET_NAME = 'test-bucket';
export const UPLOADED_FOLDER = 'uploaded';
export const PARSED_FOLDER = 'parsed';
