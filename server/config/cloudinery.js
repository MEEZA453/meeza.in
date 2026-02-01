// config/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from "dotenv";

dotenv.config();
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith("video");
    return {
      folder: "posts",
      resource_type: isVideo ? "video" : "image",
      public_id: `${Date.now()}-${file.originalname.split(".")[0]}`,
    };
  },
});


const upload = multer({ storage });
const getCloudinaryPublicId = (url) => {
  try {
    const parts = url.split("/");
    const fileName = parts[parts.length - 1]; // e.g., abc123.jpg
    const publicId = fileName.substring(0, fileName.lastIndexOf(".")); // abc123
    return `posts/${publicId}`; // folder matches your upload folder
  } catch (err) {
    console.error("Error extracting Cloudinary publicId:", err);
    return null;
  }
};

export { cloudinary, upload, getCloudinaryPublicId };