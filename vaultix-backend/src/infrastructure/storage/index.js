const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const config = require('../../config');

const s3Client = new S3Client({
  region: config.r2.region,
  endpoint: config.r2.endpoint,
  credentials: {
    accessKeyId: config.r2.accessKeyId,
    secretAccessKey: config.r2.secretAccessKey,
  },
});

const generatePresignedUploadUrl = async (storageKey, fileType, expiresIn = 18000) => {
  const command = new PutObjectCommand({
    Bucket: config.r2.bucketName,
    Key: storageKey,
    ContentType: fileType,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn });
  return url;
};

module.exports = { s3Client, generatePresignedUploadUrl };