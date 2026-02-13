// config/s3Presigner.js
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

const REGION = process.env.AWS_REGION || "ap-south-1";
const BUCKET = process.env.S3_BUCKET;
const UPLOAD_FOLDER = process.env.S3_UPLOAD_FOLDER || "posts";

const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Generate a presigned PUT URL for a file
 * @param {Object} options { fileName, contentType, expiresInSeconds }
 * @returns { signedUrl, key, publicUrl }
 */
export const generatePresignedUpload = async ({
  fileName,
  contentType,
  folder = "posts", // 👈 default
  expiresInSeconds = 600
}) => {
  if (!fileName || !contentType) {
    throw new Error("fileName and contentType required");
  }

  const key = `${folder}/${Date.now()}-${uuidv4()}-${fileName.replace(/\s+/g, "-")}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const signedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: expiresInSeconds,
  });

  const publicUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;

  return { signedUrl, key, publicUrl, expiresInSeconds };
};

/** Delete object by key */
export const deleteObjectByKey = async (key) => {
  if (!key) return;
  const command = new DeleteObjectCommand({ Bucket: BUCKET, Key: key });
  return s3Client.send(command);
};

/**
 * Try to derive S3 key from a public S3 url
 * Example: https://bucket.s3.region.amazonaws.com/posts/1234-xxx.jpg -> posts/1234-xxx.jpg
 */
export const getS3KeyFromUrl = (url) => {
  try {
    const u = new URL(url);
    // pathname begins with '/'
    return decodeURIComponent(u.pathname.replace(/^\//, ""));
  } catch (e) {
    return null;
  }
};
