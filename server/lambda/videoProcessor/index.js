// lambda/videoProcessor/index.js
const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const { MongoClient } = require("mongodb");
const fs = require("fs");
const { spawn } = require("child_process");
const path = require("path");
const os = require("os");
const s3 = new S3Client({ region: process.env.AWS_REGION });

async function downloadToFile(key, outPath) {
  const cmd = new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key });
  const res = await s3.send(cmd);
  const writeStream = fs.createWriteStream(outPath);
  await new Promise((resolve, reject) => {
    res.Body.pipe(writeStream);
    res.Body.on('error', reject);
    writeStream.on('finish', resolve);
  });
}

function runFFmpeg(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn("/opt/ffmpeg/ffmpeg", args); // path in layer
    let stderr = "";
    proc.stderr.on("data", d => stderr += d.toString());
    proc.on("close", code => {
      if (code !== 0) return reject(new Error("ffmpeg failed: " + stderr));
      resolve(stderr);
    });
  });
}

async function uploadFile(key, filePath, contentType) {
  const body = fs.createReadStream(filePath);
  const cmd = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
    ACL: "private",
    CacheControl: "public, max-age=31536000, immutable"
  });
  return s3.send(cmd);
}

exports.handler = async (event) => {
  // similar SQS wrapper as image lambda
  // parse message get s3 key, find db entry, etc.
  // For brevity, assume we have postId and mediaId and key and transform
  const tmpDir = os.tmpdir();
  const originalPath = path.join(tmpDir, `${mediaId}_original.mp4`);
  await downloadToFile(key, originalPath);

  // compute crop params using transformToCrop (same codebase)
  const crop = transformToCrop(transform, naturalW, naturalH); // natural from ffprobe or transform

  const outputs = [
    { name: "large", height: 1080, out: path.join(tmpDir, "out_1080.mp4") },
    { name: "medium", height: 720, out: path.join(tmpDir, "out_720.mp4") },
    { name: "small", height: 480, out: path.join(tmpDir, "out_480.mp4") }
  ];

  for (const o of outputs) {
    const vf = `crop=${crop.width}:${crop.height}:${crop.left}:${crop.top},scale=-2:${o.height}`;
    const args = ["-i", originalPath, "-vf", vf, "-c:v", "libx264", "-preset", "slow", "-crf", "23", "-c:a", "aac", "-b:a", "96k", "-y", o.out];
    await runFFmpeg(args);
    // upload
    const keyOut = `posts/processed/${postId}/${mediaId}_video/${o.name}.mp4`;
    await uploadFile(keyOut, o.out, "video/mp4");
  }

  // generate thumbnail
  const thumbPath = path.join(tmpDir, "thumb.jpg");
  const thumbArgs = ["-ss", "00:00:02", "-i", originalPath, "-vf", `crop=${crop.width}:${crop.height}:${crop.left}:${crop.top},scale=900:-1`, "-vframes", "1", "-q:v", "2", "-y", thumbPath];
  await runFFmpeg(thumbArgs);
  const thumbKey = `posts/processed/${postId}/${mediaId}_video/thumbnail.jpg`;
  await uploadFile(thumbKey, thumbPath, "image/jpeg");

  // update DB with versions + thumbnail + videoMeta.duration etc
};