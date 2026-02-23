// corn/cleanupDrafts.js
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import Post from "../models/post.js";
import Product from "../models/Product.js";

import { S3Client, DeleteObjectsCommand } from "@aws-sdk/client-s3"; // v3

const DRAFT_LIFETIME_DAYS = process.env.DRAFT_LIFETIME_DAYS ? Number(process.env.DRAFT_LIFETIME_DAYS) : 30;
const s3Bucket = process.env.S3_BUCKET;

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const cutoff = new Date(Date.now() - DRAFT_LIFETIME_DAYS * 24 * 60 * 60 * 1000);

    // Find drafts older than cutoff
    const oldPostDrafts = await Post.find({ status: "draft", updatedAt: { $lt: cutoff } });
    const oldProductDrafts = await Product.find({ status: "draft", updatedAt: { $lt: cutoff } });

    const keysToDelete = [];

    const collectKeys = (doc) => {
      (doc.media || []).forEach((m) => {
        if (m.key) keysToDelete.push({ Key: m.key });
      });
    };

    oldPostDrafts.forEach(collectKeys);
    oldProductDrafts.forEach(collectKeys);

    // Delete drafts
    await Post.deleteMany({ _id: { $in: oldPostDrafts.map((d) => d._id) } });
    await Product.deleteMany({ _id: { $in: oldProductDrafts.map((d) => d._id) } });

    if (keysToDelete.length && s3Bucket) {
      // delete in batches of 1000
      const batchSize = 1000;
      for (let i = 0; i < keysToDelete.length; i += batchSize) {
        const batch = keysToDelete.slice(i, i + batchSize);
        const cmd = new DeleteObjectsCommand({ Bucket: s3Bucket, Delete: { Objects: batch } });
        const out = await s3Client.send(cmd);
        console.log("S3 delete result", out);
      }
    }

    console.log(`cleanup complete. Deleted ${oldPostDrafts.length} post drafts and ${oldProductDrafts.length} product drafts.`);
    process.exit(0);
  } catch (err) {
    console.error("cleanup error", err);
    process.exit(1);
  }
}

cleanup();