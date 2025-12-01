import { v2 as cloudinary } from "cloudinary";
import Product from '../models/designs.js'
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import dotenv from "dotenv";
import { sanitizeProduct } from "../utils/sanitizeProduct.js";
import Order from "../models/Order.js";
import user from "../models/user.js";
dotenv.config();
import mongoose from "mongoose";
export const pingServer = (req, res) => {
  console.log("Ping received at:", new Date().toISOString());
  res.status(200).send("Server is awake!");
};

export const getDefaultDesigns = async (req, res) => {
  try {
    // Read limit & page from query params, with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    console.log(`Fetching default designs | page: ${page}, limit: ${limit}`);

    const userId = req.user?.id; // ✅ get from auth middleware

    let designs = await Product.find({})
      .sort({ createdAt: -1 }) // newest first
      .skip(skip)
      .limit(limit)
      .populate("postedBy", "name profile handle")
      .lean();

    // ✅ Add isMyProduct flag
    designs = designs.map((d) => ({
      ...d,
      isMyProduct: userId ? d.postedBy?._id.toString() === userId.toString() : false,
    }));

    res.status(200).json({
      page,
      limit,
      count: designs.length,
      results: designs,
    });
  } catch (error) {
    console.error("Error fetching default designs:", error);
    res.status(500).json({ message: "Server error while fetching default designs" });
  }
};



export const getDesign = async (req, res) => {
  try {
    console.log('getting design called')
    const userId = req.user?.id || null;
    const limit = Math.max(1, parseInt(req.query.limit || '10', 10));
    const cursor = req.query.cursor || null; // <-- new
    const rawFilters = req.query.filters ? JSON.parse(req.query.filters) : {};
console.log('limit:', limit, 'cursor:', cursor, 'filters:', rawFilters)
    // Build Mongo query
    const andClauses = [];
    Object.entries(rawFilters).forEach(([key, values]) => {
      if (!Array.isArray(values) || values.length === 0) return;
      andClauses.push({
        sections: {
          $elemMatch: {
            title: new RegExp(`^${key}$`, 'i'),
            content: { $in: values },
          },
        },
      });
    });
    const baseQuery = andClauses.length ? { $and: andClauses } : {};

    // Count total matching docs
    const total = await Product.countDocuments(baseQuery);

    // Cursor query
    const findQuery = cursor && mongoose.isValidObjectId(cursor)
      ? { ...baseQuery, _id: { $lt: new mongoose.Types.ObjectId(cursor) } }
      : baseQuery;

    // Fetch page results
    let designs = await Product.find(findQuery)
      .sort({ _id: -1 })
      .limit(limit)
      .populate('postedBy', 'name profile handle followers')
      .lean();

    // sanitize + flags
    designs = designs.map(product => {
      const base = sanitizeProduct(product);
      const isMyProduct = userId ? product.postedBy?._id.toString() === userId.toString() : false;
      const isFollowing = userId && !isMyProduct
        ? product.postedBy?.followers?.some(f => f.toString() === userId.toString())
        : false;
      return { ...base, isMyProduct, isFollowing };
    });

    const hasMore = designs.length === limit;
    // set nextCursor only if there actually is more to fetch
    const nextCursor = hasMore && designs.length ? designs[designs.length - 1]._id.toString() : null;

    console.log('fetched designs:', designs.length, 'nextCursor:', nextCursor, 'hasMore:', hasMore);

    res.status(200).json({
      results: designs,
      limit,
      nextCursor,
      count: total,
      hasMore,
    });
  } catch (error) {
    console.error('Error in getDesign:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


// ✅ Get product by ID
export const getDesignById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const product = await Product.findById(id)
      .populate("postedBy", "name profile handle")
      .lean();

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
 let unlocked = false;
    if (userId) {
      const order = await Order.findOne({ user: userId, product: id, status: { $in: ["free", "paid"] } });
      unlocked = !!order;
    }


 const productWithOwnership = {
      ...sanitizeProduct(product),
      isMyProduct: userId ? product.postedBy?._id.toString() === userId.toString() : false,
      unlocked,
    };
    res.status(200).json({ success: true, product: productWithOwnership });
  } catch (error) {
    console.error("Error in getDesignById:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ✅ Get product by HANDLE
export const getDesignByHandle = async (req, res) => {
  try {
    const { handle } = req.params;
    const page = parseInt(req.query.page || "0", 10);
    const limit = parseInt(req.query.limit || "10", 10);

    console.log("getDesignByHandle:", handle, "page:", page, "limit:", limit);

    // ------------------ PAGINATED LIST MODE ------------------
    if (req.query.page) {

      // FIXED ✔ correct model name + no shadowing
      const foundUser = await user.findOne({ handle }).select("_id");

      if (!foundUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const totalCount = await Product.countDocuments({
        postedBy: foundUser._id,
      });

      if (totalCount === 0) {
        return res.status(200).json({
          success: true,
          products: [],
          page,
          limit,
          count: 0,
          hasMore: false,
        });
      }

      console.log("total products by user:", totalCount);

      const skip = (page - 1) * limit;

      const products = await Product.find({ postedBy: foundUser._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: "postedBy", select: "profile handle _id" })
        .lean();

      return res.status(200).json({
        success: true,
        products,
        page,
        limit,
        count: totalCount,
        hasMore: page * limit < totalCount,
      });
    }

    // ------------------ SINGLE PRODUCT MODE ------------------
    const product = await Product.findOne({ handle })
      .populate("postedBy", "name profile handle")
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const userId = req.user?.id;
    const unlocked = false;

    const productWithOwnership = {
      ...product,
      isMyProduct: userId
        ? product.postedBy?._id.toString() === userId.toString()
        : false,
      unlocked,
    };

    res.status(200).json({
      success: true,
      product: productWithOwnership,
    });
  } catch (error) {
    console.error("Error in getDesignByHandle:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
;


export const searchDesigns = async (req, res) => {
  
  console.log("searching design");

  try {
    const { query } = req.query;
    const userId = req.user?.id;

    if (!query || !query.trim()) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
console.log(`Searching designs for query: "${query}" | page: ${page}, limit: ${limit}`);
    // Build search conditions
    const regex = { $regex: query, $options: "i" };

    const searchConditions = [
      { name: regex },
      { description: regex },
      { category: regex },
      { tags: regex },
      { hashtags: regex },

      // 🔥 Now searching inside Sections
      { "sections.title": regex },
      { "sections.content": regex },
    ];

    let designs = await Product.find({ $or: searchConditions })
      .populate("postedBy", "name profile handle")
      .skip(skip)
      .limit(limit)
        .sort({ createdAt: -1 })  
      .lean();

    // Add isMyProduct flag
    designs = designs.map((d) => ({
      ...d,
      isMyProduct: userId
        ? d.postedBy?._id.toString() === userId.toString()
        : false,
    }));
console.log(`Found ${designs.length} designs matching query: "${query}"`);
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



  export const postDesign = async (req, res) => {
    console.log("Reached postDesign route");

    upload.array("images", 10)(req, res, async (err) => {
      if (err) {
        console.error("Multer error:", err);
        return res.status(400).json({ success: false, message: "Image upload failed" });
      }

      try {
        const { name, amount, driveLink, sections, faq, hashtags, sources, description } = req.body;
console.log(sections  )
        const parsedSections = sections ? JSON.parse(sections) : [];
        const parsedSources = sources ? JSON.parse(sources): []
        const parsedHashtags = hashtags ? JSON.parse(hashtags) : [];
        console.log(hashtags)
        const parsedFaq = faq ? JSON.parse(faq) : [];

        const imagePaths = req.files ? req.files.map((file) => file.path) : [];

        const product = new Product({
          name,
          amount,
          image: imagePaths,
          driveLink,
          description,
          sections: parsedSections,
          sources : parsedSources,
          faq: parsedFaq,
          hashtags: parsedHashtags, // ✅ correct spelling matches schema
          postedBy: req.user.id,
        });

        await product.save();
        console.log("Product added successfully:", product);
        res.status(201).json({ success: true, product });
      } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
      }
    });
  };



export const editDesign = async (req, res) => {
  console.log("Reached editDesign route");

  // Handle file uploads with multer
  upload.array("images", 10)(req, res, async (err) => {
    if (err) {
      console.error("Multer error:", err);
      return res.status(400).json({ success: false, message: "Image upload failed" });
    }

    try {
      const { id } = req.params;
      const { name, amount, driveLink, sections, faq, sources,  hashtags, removeImages, description } = req.body;
console.log(removeImages)
      // 1️⃣ Find the product
      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }

      // 2️⃣ Parse JSON fields safely
      const parsedSections = sections ? JSON.parse(sections) : product.sections;
      const parsedFaq = faq ? JSON.parse(faq) : product.faq;
      const parsedHashtags = hashtags ? JSON.parse(hashtags) : product.hashtags;
        const parsedSources = sources ? JSON.parse(sources): []


      // 3️⃣ Handle newly uploaded images (upload to Cloudinary)
      let newImages = [];
      if (req.files && req.files.length > 0) {
        newImages = await Promise.all(
          req.files.map(async (file) => {
            const result = await cloudinary.uploader.upload(file.path, {
              folder: "designs",
            });
            return result.secure_url;
          })
        );
      }

      // 4️⃣ Handle removing old images
      let updatedImages = [...product.image];
      if (removeImages) {
        try {
          const imagesToRemove = JSON.parse(removeImages); // expect array of URLs
          for (const url of imagesToRemove) {
            try {
          
              if (publicId) {
                await cloudinary.uploader.destroy(publicId);
              }
            } catch (cloudErr) {
              console.error("Cloudinary deletion failed for:", url, cloudErr.message);
            }
            updatedImages = updatedImages.filter((img) => img !== url);
          }
        } catch (parseErr) {
          console.error("Error parsing removeImages:", parseErr.message);
        }
      }

      // 5️⃣ Merge old images with newly uploaded images
      updatedImages = [...updatedImages, ...newImages];

      // 6️⃣ Update product fields
      product.name = name ?? product.name;
      product.amount = amount ?? product.amount;
      product.driveLink = driveLink ?? product.driveLink;
      product.sections = parsedSections;
      product.sources = parsedSources;

      product.faq = parsedFaq;
      product.description = description
      product.hashtags = parsedHashtags;
      product.image = updatedImages;

      // 7️⃣ Save updated product
      await product.save();

      console.log("✅ Product updated successfully:", product, );
      res.status(200).json({ success: true, product });
    } catch (error) {
      console.error("Edit design error:", error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  });
};