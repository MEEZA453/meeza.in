// services/s3Client.js
import { S3Client, PutObjectCommand, CopyObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";
const REGION = process.env.AWS_REGION;
const BUCKET = process.env.S3_BUCKET;

if (!REGION || !BUCKET) {
  throw new Error("AWS_REGION and S3_BUCKET env vars required");
}

export const s3 = new S3Client({
  region: REGION,
});

export async function generatePresignedUpload({ key, contentType, expires = 600 }) {
  const cmd = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
    ACL: "private",
  });
  const url = await getSignedUrl(s3, cmd, { expiresIn: expires });
  return { url, key };
}

export async function generatePresignedDownload({ key, expires = 300 }) {
  const cmd = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  const url = await getSignedUrl(s3, cmd, { expiresIn: expires });
  return url;
}

export async function copyObject({ sourceKey, destKey }) {
  // source must be /{bucket}/{key}, but CopyObject expects "bucket/key" as CopySource
  const copySource = `/${BUCKET}/${sourceKey}`;
  const cmd = new CopyObjectCommand({
    Bucket: BUCKET,
    CopySource: copySource,
    Key: destKey,
    ACL: "private",
  });
  return s3.send(cmd);
}

export async function deleteObject({ key }) {
  const cmd = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  return s3.send(cmd);
}

export async function headObject({ key }) {
  const cmd = new HeadObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  return s3.send(cmd);
}
