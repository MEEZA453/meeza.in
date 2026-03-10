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
  // return default db from connection string
  return mongoClient.db();
}

// Helper: download S3 object to Buffer (safe fallback)
async function downloadToBuffer(key) {
  const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  const res = await s3.send(cmd);
  const chunks = [];
  for await (const chunk of res.Body) chunks.push(chunk);
  return Buffer.concat(chunks);
}

// Helper: upload buffer (or stream) to S3
async function uploadBuffer(key, body, contentType) {
  const cmd = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
    ACL: "private",
    CacheControl: "public, max-age=31536000, immutable"
  });
  return s3.send(cmd);
}

function mapSharpMime(format) {
  if (!format) return "application/octet-stream";
  format = format.toLowerCase();
  if (format === "jpeg" || format === "jpg") return "image/jpeg";
  if (format === "png") return "image/png";
  if (format === "webp") return "image/webp";
  if (format === "tiff") return "image/tiff";
  return `image/${format}`;
}

// Convert editor transform -> sharp crop region in natural pixels
// The editor exposes: scale, x, y, naturalW, naturalH, viewportSize, cropLeft, cropTop, cropW, cropH
function transformToCrop(transform = {}, naturalW, naturalH) {
  // Fallbacks
  const viewportSize = transform.viewportSize || transform.cropW || 520;
  const scale = (typeof transform.scale === "number" && transform.scale > 0) ? transform.scale : 1;
  const x = typeof transform.x === "number" ? transform.x : 0;
  const y = typeof transform.y === "number" ? transform.y : 0;
  const cropLeft = typeof transform.cropLeft === "number" ? transform.cropLeft : 0;
  const cropTop = typeof transform.cropTop === "number" ? transform.cropTop : 0;
  const cropW = typeof transform.cropW === "number" ? transform.cropW : viewportSize;
  const cropH = typeof transform.cropH === "number" ? transform.cropH : viewportSize;

  // Displayed image size in viewport pixels
  const displayedW = naturalW * scale;
  const displayedH = naturalH * scale;

  // base offset used by the frontend to center the image
  const baseX = (viewportSize / 2) - (displayedW / 2);
  const baseY = (viewportSize / 2) - (displayedH / 2);

  // image draw position in viewport coordinates
  const drawX = baseX + x;
  const drawY = baseY + y;

  // offset from image-left/top (in displayed pixels) to crop box left/top
  const offsetLeftDisplayedPx = cropLeft - drawX;
  const offsetTopDisplayedPx = cropTop - drawY;

  // conversion factor: displayed px -> natural px = 1 / scale
  const invScale = 1 / scale;

  // map to natural coordinates
  let left = Math.round(offsetLeftDisplayedPx * invScale);
  let top = Math.round(offsetTopDisplayedPx * invScale);
  let width = Math.round(cropW * invScale);
  let height = Math.round(cropH * invScale);

  // clamp to image bounds
  if (left < 0) left = 0;
  if (top < 0) top = 0;
  if (width < 1) width = 1;
  if (height < 1) height = 1;
  if (left + width > naturalW) width = Math.max(1, naturalW - left);
  if (top + height > naturalH) height = Math.max(1, naturalH - top);

  return { left, top, width, height, scale, drawX, drawY, displayedW, displayedH };
}

exports.handler = async (event) => {
  // Accept S3 put notification records (or SQS-wrapped S3 events)
  for (const rec of event.Records) {

    let s3Info = rec.s3;
  
    // handle SQS wrapped S3 event
    if (!s3Info && rec.body) {
      try {
        const body = JSON.parse(rec.body);
        if (body.Records && body.Records[0].s3) {
          s3Info = body.Records[0].s3;
        }
      } catch (e) {
        console.error("Failed to parse SQS body", e);
      }
    }
  
    if (!s3Info) {
      console.warn("No S3 info found in record");
      continue;
    }
  
    const bucket = s3Info.bucket.name;
    const key = decodeURIComponent(s3Info.object.key.replace(/\+/g, " "));
    console.log("Processing:", key);
    if (bucket !== BUCKET) {
      console.warn("Message for different bucket:", bucket);
      continue;
    }

    try {
      const db = await getMongo();
      const posts = db.collection("posts");

      // Find post and media entry matching this upload key
      const post = await posts.findOne(
        { "media.key": key },
        { projection: { media: { $elemMatch: { key } }, _id: 1 } }
      );
      if (!post || !post.media || post.media.length === 0) {
        console.warn("No post/media found for key:", key);
        continue;
      }
      const media = post.media[0];
      if (!media) {
        console.warn("No media entry found for key:", key);
        continue;
      }
      if (media.processingState === "processed") {
        console.info("Already processed:", key);
        continue;
      }

      // Try to atomically mark processing (avoid double work)
      const mark = await posts.updateOne(
        {
          _id: post._id,
          media: {
            $elemMatch: {
              key: key,
              processingState: { $ne: "processing" }
            }
          }
        },
        {
          $set: {
            "media.$.processingState": "processing",
            "media.$.processingStartedAt": new Date()
          }
        }
      );
      if (mark.matchedCount === 0) {
        console.info("Another worker is processing:", key);
        continue;
      }

      // Download original
      const buffer = await downloadToBuffer(key);

      // Create sharp instance and read metadata (auto-rotate)
      let image = sharp(buffer, { failOnError: false }).rotate(); // rotate using EXIF
      const meta = await image.metadata();
      const naturalW = (media.transform && media.transform.naturalW) ? media.transform.naturalW : (meta.width || 0);
      const naturalH = (media.transform && media.transform.naturalH) ? media.transform.naturalH : (meta.height || 0);

      if (!naturalW || !naturalH) {
        console.warn("Could not determine natural dimensions, using metadata fallback", meta);
      }

      const crop = transformToCrop(media.transform || {}, naturalW, naturalH);
      console.info("Computed crop:", crop);

      // Extract crop region from the natural image. Use clamp safety.
      // NOTE: sharp.extract expects integer left/top/width/height within bounds.
      // We operate on the rotated image (we used .rotate()) so meta.width/height are already correct.
      const extractRegion = {
        left: Math.max(0, Math.min(naturalW - 1, crop.left)),
        top: Math.max(0, Math.min(naturalH - 1, crop.top)),
        width: Math.max(1, Math.min(naturalW - crop.left, crop.width)),
        height: Math.max(1, Math.min(naturalH - crop.top, crop.height)),
      };

      // Perform extraction (use .clone() so we can reuse pipeline safely)
      const extractedBuffer = await image.clone().extract(extractRegion).toBuffer();

      // Sizes to generate
      const sizes = [
        { name: "large", width: 1080 },
        { name: "medium", width: 720 },
        { name: "small", width: 400 }
      ];

      const processedKeys = {};

      for (const s of sizes) {
        // Resize preserving aspect ratio (width constrained). Prevent upscaling with withoutEnlargement.
        const outBuffer = await sharp(extractedBuffer)
          .resize({ width: s.width, withoutEnlargement: true })
          .jpeg({ quality: 82 })
          .toBuffer();

        const outKey = `posts/processed/${post._id.toString()}/${media.id}/${s.name}.jpg`;
        await uploadBuffer(outKey, outBuffer, "image/jpeg");
        processedKeys[s.name] = { key: outKey, url: `https://${CLOUDFRONT}/${outKey}` };
      }

      // Store original copy under processed (optional)
      const ext = (meta.format || "jpeg").toLowerCase();
      const origKey = `posts/processed/${post._id.toString()}/${media.id}/original.${ext}`;
      const origContentType = mapSharpMime(meta.format);
      await uploadBuffer(origKey, buffer, origContentType);

      // Update DB: set versions + processingState atomically for the matched media element
      const versionObj = {
        original: { key: origKey, url: `https://${CLOUDFRONT}/${origKey}` },
        large: processedKeys.large,
        medium: processedKeys.medium,
        small: processedKeys.small
      };
      await posts.updateOne(
        { _id: post._id, "media.key": key },
        {
          $set: {
            "media.$.versions": versionObj,
            "media.$.processingState": "processed",
            "media.$.processedAt": new Date()
          }
        }
      );

      console.info("Processed image:", key);
    } catch (err) {
      console.error("Processing failed for key:", key, err);

      // Try to mark failed in DB
      try {
        const db = await getMongo();
        const posts = db.collection("posts");
        await posts.updateOne(
          { "media.key": key },
          { $set: { "media.$.processingState": "failed", "media.$.processingError": String(err), "media.$.failedAt": new Date() } }
        );
      } catch (innerErr) {
        console.error("Failed to mark processing failure in DB:", innerErr);
      }

      // Re-throw to make SQS/Lambda retry depending on your retry policy.
      throw err;
    }
  } // end for records
};