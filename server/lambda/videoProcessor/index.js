// lambda/videoProcessor/index.js
// Node 16+ style
const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const { MongoClient } = require("mongodb");
const fs = require("fs");
const fsp = fs.promises;
const { spawn } = require("child_process");
const path = require("path");
const os = require("os");
const ffmpeg = require("fluent-ffmpeg");

const REGION = process.env.AWS_REGION;
const BUCKET = process.env.S3_BUCKET;
const CLOUDFRONT = process.env.CLOUDFRONT_DOMAIN; // e.g. d111111abcdef8.cloudfront.net
const FFMPEG = process.env.FFMPEG_PATH || "/opt/bin/ffmpeg"; // layer path
const FFPROBE = process.env.FFPROBE_PATH || "/opt/bin/ffprobe"; // layer path
const s3 = new S3Client({ region: REGION });

// tell fluent-ffmpeg where the binaries are
ffmpeg.setFfmpegPath(FFMPEG);
ffmpeg.setFfprobePath(FFPROBE);

let mongoClient = null;
async function getMongo() {
  if (!mongoClient) {
    mongoClient = new MongoClient(process.env.MONGO_URI);
    await mongoClient.connect();
  }
  return mongoClient.db();
}

function runCmd(cmdPath, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmdPath, args, { ...opts });
    let stdout = "";
    let stderr = "";
    if (proc.stdout) proc.stdout.on("data", (d) => (stdout += d.toString()));
    if (proc.stderr) proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("error", (err) => reject(err));
    proc.on("close", (code) => {
      if (code !== 0) return reject(new Error(`${path.basename(cmdPath)} failed (code ${code}): ${stderr}`));
      resolve({ stdout, stderr });
    });
  });
}

async function ffprobeInfo(filePath) {
  // return { width, height, duration }
  // use JSON output
  const args = [
    "-v", "quiet",
    "-print_format", "json",
    "-show_streams",
    "-show_format",
    filePath
  ];
  const { stdout } = await runCmd(FFPROBE, args);
  const json = JSON.parse(stdout);
  // find first video stream
  const vs = (json.streams || []).find(s => s.codec_type === "video");
  const format = json.format || {};
  const width = vs ? (vs.width || 0) : 0;
  const height = vs ? (vs.height || 0) : 0;
  const duration = parseFloat(vs?.duration ?? format.duration ?? 0) || 0;
  return { width, height, duration };
}

async function downloadToFile(key, outPath) {
  const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  const res = await s3.send(cmd);
  await new Promise((resolve, reject) => {
    const write = fs.createWriteStream(outPath);
    res.Body.pipe(write);
    res.Body.on("error", reject);
    write.on("error", reject);
    write.on("finish", resolve);
  });
}

async function uploadFile(key, filePath, contentType) {
  const body = fs.createReadStream(filePath);
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

// SAME math as your image lambda: converts editor transform -> natural pixel crop
function transformToCrop(transform = {}, naturalW, naturalH) {
  const viewportSize = transform.viewportSize || transform.cropW || 520;
  const scale = (typeof transform.scale === "number" && transform.scale > 0) ? transform.scale : 1;
  const x = typeof transform.x === "number" ? transform.x : 0;
  const y = typeof transform.y === "number" ? transform.y : 0;
  const cropLeft = typeof transform.cropLeft === "number" ? transform.cropLeft : 0;
  const cropTop = typeof transform.cropTop === "number" ? transform.cropTop : 0;
  const cropW = typeof transform.cropW === "number" ? transform.cropW : viewportSize;
  const cropH = typeof transform.cropH === "number" ? transform.cropH : viewportSize;

  const displayedW = naturalW * scale;
  const displayedH = naturalH * scale;
  const baseX = (viewportSize / 2) - (displayedW / 2);
  const baseY = (viewportSize / 2) - (displayedH / 2);
  const drawX = baseX + x;
  const drawY = baseY + y;

  const offsetLeftDisplayedPx = cropLeft - drawX;
  const offsetTopDisplayedPx = cropTop - drawY;
  const invScale = 1 / scale;

  let left = Math.round(offsetLeftDisplayedPx * invScale);
  let top = Math.round(offsetTopDisplayedPx * invScale);
  let width = Math.round(cropW * invScale);
  let height = Math.round(cropH * invScale);

  // clamp
  if (left < 0) left = 0;
  if (top < 0) top = 0;
  if (width < 1) width = 1;
  if (height < 1) height = 1;
  if (left + width > naturalW) width = Math.max(1, naturalW - left);
  if (top + height > naturalH) height = Math.max(1, naturalH - top);

  return { left, top, width, height, scale, drawX, drawY, displayedW, displayedH };
}

function safeTempName(base, ext = "") {
  const rnd = Math.random().toString(36).slice(2, 10);
  const fileName = ext ? `${base}-${Date.now()}-${rnd}${ext}` : `${base}-${Date.now()}-${rnd}`;
  return path.join(os.tmpdir(), fileName);
}

async function cleanupFiles(paths = []) {
  for (const p of paths) {
    try { await fsp.unlink(p); } catch (e) { /* ignore */ }
  }
}

exports.handler = async (event) => {

  // event could be S3 put or SQS wrapper with S3 body - support both
  const records = event.Records || [];
  for (const rec of records) {
    // support SQS wrapper where message body contains S3 event
    let s3record = rec.s3;
    if (!s3record && rec.body) {
      try {
        const body = JSON.parse(rec.body);
        if (body.Records && body.Records[0] && body.Records[0].s3) {
          s3record = body.Records[0].s3;
        }
      } catch (e) {
        // not JSON or not S3 event
      }
    }
    if (!s3record) {
      console.warn("Skipping record - no s3 info", rec);
      continue;
    }

    const bucket = s3record.bucket.name;
    const key = decodeURIComponent(s3record.object.key.replace(/\+/g, " "));
    console.info("Video processing triggered for:", key);

    if (bucket !== BUCKET) {
      console.warn("Event for different bucket, skipping:", bucket);
      continue;
    }

    // process single video
    // note: we assume the post.media entry exists and has transform attached already (from your presigned endpoint)
    let tmpFiles = [];
    try {
      const db = await getMongo();
      const posts = db.collection("posts");

      // lookup post/media by key
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
        console.info("Already processed - skipping:", key);
        continue;
      }

      // mark processing
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
        console.info("Another worker is processing this media:", media.key);
        continue;
      }

      // download to tmp
      // download to tmp
const originalTmp = safeTempName(`${media.id}_original`);

// make sure the parent folder exists
await fsp.mkdir(path.dirname(originalTmp), { recursive: true });

await downloadToFile(key, originalTmp);
tmpFiles.push(originalTmp);

      // ffprobe for dimensions/duration (fallback to media.transform.naturalW/H)
      const probe = await ffprobeInfo(originalTmp);
      const naturalW = (media.transform && media.transform.naturalW) ? media.transform.naturalW : probe.width;
      const naturalH = (media.transform && media.transform.naturalH) ? media.transform.naturalH : probe.height;
      const duration = probe.duration || 0;
      console.info("probe:", probe, "using natural", { naturalW, naturalH });

      const crop = transformToCrop(media.transform || {}, naturalW, naturalH);
      console.info("Computed crop:", crop);

      // outputs to generate
      const outputs = [
        { name: "large", height: 1080, tmp: safeTempName(`${media.id}_1080`, ".mp4") },
        { name: "medium", height: 720, tmp: safeTempName(`${media.id}_720`, ".mp4") },
        { name: "small", height: 480, tmp: safeTempName(`${media.id}_480`, ".mp4") }
      ];
      outputs.forEach(o => tmpFiles.push(o.tmp));

      // Generate each output: crop then scale to height (width auto, maintain aspect) with even dims
      for (const o of outputs) {
        // Use scale with -2 to ensure even width
        // build vf: crop=width:height:left:top,scale=-2:HEIGHT
        const vf = `crop=${crop.width}:${crop.height}:${crop.left}:${crop.top},scale=-2:${o.height}`;
        const args = [
          "-i", originalTmp,
          "-vf", vf,
          "-c:v", "libx264",
          "-preset", "fast",
          "-crf", "23",
          "-c:a", "aac",
          "-b:a", "96k",
          "-movflags", "+faststart",
          "-y",
          o.tmp
        ];
        console.info("ffmpeg args for", o.name, args.join(" "));
        await runCmd(FFMPEG, args);
      }

      // thumbnail: take a frame at ~2s (or middle if duration < 4s)
      const thumbTmp = safeTempName(`${media.id}_thumb`, ".jpg");
      tmpFiles.push(thumbTmp);
      const seek = (duration && duration > 4) ? 2 : Math.max(0, Math.floor(duration / 2));
      const thumbVf = `crop=${crop.width}:${crop.height}:${crop.left}:${crop.top},scale=900:-1`;
      const thumbArgs = [
        "-ss", `${seek}`,
        "-i", originalTmp,
        "-vf", thumbVf,
        "-vframes", "1",
        "-q:v", "2",
        "-y",
        thumbTmp
      ];
      console.info("Generating thumbnail, args:", thumbArgs.join(" "));
      await runCmd(FFMPEG, thumbArgs);

      // upload outputs to S3
      const processedPrefix = `posts/processed/${post._id.toString()}/${media.id}_video/`;
      const uploaded = {};
      for (const o of outputs) {
        const keyOut = `${processedPrefix}${o.name}.mp4`;
        await uploadFile(keyOut, o.tmp, "video/mp4");
        uploaded[o.name] = { key: keyOut, url: `https://${CLOUDFRONT}/${keyOut}` };
      }
      const thumbKey = `${processedPrefix}thumbnail.jpg`;
      await uploadFile(thumbKey, thumbTmp, "image/jpeg");

      // optionally upload a processed/original copy if desired (skip to save space)
      // update DB: set versions + videoMeta and processingState
      const versionObj = {
        // original version will still be in originals folder; we point processed versions to produced mp4s
        large: uploaded.large,
        medium: uploaded.medium,
        small: uploaded.small
      };

      const videoMeta = {
        duration: duration,
        thumbnail: { key: thumbKey, url: `https://${CLOUDFRONT}/${thumbKey}` },
        width: naturalW,
        height: naturalH
      };

      await posts.updateOne(
        { _id: post._id, "media.key": media.key },
        {
          $set: {
            "media.$.versions": versionObj,
            "media.$.videoMeta": videoMeta,
            "media.$.processingState": "processed",
            "media.$.processedAt": new Date()
          }
        }
      );

      console.info("Video processed and uploaded for:", key);
      // cleanup
      await cleanupFiles(tmpFiles);
    } catch (err) {
      console.error("Processing failed for key:", key, err);
      // mark failed
      try {
        const db = await getMongo();
        const posts = db.collection("posts");
        await posts.updateOne(
          { "media.key": key },
          { $set: { "media.$.processingState": "failed", "media.$.processingError": String(err), "media.$.failedAt": new Date() } }
        );
      } catch (inner) {
        console.error("Failed to mark failed state:", inner);
      }
      // cleanup then rethrow to allow Lambda/SQS to retry per policy
      try { await cleanupFiles(tmpFiles); } catch (e) {}
      throw err;
    }
  } // end for records
};