import { v2 as cloudinary } from "cloudinary";
import Product from '../models/designs.js'
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import dotenv from "dotenv";
import { sanitizeProduct } from "../utils/sanitizeProduct.js";
import Order from "../models/Order.js";
import user from "../models/user.js";
import Asset from '../models/asset.js'
dotenv.config();
import mongoose from "mongoose";
import { extractKeywordsProduct, saveKeywords } from "../utils/extractKeywords.js";
import productView from "../models/productView.js";
import { updateProductHotScore } from "../utils/updateProductHotScore.js";
import { attachIsAppreciated } from "../utils/attactIsAppreciated.js";
import { deleteObjectByKey, getS3KeyFromUrl } from "../config/s3Presigner.js";
export const pingServer = (req, res) => {
  console.log("Ping received at:", new Date().toISOString());
  res.status(200).send("Server is awake!");
};
export const attachAssetsToProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { assetIds } = req.body; // array of ids
    if (!Array.isArray(assetIds) || assetIds.length === 0) return res.status(400).json({ message: "assetIds required" });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (String(product.postedBy) !== String(req.user.id)) return res.status(403).json({ message: "Forbidden" });

    const assets = await Asset.find({ _id: { $in: assetIds }, owner: req.user.id });

    const toAdd = assets.map(a => ({
      assetId: a._id,
      snapshot: {
        name: a.name,
        extension: a.extension,
        size: a.size,
        mimeType: a.mimeType,
        folderPath: a.folder ? a.folder.toString() : null
      }
    }));

    // Append unique (avoid duplicates)
    for (const entry of toAdd) {
      const exists = product.assets.some(x => String(x.assetId) === String(entry.assetId));
      if (!exists) product.assets.push(entry);
    }

    await product.save();

    // update asset documents
    for (const a of assets) {
      a.isDocumented = true;
      a.storageStatus = "published";
      a.documents.push({ productId: product._id, productName: product.name, snapshotAt: new Date() });
      await a.save();
    }

    return res.json({ success: true, assets: product.assets });
  } catch (err) {
    console.error("attachAssetsToProduct err:", err);
    res.status(500).json({ message: "Attach failed" });
  }
};

export const detachAssetFromProduct = async (req, res) => {
  try {
    const { productId, assetId } = req.params;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (String(product.postedBy) !== String(req.user.id)) return res.status(403).json({ message: "Forbidden" });

    product.assets = product.assets.filter(a => String(a.assetId) !== String(assetId));
    await product.save();

    // remove product doc ref from asset
    const asset = await Asset.findById(assetId);
    if (asset) {
      asset.documents = asset.documents.filter(d => String(d.productId) !== String(product._id));
      if (asset.documents.length === 0) {
        asset.isDocumented = false;
        asset.storageStatus = "draft";
      }
      await asset.save();
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("detachAssetFromProduct err:", err);
    res.status(500).json({ message: "Detach failed" });
  }
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
const VIEW_COOLDOWN_HOURS = 6;
const DRIP_PER_VIEW = 5;

export const addProductView = async (req, res) => {
  try {
    const productId = req.params.id;
    const viewerId = req.user.id;
console.log('viewing product', productId, viewerId)
    const windowStart = new Date(
      Date.now() - VIEW_COOLDOWN_HOURS * 60 * 60 * 1000
    );

    // 🔍 ever viewed?
    const everViewed = await productView.findOne({
      product: productId,
      viewer: viewerId,
    });

    const isFirstView = !everViewed;

    // 🔒 cooldown
    const recentView = await productView.findOne({
      product: productId,
      viewer: viewerId,
      viewedAt: { $gte: windowStart },
    });

    if (recentView) {
      return res.json({ success: true, throttled: true });
    }

    const product = await Product.findById(productId).select("postedBy");
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const isOwner = product.postedBy.toString() === viewerId;

    // 🧠 raw event
    await productView.create({
      product: productId,
      viewer: viewerId,
      weight: isOwner ? 0 : 1,
      ipHash: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // 🚀 aggregate update
await Product.findByIdAndUpdate(productId, {
  $inc: {
    views: 1,
    drip: isOwner ? 0 : DRIP_PER_VIEW,
    monthlyDrip: isOwner ? 0 : DRIP_PER_VIEW,
    ...(isFirstView ? { uniqueViewers: 1 } : {}),
  },
});

// reward creator
if (!isOwner) {
  await User.findByIdAndUpdate(product.postedBy, {
    $inc: { 
      drip: DRIP_PER_VIEW,
      monthlyDrip: DRIP_PER_VIEW
    },
  });
}


    // 🔥 HOT SCORE UPDATE
    await updateProductHotScore(productId);
console.log('product viewed')
    res.json({ success: true, throttled: false });
  } catch (err) {
    console.error("addProductView:", err);
    res.status(500).json({ message: err.message });
  }
};
export const getDesign = async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const limit = Math.max(1, parseInt(req.query.limit || '10', 10));
    const cursor = req.query.cursor || null;
    const rawFilters = req.query.filters ? JSON.parse(req.query.filters) : {};
    const searchQuery = req.query.query || ""; // 🔥 new search query
    const isAssetQuery = typeof req.query.isAsset !== 'undefined' ? req.query.isAsset : null;
    console.log('limit:', limit, 'cursor:', cursor, 'filters:', rawFilters, 'query:', searchQuery, 'isAssetQuery', isAssetQuery);
let isAsset = null;
if (isAssetQuery !== null) {
  if (typeof isAssetQuery === 'string') {
    isAsset = isAssetQuery === 'true' ? true : isAssetQuery === 'false' ? false : null;
  } else if (typeof isAssetQuery === 'boolean') {
    isAsset = isAssetQuery;
  }
}

    // ---------- BUILD BASE QUERY ----------
    const andClauses = [];

    // 1️⃣ Existing FILTER logic (unchanged)
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
if (isAsset !== null) {
  andClauses.push({ isAsset: isAsset });
}
    // 2️⃣ Add SEARCH logic (only if searchQuery is provided)
    if (searchQuery.trim()) {
      const regex = new RegExp(searchQuery, "i");

      andClauses.push({
        $or: [
          { name: regex },
          { description: regex },
          { category: regex },
          { tags: regex },
          { hashtags: regex },
          { "sections.title": regex },
          { "sections.content": regex },
        ]
      });
    }

    // Final combined base query
    const baseQuery = andClauses.length ? { $and: andClauses } : {};

    // ---------- COUNT ----------
    const total = await Product.countDocuments(baseQuery);

    // ---------- CURSOR PAGINATION ----------
    const findQuery =
      cursor && mongoose.isValidObjectId(cursor)
        ? { ...baseQuery, _id: { $lt: new mongoose.Types.ObjectId(cursor) } }
        : baseQuery;

    // ---------- FETCH DATA ----------
   let designs = await Product.find(findQuery)
  // .sort({ hotScore: -1, createdAt: -1 })
  .sort({ createdAt: -1 })

  .limit(limit)
  .populate("postedBy", "name profile handle followers")
  .lean();

    // ---------- SANITIZE + FLAGS ----------
    designs = designs.map((product) => {
      const base = sanitizeProduct(product);
      const isMyProduct = userId
        ? product.postedBy?._id.toString() === userId.toString()
        : false;
      const isFollowing =
        userId && !isMyProduct
          ? product.postedBy?.followers?.some((f) => f.toString() === userId.toString())
          : false;

      return { ...base, isMyProduct, isFollowing };
    });
const hasMore = cursor
  ? (await Product.countDocuments({
      ...baseQuery,
      _id: { $lt: new mongoose.Types.ObjectId(cursor) },
    })) > designs.length
  : designs.length + 0 < total;

const nextCursor =
  hasMore && designs.length
    ? designs[designs.length - 1]._id.toString()
    : null;
    console.log(
      "fetched designs:",
      designs.length,
      "nextCursor:",
      nextCursor,
      "hasMore:",
      hasMore,
      'total products:' ,total
    );
const designsWithFlag = await attachIsAppreciated(
  designs,
  req.user?.id || null,
  "Product"
);

    res.status(200).json({
      results: designsWithFlag,
      limit,
      nextCursor,
      count: total,
      hasMore,
    });
  } catch (error) {
    console.error("Error in getDesign:", error);
    res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};


// export const getDesign = async (req, res) => {
//   try {
//     console.log('getting design called')
//     const userId = req.user?.id || null;
//     const limit = Math.max(1, parseInt(req.query.limit || '10', 10));
//     const cursor = req.query.cursor || null; // <-- new
//     const rawFilters = req.query.filters ? JSON.parse(req.query.filters) : {};
// console.log('limit:', limit, 'cursor:', cursor, 'filters:', rawFilters)
//     // Build Mongo query
//     const andClauses = [];
//     Object.entries(rawFilters).forEach(([key, values]) => {
//       if (!Array.isArray(values) || values.length === 0) return;
//       andClauses.push({
//         sections: {
//           $elemMatch: {
//             title: new RegExp(`^${key}$`, 'i'),
//             content: { $in: values },
//           },
//         },
//       });
//     });
//     const baseQuery = andClauses.length ? { $and: andClauses } : {};

//     // Count total matching docs
//     const total = await Product.countDocuments(baseQuery);

//     // Cursor query
//     const findQuery = cursor && mongoose.isValidObjectId(cursor)
//       ? { ...baseQuery, _id: { $lt: new mongoose.Types.ObjectId(cursor) } }
//       : baseQuery;

//     // Fetch page results
//     let designs = await Product.find(findQuery)
//       .sort({ _id: -1 })
//       .limit(limit)
//       .populate('postedBy', 'name profile handle followers')
//       .lean();

//     // sanitize + flags
//     designs = designs.map(product => {
//       const base = sanitizeProduct(product);
//       const isMyProduct = userId ? product.postedBy?._id.toString() === userId.toString() : false;
//       const isFollowing = userId && !isMyProduct
//         ? product.postedBy?.followers?.some(f => f.toString() === userId.toString())
//         : false;
//       return { ...base, isMyProduct, isFollowing };
//     });

//     const hasMore = designs.length === limit;
//     // set nextCursor only if there actually is more to fetch
//     const nextCursor = hasMore && designs.length ? designs[designs.length - 1]._id.toString() : null;

//     console.log('fetched designs:', designs.length, 'nextCursor:', nextCursor, 'hasMore:', hasMore);

//     res.status(200).json({
//       results: designs,
//       limit,
//       nextCursor,
//       count: total,
//       hasMore,
//     });
//   } catch (error) {
//     console.error('Error in getDesign:', error);
//     res.status(500).json({ success: false, message: 'Internal server error' });
//   }
// };


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
const designsWithFlag = await attachIsAppreciated(
  products,
  req.user?.id || null,
  "Product"
);
      return res.status(200).json({
        success: true,
        products :designsWithFlag,
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

// 🔥 attach appreciation flag (array in → array out)
const [productWithFlag] = await attachIsAppreciated(
  [productWithOwnership],
  userId || null,
  "Product"
);

res.status(200).json({
  success: true,
  product: productWithFlag,
});
  } catch (error) {
    console.error("Error in getDesignByHandle:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};



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
function normalizeImageEntry(entry) {
  if (!entry) return null;
  if (typeof entry === "string") {
    // old Cloudinary string -> try to derive key (may be null)
    return { url: entry, key: getS3KeyFromUrl(entry) || null };
  }
  // already object: { key, url } or similar
  return { key: entry.key || getS3KeyFromUrl(entry.url) || null, url: entry.url };
}

/**
 * POST /post
 * Expect body fields: name, amount, sections (stringified), faq (stringified), hashtags (stringified),
 * image: JSON-stringified array of { key, url } OR array in JSON body (client should send as JSON)
 */
export const postDesign = async (req, res) => {
  try {
    const {
      name,
      amount,
      sections,
      faq,
      hashtags,
      sources,
      description,
      media,
    } = req.body;

    console.log(name, amount, sections, faq, hashtags, sources, description);

const parsedSections =
  typeof sections === "string"
    ? JSON.parse(sections)
    : sections || [];

const parsedFaq =
  typeof faq === "string"
    ? JSON.parse(faq)
    : faq || [];

const parsedHashtags =
  typeof hashtags === "string"
    ? JSON.parse(hashtags)
    : hashtags || [];

const parsedSources =
  typeof sources === "string"
    ? JSON.parse(sources)
    : sources || [];

    // ✅ Handle media (array of { key, url, type, cover })
    let uploadedMedia = [];
    if (media) {
      const parsed =
        typeof media === "string" ? JSON.parse(media) : media;

      uploadedMedia = Array.isArray(parsed)
        ? parsed.filter(
            (m) =>
              m &&
              m.url &&
              m.type &&
              (m.type === "image" || (m.type === "video" && m.cover))
          )
        : [];
    }

    const hasOrigin = parsedSections.some(
      (s) =>
        s &&
        String(s.title).trim().toLowerCase() === "origin"
    );

    const product = new Product({
      name,
      amount,
      media: uploadedMedia, // ✅ changed from image → media
      description,
      sections: parsedSections,
      sources: parsedSources,
      faq: parsedFaq,
      isAsset: hasOrigin,
      hashtags: parsedHashtags,
      postedBy: req.user.id,
    });

    console.log("product posted successfully:", product);

    await product.save();

    res.status(201).json({ success: true, product });
  } catch (error) {
    console.error("postDesign error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /edit/:id
 * Expect in body: name, amount, sections, faq, hashtags, image (array of existing+new {key,url}),
 * removeImages: JSON-stringified array of urls or keys to remove.
 */
export const editDesign = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      amount,
      sections,
      faq,
      sources,
      hashtags,
      removeMedia,
      media,
      description,
    } = req.body;

    const product = await Product.findById(id);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

const parsedSections =
  typeof sections === "string"
    ? JSON.parse(sections)
    : sections || [];

const parsedFaq =
  typeof faq === "string"
    ? JSON.parse(faq)
    : faq || [];

const parsedHashtags =
  typeof hashtags === "string"
    ? JSON.parse(hashtags)
    : hashtags || [];

const parsedSources =
  typeof sources === "string"
    ? JSON.parse(sources)
    : sources || [];


    let updatedMedia = product.media || [];

    // ✅ 1) Handle removals
    if (removeMedia) {
      let toRemove;
      try {
        toRemove =
          typeof removeMedia === "string"
            ? JSON.parse(removeMedia)
            : removeMedia;
      } catch {
        toRemove = Array.isArray(removeMedia)
          ? removeMedia
          : [];
      }

      for (const entry of toRemove) {
        const key =
          typeof entry === "string"
            ? entry.includes("/")
              ? getS3KeyFromUrl(entry)
              : entry
            : entry.key || getS3KeyFromUrl(entry.url);

        if (key) {
          try {
            await deleteObjectByKey(key);
          } catch (err) {
            console.warn(
              "Failed to delete S3 object:",
              key,
              err.message
            );
          }
        }

        updatedMedia = updatedMedia.filter(
          (m) =>
            m.key !== key &&
            m.url !== entry &&
            m.url !== entry?.url
        );
      }
    }

    // ✅ 2) Merge incoming media
    if (media) {
      const incoming =
        typeof media === "string"
          ? JSON.parse(media)
          : media;

      const normalizedIncoming = Array.isArray(incoming)
        ? incoming.filter(
            (m) =>
              m &&
              m.url &&
              m.type &&
              (m.type === "image" ||
                (m.type === "video" && m.cover))
          )
        : [];

      for (const nm of normalizedIncoming) {
        const exists = updatedMedia.some(
          (um) =>
            (um.key && nm.key && um.key === nm.key) ||
            um.url === nm.url
        );

        if (!exists) updatedMedia.push(nm);
      }
    }

    // ✅ Update fields
    product.name = name ?? product.name;
    product.amount = amount ?? product.amount;
    product.sections = parsedSections;
    product.sources = parsedSources;
    product.faq = parsedFaq;
    product.description = description ?? product.description;
    product.hashtags = parsedHashtags;
    product.media = updatedMedia;

    await product.save();

    res.status(200).json({ success: true, product });
  } catch (error) {
    console.error("editDesign error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /delete/:id
 * Delete product and attempt to delete S3 objects (if we have keys).
 */
export const deleteDesign = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    // handle product.image entries which might be objects or legacy strings
    const imgs = (product.image || []).map(normalizeImageEntry).filter(Boolean);
    const deletePromises = imgs.map(async (img) => {
      const key = img.key || getS3KeyFromUrl(img.url);
      if (key) {
        try {
          await deleteObjectByKey(key);
        } catch (err) {
          console.warn("Failed to delete S3 object:", key, err.message);
        }
      }
    });
    await Promise.all(deletePromises);

    await Product.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: 'Product deleted successfully', id });
  } catch (error) {
    console.error("Delete design error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// export const deleteDesign = async (req, res) => {
//   console.log('reach to deleteDesign')
//   const { id } = req.params;

//   try {
//     // Step 1: Find the product by ID
//     const product = await Product.findById(id);
  

//     if (!product) {
//       return res.status(404).json({ success: false, message: 'Product not found' });
//     }

//     // Step 2: Delete associated images from Cloudinary
//     if (product.image && product.image.length > 0) {
//       const deletePromises = product.image.map(async (url) => {
//         // Extract the public ID from the Cloudinary URL
//         const publicId = getCloudinaryPublicId(url);
//         if (publicId) {
//           await cloudinary.uploader.destroy(publicId);
//         }
//       });
//       await Promise.all(deletePromises);
//     }

//     // Step 3: Delete the product from MongoDB
//     await Product.findByIdAndDelete(id);
// console.log('product deleted')
//     res.status(200).json({ success: true, message: 'Product deleted successfully', id });
//   } catch (error) {
//     console.error("Delete design error:", error.message);
//     res.status(500).json({ success: false, message: "Internal server error" });
//   }
// };

// // Helper function to extract Cloudinary public ID from URL
// function getCloudinaryPublicId(imageUrl) {
//   try {
//     const parts = imageUrl.split('/');
//     const fileName = parts[parts.length - 1]; // e.g., 1724402345533-filename.png
//     const publicId = fileName.substring(0, fileName.lastIndexOf('.')); // remove .png or .jpg
//     const folder = parts.slice(parts.indexOf("uploads")).slice(0, -1).join('/'); // e.g., uploads/folder
//     return `${folder}/${publicId}`; // full public ID for Cloudinary
//   } catch (err) {
//     console.error("Failed to parse Cloudinary public_id from URL:", imageUrl);
//     return null;
//   }
// }


// // Configure Cloudinary
//   cloudinary.config({
//       cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//       api_key: process.env.CLOUDINARY_API_KEY,
//       api_secret: process.env.CLOUDINARY_API_SECRET
//   });

//   // Configure Multer to use Cloudinary
//   const storage = new CloudinaryStorage({
//       cloudinary: cloudinary,
//       params: {
//           folder: "uploads", // Cloudinary folder
//           public_id: (req, file) => Date.now() + "-" + file.originalname,
//       },
//   });

//   const upload = multer({ storage });

//   export default upload;



//   export const postDesign = async (req, res) => {
//     console.log("Reached postDesign route");

//     upload.array("images", 10)(req, res, async (err) => {
//       if (err) {
//         console.error("Multer error:", err);
//         return res.status(400).json({ success: false, message: "Image upload failed" });
//       }

//       try {
//         const { name, amount, driveLink, sections, faq, hashtags, sources, description } = req.body;

//         const parsedSections = sections ? JSON.parse(sections) : [];
//         const parsedSources = sources ? JSON.parse(sources): []
//         const parsedHashtags = hashtags ? JSON.parse(hashtags) : [];

//         const parsedFaq = faq ? JSON.parse(faq) : [];

//         const imagePaths = req.files ? req.files.map((file) => file.path) : [];
// const hasOrigin = parsedSections.some(s => {
//   if (!s || !s.title) return false;
//   return String(s.title).trim().toLowerCase() === 'origin';
// });

//         const product = new Product({
//           name,
//           amount,
//           image: imagePaths,
//           driveLink,
//           description,
//           sections: parsedSections,
//           sources : parsedSources,
//           faq: parsedFaq,
//             isAsset: hasOrigin, 
//           hashtags: parsedHashtags, // ✅ correct spelling matches schema
//           postedBy: req.user.id,
//         });
//   const keywords = extractKeywordsProduct(product);
//     await saveKeywords(keywords);
//         await product.save();

//         res.status(201).json({ success: true, product });
//       } catch (error) {
//         console.error("Error:", error.message);
//         res.status(500).json({ success: false, message: error.message });
//       }
//     });
//   };



// export const editDesign = async (req, res) => {
//   console.log("Reached editDesign route");

//   // Handle file uploads with multer
//   upload.array("images", 10)(req, res, async (err) => {
//     if (err) {
//       console.error("Multer error:", err);
//       return res.status(400).json({ success: false, message: "Image upload failed" });
//     }

//     try {
//       const { id } = req.params;
//       const { name, amount, driveLink, sections, faq, sources,  hashtags, removeImages, description } = req.body;
// console.log(removeImages)
//       // 1️⃣ Find the product
//       const product = await Product.findById(id);
//       if (!product) {
//         return res.status(404).json({ success: false, message: "Product not found" });
//       }

//       // 2️⃣ Parse JSON fields safely
//       const parsedSections = sections ? JSON.parse(sections) : product.sections;
//       const parsedFaq = faq ? JSON.parse(faq) : product.faq;
//       const parsedHashtags = hashtags ? JSON.parse(hashtags) : product.hashtags;
//         const parsedSources = sources ? JSON.parse(sources): []


//       // 3️⃣ Handle newly uploaded images (upload to Cloudinary)
//       let newImages = [];
//       if (req.files && req.files.length > 0) {
//         newImages = await Promise.all(
//           req.files.map(async (file) => {
//             const result = await cloudinary.uploader.upload(file.path, {
//               folder: "designs",
//             });
//             return result.secure_url;
//           })
//         );
//       }

//       // 4️⃣ Handle removing old images
//       let updatedImages = [...product.image];
//       if (removeImages) {
//         try {
//           const imagesToRemove = JSON.parse(removeImages); // expect array of URLs
//           for (const url of imagesToRemove) {
//             try {
          
//               if (publicId) {
//                 await cloudinary.uploader.destroy(publicId);
//               }
//             } catch (cloudErr) {
//               console.error("Cloudinary deletion failed for:", url, cloudErr.message);
//             }
//             updatedImages = updatedImages.filter((img) => img !== url);
//           }
//         } catch (parseErr) {
//           console.error("Error parsing removeImages:", parseErr.message);
//         }
//       }

//       // 5️⃣ Merge old images with newly uploaded images
//       updatedImages = [...updatedImages, ...newImages];

//       // 6️⃣ Update product fields
//       product.name = name ?? product.name;
//       product.amount = amount ?? product.amount;
//       product.driveLink = driveLink ?? product.driveLink;
//       product.sections = parsedSections;
//       product.sources = parsedSources;

//       product.faq = parsedFaq;
//       product.description = description
//       product.hashtags = parsedHashtags;
//       product.image = updatedImages;

//       // 7️⃣ Save updated product
//       await product.save();

//       console.log("✅ Product updated successfully:", product, );
//       res.status(200).json({ success: true, product });
//     } catch (error) {
//       console.error("Edit design error:", error.message);
//       res.status(500).json({ success: false, message: error.message });
//     }
//   });
// };