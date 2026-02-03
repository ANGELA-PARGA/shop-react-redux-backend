/**
 * S3 Utilities
 * 
 */

import { S3Client, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const REGION = process.env.AWS_REGION || 'us-east-1';
const BUCKET_NAME = process.env.BUCKET_NAME;
const SIGNED_URL_EXPIRATION = parseInt(process.env.SIGNED_URL_EXPIRATION || '300', 10);
const UPLOADED_FOLDER = process.env.UPLOADED_FOLDER || 'uploaded';
const PARSED_FOLDER = process.env.PARSED_FOLDER || 'parsed';

const s3Client = new S3Client({ region: REGION });

/**
 * Generates a pre-signed URL for uploading a file to S3
 * 
 * @param {string} fileName - Name of the file to upload
 * @returns {Promise<string>} Pre-signed URL for PUT operation
 * 
 */
export async function getUploadSignedUrl(fileName) {
  const key = `${UPLOADED_FOLDER}/${fileName}`;
  
  const putCommand = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: 'text/csv',
  });

  const signedUrl = await getSignedUrl(s3Client, putCommand, {
    expiresIn: SIGNED_URL_EXPIRATION,
  });

  return signedUrl;
}

/**
 * Creates a readable stream from an S3 object
 * 
 * @param {string} bucket - S3 bucket name
 * @param {string} key - S3 object key
 * @returns {Promise<ReadableStream>} Readable stream of the S3 object
 * 
 * @example
 * const stream = await getObjectStream('my-bucket', 'uploaded/products.csv');
 * stream.pipe(csvParser()).on('data', (row) => console.log(row));
 */
export async function getObjectStream(bucket, key) {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const response = await s3Client.send(command);
  
  // response.Body is a readable stream in AWS SDK v3
  return response.Body;
}

/**
 * Moves a file from one location to another within the same S3 bucket
 * This is done by copying the file and then deleting the original
 * 
 * @param {string} bucket - S3 bucket name
 * @param {string} sourceKey - Source object key
 * @param {string} destinationKey - Destination object key
 * @returns {Promise<void>}
 * 
 * @example
 * await moveFile('my-bucket', 'uploaded/products.csv', 'parsed/products.csv');
 */
export async function moveFile(bucket, sourceKey, destinationKey) {
  const copyCommand = new CopyObjectCommand({
    Bucket: bucket,
    CopySource: `${bucket}/${sourceKey}`,
    Key: destinationKey,
  });

  await s3Client.send(copyCommand);

  const deleteCommand = new DeleteObjectCommand({
    Bucket: bucket,
    Key: sourceKey,
  });

  await s3Client.send(deleteCommand);
}

/**
 * Moves a file from uploaded folder to parsed folder
 * 
 * @param {string} bucket - S3 bucket name
 * @param {string} fileName - File name (without folder prefix)
 * @returns {Promise<void>}
 * 
 * @example
 * await moveFromUploadedToParsed('my-bucket', 'products.csv');
 * // Moves 'uploaded/products.csv' to 'parsed/products.csv'
 */
export async function moveFromUploadedToParsed(bucket, fileName) {
  const sourceKey = `${UPLOADED_FOLDER}/${fileName}`;
  const destinationKey = `${PARSED_FOLDER}/${fileName}`;
  
  await moveFile(bucket, sourceKey, destinationKey);
}

export { s3Client, BUCKET_NAME, UPLOADED_FOLDER, PARSED_FOLDER };
