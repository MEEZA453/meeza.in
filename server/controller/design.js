import { v2 as cloudinary } from "cloudinary";
import Product from '../models/designs.js'
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

export const pingServer = (req, res) => {
  console.log("Ping received at:", new Date().toISOString());
  res.status(200).send("Server is awake!");
};
export const getDesign = async( req , res)=>{

    try {
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit) 
        console.log(page , limit)
        const skip = (page - 1) * limit;
        console.log('reached to the get design')
        const postedDesigns = await Product.find().skip(skip).limit(limit)
        .populate("postedBy", "name profile handle")
        res.json(postedDesigns)
    } catch (error) {
        console.log('controller err:', error)
    }
    
    };
    
    export const searchDesigns = async (req, res) => {
  try {
    const { query } = req.query; // example: /search?query=poster

    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "Search query is required" });
    }

    // optional pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const designs = await Product.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
        { tags: { $regex: query, $options: "i" } }, // if your model has tags
      ],
    })
      .populate("postedBy", "name profile handle")
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      page,
      limit,
      count: designs.length,
      results: designs,
    });
  } catch (error) {
    console.error("Error in searchDesigns:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
export const deleteDesign = async (req, res) => {
  console.log('reach to deleteDesign')
  const { id } = req.params;

  try {
    // Step 1: Find the product by ID
    const product = await Product.findById(id);
  

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Step 2: Delete associated images from Cloudinary
    if (product.image && product.image.length > 0) {
      const deletePromises = product.image.map(async (url) => {
        // Extract the public ID from the Cloudinary URL
        const publicId = getCloudinaryPublicId(url);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      });
      await Promise.all(deletePromises);
    }

    // Step 3: Delete the product from MongoDB
    await Product.findByIdAndDelete(id);
console.log('product deleted')
    res.status(200).json({ success: true, message: 'Product deleted successfully', id });
  } catch (error) {
    console.error("Delete design error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Helper function to extract Cloudinary public ID from URL
function getCloudinaryPublicId(imageUrl) {
  try {
    const parts = imageUrl.split('/');
    const fileName = parts[parts.length - 1]; // e.g., 1724402345533-filename.png
    const publicId = fileName.substring(0, fileName.lastIndexOf('.')); // remove .png or .jpg
    const folder = parts.slice(parts.indexOf("uploads")).slice(0, -1).join('/'); // e.g., uploads/folder
    return `${folder}/${publicId}`; // full public ID for Cloudinary
  } catch (err) {
    console.error("Failed to parse Cloudinary public_id from URL:", imageUrl);
    return null;
  }
}


// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer to use Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "uploads", // Cloudinary folder
        public_id: (req, file) => Date.now() + "-" + file.originalname,
    },
});

const upload = multer({ storage });

export default upload;

// // Configure Multer for file uploads
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, "uploads/"); // Store files in 'uploads' folder
//     },
//     filename: (req, file, cb) => {
//         cb(null, Date.now() + "-" + file.originalname); // Unique filenames
//     }
// });

// const upload = multer({ storage }).array('image', 5); // Allow up to 5 images

export const postDesign = async (req, res) => {
    console.log("Reached postDesign route");

    upload.array("images", 10)(req, res, async (err) => {
        if (err) {
            console.error("Multer error:", err);
            return res.status(400).json({ success: false, message: "Image upload failed" });
        }

        try {
            const { name, amount,driveLink ,  sections,  faq , hastags } = req.body;

            const parsedSections = sections ? JSON.parse(sections) : [];
            const parsedHastags = hastags ? JSON.parse(hastags) : [];
            const parsedFaq = faq ? JSON.parse(faq) : [];

            const imagePaths = req.files ? req.files.map(file => file.path) : [];

            const product = new Product({
                name,
                amount,
                image: imagePaths,
            driveLink ,
                sections: parsedSections,
                faq : parsedFaq,
                hastags: parsedHastags,
                postedBy: req.user.id, // store user ID from JWT
            });

            await product.save();
            console.log("Product added successfully:");
            res.status(201).json({ success: true, product });
        } catch (error) {
            console.error("Error:", error.message);
            res.status(500).json({ success: false, message: error.message });
        }
    });
};

