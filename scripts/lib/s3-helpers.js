import fs from 'fs';
import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutBucketCorsCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  PutPublicAccessBlockCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

export const DEFAULT_REGION = process.env.AWS_REGION || 'us-east-1';
export const DEFAULT_SECONDARY_BUCKET = process.env.AWS_S3_BUCKET || 'mixfade-releases';

export function createS3Client({ region = DEFAULT_REGION } = {}) {
  return new S3Client({
    region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

export async function uploadFileToS3({
  s3,
  bucket,
  key,
  filePath,
  contentType,
  contentDisposition,
  metadata,
  onProgress,
}) {
  const upload = new Upload({
    client: s3,
    params: {
      Bucket: bucket,
      Key: key,
      Body: fs.createReadStream(filePath),
      ContentType: contentType,
      ContentDisposition: contentDisposition,
      Metadata: metadata,
    },
  });

  if (onProgress) {
    upload.on('httpUploadProgress', onProgress);
  }

  return upload.done();
}

export async function putJsonToS3({ s3, bucket, key, body }) {
  return s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: JSON.stringify(body, null, 2),
      ContentType: 'application/json',
    })
  );
}

export async function putHtmlToS3({ s3, bucket, key, body }) {
  return s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: 'text/html',
    })
  );
}

export function objectUrlFor({ bucket, key }) {
  return `https://${bucket}.s3.amazonaws.com/${key}`;
}

async function streamToBuffer(stream) {
  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

function toLegacyError(error) {
  if (error?.$metadata?.httpStatusCode) {
    error.statusCode = error.$metadata.httpStatusCode;
  }

  if (error?.name && !error.code) {
    error.code = error.name;
  }

  return error;
}

function promiseCommand(s3, command) {
  return {
    async promise() {
      try {
        return await s3.send(command);
      } catch (error) {
        throw toLegacyError(error);
      }
    },
  };
}

export function createLegacyS3Compat(s3 = createS3Client()) {
  return {
    upload(params) {
      const upload = new Upload({
        client: s3,
        params,
      });

      return {
        on(eventName, listener) {
          upload.on(eventName, listener);
          return this;
        },
        async promise() {
          try {
            return await upload.done();
          } catch (error) {
            throw toLegacyError(error);
          }
        },
      };
    },
    async getObjectResult(params) {
      try {
        const result = await s3.send(new GetObjectCommand(params));
        return {
          ...result,
          Body: result.Body ? await streamToBuffer(result.Body) : Buffer.alloc(0),
        };
      } catch (error) {
        throw toLegacyError(error);
      }
    },
    getObject(params) {
      return {
        promise: () => this.getObjectResult(params),
      };
    },
    headBucket(params) {
      return promiseCommand(s3, new HeadBucketCommand(params));
    },
    createBucket(params) {
      return promiseCommand(s3, new CreateBucketCommand(params));
    },
    putBucketPolicy(params) {
      return promiseCommand(s3, new PutBucketPolicyCommand(params));
    },
    putPublicAccessBlock(params) {
      return promiseCommand(s3, new PutPublicAccessBlockCommand(params));
    },
    putBucketCors(params) {
      return promiseCommand(s3, new PutBucketCorsCommand(params));
    },
    putObject(params) {
      return promiseCommand(s3, new PutObjectCommand(params));
    },
  };
}
