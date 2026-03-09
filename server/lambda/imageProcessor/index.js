// lambda/imageProcessor/index.js
const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const { MongoClient, ObjectId } = require("mongodb");
const sharp = require("sharp");
const stream = require('stream');
const util = require('util');
const pipeline = util.promisify(stream.pipeline);

const REGION = process.env.AWS_REGION;
const BUCKET = process.env.S3_BUCKET;
const CLOUDFRONT = process.env.CLOUDFRONT_DOMAIN; // e.g. d111111abcdef8.cloudfront.net
const s3 = new S3Client({ region: REGION });

let mongoClient = null;
async function getMongo() {
  if (!mongoClient) {
    mongoClient = new MongoClient(process.env.MONGO_URI);
    await mongoClient.connect();
  }
  return mongoClient.db(); // default db from connection string
}

// Helper: download S3 object to Buffer
async function downloadToBuffer(key) {
  const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  const res = await s3.send(cmd);
  const chunks = [];
  for await (const chunk of res.Body) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function uploadBuffer(key, buffer, contentType) {
  const cmd = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: "private",
    CacheControl: "public, max-age=31536000, immutable"
  });
  return s3.send(cmd);
}

// Convert transform -> sharp crop region
function transformToCrop(transform, naturalW, naturalH) {
  // transform.cropW/H are editor-viewport pixels (e.g. 520)
  // transform.viewportSize is the viewport pixel size (e.g. 520)
  // transform.scale is zoom factor (scale <= 1?) (editor specific)
  // transform.x,y are offsets (probably pan offsets)
  //
  // Approach:
  // 1. Compute scaleRatio = naturalW / (viewport display width after scale)
  // 2. Map cropLeft/cropTop to natural pixels
  // 3. Apply clamping to ensure inside bounds
  const vpSize = transform.viewportSize || transform.cropW || 520;
  const cropW = transform.cropW;
  const cropH = transform.cropH;
  // compute scale as rendered image width / natural width
  // If transform.scale exists and is <1 means zoomed out; if >1 zoomed in. We assume transform.scale is ratio applied to image to fit viewport.
  // We'll compute effectiveScale = naturalW / (vpRenderedWidth)
  // But many frontends set scale such that image rendered size = natural * scale. If scale=0.48 (example), image is 0.48 * naturalW in viewport.
  const imageRenderedWidth = transform.naturalW * (transform.scale || 1);
  const ratio = naturalW / imageRenderedWidth; // how many natural pixels per rendered px
  const left = Math.round((transform.cropLeft - transform.x || transform.cropLeft) * ratio);
  const top  = Math.round((transform.cropTop - transform.y || transform.cropTop) * ratio);
  const width = Math.round(cropW * ratio);
  const height = Math.round(cropH * ratio);
  // clamp to bounds
  const clampedLeft = Math.max(0, Math.min(naturalW - 1, left));
  const clampedTop = Math.max(0, Math.min(naturalH - 1, top));
  const clampedWidth = Math.max(1, Math.min(naturalW - clampedLeft, width));
  const clampedHeight = Math.max(1, Math.min(naturalH - clampedTop, height));

  return { left: clampedLeft, top: clampedTop, width: clampedWidth, height: clampedHeight };
}

exports.handler = async (event) => {
  // SQS event wrapper: iterate records
  for (const rec of event.Records) {
    const s3Info = rec.s3;
    const bucket = s3Info.bucket.name;
    const key = decodeURIComponent(s3Info.object.key.replace(/\+/g, " "));
    console.log("Processing:", key);
    if (bucket !== BUCKET) {
      console.warn("Message for different bucket:", bucket);
      continue;
    }
    try {
      // Lookup post/media by key
      const db = await getMongo();
      const posts = db.collection("posts");
      // search for media entry with key
      const post = await posts.findOne({ "media.key": key }, { projection: { "media.$": 1, _id: 1 } });
      if (!post) {
        console.warn("No post/media found for key:", key);
        continue;
      }
      const media = post.media[0];
      if (!media || media.processingState === "processed") {
        console.info("Already processed or missing:", key);
        continue;
      }

      // Update processingState => processing (atomic)
      await posts.updateOne(
        { _id: post._id, "media.id": media.id, "media.processingState": { $ne: "processing" } },
        { $set: { "media.$.processingState": "processing" } }
      );

      // Download object
      const buffer = await downloadToBuffer(key);

      // Determine natural size (use transform.naturalW/H if present, else read via sharp metadata)
      const image = sharp(buffer);
      const meta = await image.metadata();
      const naturalW = media.transform?.naturalW || meta.width;
      const naturalH = media.transform?.naturalH || meta.height;

      const crop = transformToCrop(media.transform || {}, naturalW, naturalH);

      const sizes = [
        { name: "large", width: 1080 },
        { name: "medium", width: 720 },
        { name: "small", width: 400 }
      ];
      const processedKeys = {};

      // crop first, then resize to each size (preserve aspect by specifying width and letting height scale)
      let croppedBuffer = await image.extract({ left: crop.left, top: crop.top, width: crop.width, height: crop.height }).toBuffer();

      for (const s of sizes) {
        const out = await sharp(croppedBuffer)
          .resize({ width: s.width, withoutEnlargement: true })
          .jpeg({ quality: 82 })
          .toBuffer();

        const outKey = `posts/processed/${post._id.toString()}/${media.id}/${s.name}.jpg`;
        await uploadBuffer(outKey, out, "image/jpeg");

        processedKeys[s.name] = { key: outKey, url: `https://${CLOUDFRONT}/${outKey}` };
      }

      // also upload original copy to processed/original if desired (or rely on originals folder)
      const origKey = `posts/processed/${post._id.toString()}/${media.id}/original.${meta.format}`;
      await uploadBuffer(origKey, buffer, meta.format ? `image/${meta.format}` : "application/octet-stream");

      // update DB: set versions + processingState
      await posts.updateOne(
        { _id: post._id, "media.id": media.id },
        {
          $set: {
            "media.$.versions.original": { key: origKey, url: `https://${CLOUDFRONT}/${origKey}` },
            "media.$.versions.large": processedKeys.large,
            "media.$.versions.medium": processedKeys.medium,
            "media.$.versions.small": processedKeys.small,
            "media.$.processingState": "processed"
          }
        }
      );
      console.info("Processed image:", key);
    } catch (err) {
      console.error("Processing failed for key:", key, err);
      // Update DB: mark failed
      try {
        const db = await getMongo();
        const posts = db.collection("posts");
        await posts.updateOne({ "media.key": key }, { $set: { "media.$.processingState": "failed" } });
      } catch (innerErr) {
        console.error("Failed to mark processing failure:", innerErr);
      }
      // Let SQS/Lambda handle retry (throw to fail record?). If you want manual retry, don't rethrow.
      throw err; // re-throw to make SQS retry
    }
  }
};