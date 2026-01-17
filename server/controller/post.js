import Post from "../models/post.js";
 import User from "../models/user.js";
import { cloudinary , getCloudinaryPublicId} from "../config/cloudinery.js";
import Notification from "../models/notification.js";
import Product from "../models/designs.js"
import { sanitizeProduct } from "../utils/sanitizeProduct.js";
import { handleVoteNotification } from "../utils/handleVoteNotification.js";
// import { calculateScore } from "../utils/calculateScore.js";
import Vote from "../models/vote.js";
import mongoose from "mongoose";
import { extractKeywordsPost, saveKeywords } from "../utils/extractKeywords.js";
// controllers/assetController.js


// Attach asset to post
export const requestAttachAsset = async (req, res) => {
  console.log('request sending');
  try {
    const { postId, assetId, message } = req.body;
    const userId = req.user.id;

    console.log('User ID:', userId);

    if (!userId) 
     
      return res.status(401).json({ success: false, message: "Unauthorized" });
 console.log('unauthorized')
    const post = await Post.findById(postId);
    const asset = await Product.findById(assetId);

    if (!post || !asset) 
      return res.status(404).json({ success: false, message: "Post or Asset not found" });

    if (!asset.postedBy) 
      return res.status(400).json({ success: false, message: "Asset creator not found" });

    // 🔔 Pick first image from post and asset safely
    const postImage = post.images?.[0] || "";
    const assetImage = asset.image?.[0] || "";

    console.log('Before creating notification', { postId, assetId, postImage, assetImage });

    // 🔔 Send notification to asset creator with images
    await Notification.create({
      recipient: asset.postedBy,
      sender: userId,
      type: "asset_attach_request",
      message: message || `User requested to attach your asset "${asset.name}" to post "${post.name}"`,
      meta: { postId, assetId, postImage, assetImage }
    });

    console.log('request sent');
    res.status(200).json({ success: true, message: "Request sent to asset creator" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const attachAssetToPost = async (req, res) => {
  console.log('attaching asset to post');
  try {
    const { postId, assetId } = req.body;

    const post = await Post.findById(postId);
    const asset = await Product.findById(assetId);


    console.log('Before detach:', { postAssets: post.assets, assetUsedInPosts: asset.usedInPosts });

    if (!post || !asset) {
      return res.status(404).json({ success: false, message: "Post or Asset not found" });
    }

    if (!post.assets.includes(assetId)) {
      post.assets.push(assetId);
      await post.save();
    }

    if (!asset.usedInPosts.includes(postId)) {
      asset.usedInPosts.push(postId);
      await asset.save();
    }

    console.log('attached');
    res.status(200).json({ success: true, asset, message: "Asset attached successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const approveAssetAttachment = async (req, res) => {
  console.log('approving')
  try {
    const { notificationId, approve } = req.body; // approve = true / false
    const adminId = req.user.id;

    const notification = await Notification.findById(notificationId);
    if (!notification) return res.status(404).json({ success: false, message: "Notification not found" });

    const { postId, assetId } = notification.meta;

    const post = await Post.findById(postId);
    const asset = await Product.findById(assetId);
const postImage = post.images?.[0] || "";
    const assetImage = asset.image?.[0] || "";

    if (!post || !asset) return res.status(404).json({ success: false, message: "Post or Asset not found" });

    if (approve) {
      // Attach asset
      if (!post.assets.includes(assetId)) post.assets.push(assetId);
      if (!asset.usedInPosts.includes(postId)) asset.usedInPosts.push(postId);

      await post.save();
      await asset.save();
console.log('approved')
      // ✅ Notify requester
      await Notification.create({
        recipient: notification.sender,
        sender: adminId,
        type: "asset_attach_approved",
        message: `Your request to attach "${asset.name}" to post "${post.name}" has been approved!`,
              meta: { postId, assetId, postImage, assetImage }
      });

      notification.status = "approved";
      await notification.save();

      res.status(200).json({ success: true, message: "Asset attached successfully" });
    } else {
      // Reject → just notify requester
      await Notification.create({
        recipient: notification.sender,
        sender: adminId,
        type: "asset_attach_approved",
        message: `Your request to attach "${asset.name}" to post "${post.name}" has been approved!`,
              meta: { postId, assetId, postImage, assetImage }
      });

      notification.status = "rejected";
      await notification.save();

      res.status(200).json({ success: true, message: "Asset attach request rejected" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};


// Detach asset from post
export const detachAssetFromPost = async (req, res) => {
  console.log('detaching..');
  try {
    const { postId, assetId } = req.body;
    console.log(postId, assetId);

    const post = await Post.findById(postId);
    const asset = await Product.findById(assetId);

    if (!post || !asset) {
      return res.status(404).json({ success: false, message: "Post or Asset not found" });
    }

    // remove from post.assets
    post.assets = post.assets.filter(a => a.toString() !== assetId.toString());
    await post.save();

    // ✅ optional: update asset.usedInPosts only if it exists
    if (asset.usedInPosts && asset.usedInPosts.length) {
      asset.usedInPosts = asset.usedInPosts.filter(p => p.toString() !== postId.toString());
      await asset.save();
    }

    console.log('detached');
    res.status(200).json({ success: true, assetId, message: "Asset detached successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};


export const getPostsOfAsset = async (req, res) => {
  console.log('gettting posts of assets ')
  try {
    const { assetId } = req.params;
   const asset = await Product.findById(assetId).populate({
  path: "usedInPosts",   // first populate posts
  populate: {
    path: "createdBy",   // then populate user inside each post
    select: "name profile handle" // only pick these fields
  }
});


    if (!asset) return res.status(404).json({ success: false, message: "Asset not found" });

    res.status(200).json({ success: true, posts: asset.usedInPosts });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};


export const getAssetsOfPost = async (req, res) => {
  console.log("getting assets of posts");
  try {
    const userId = req.user.id;
    console.log("userId:", userId);

    const { postId } = req.params;
    const post = await Post.findById(postId).populate({
      path: "assets",
      select: "name amount image postedBy",
      populate: {
        path: "postedBy",
        select: "name email handle profile" // user fields from User model
      }
    })

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    // Map over assets and ensure they are plain objects
    const productsWithOwnership = post.assets.map((product) => {
      const plainProduct = product.toObject(); // 👈 removes ._doc wrapper
      return {
        ...sanitizeProduct(plainProduct),
        isMyProduct: userId
          ? product.postedBy?._id.toString() === userId.toString()
          : false,
      };
    });

    console.log("assets with ownership:", productsWithOwnership);

    res.status(200).json({ success: true, assets: productsWithOwnership });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};


// ✅ Create a post
export const createPost = async (req, res) => {
  console.log('Creating post...');
  try {
    const { name, description, category, hashtags, voteFields } = req.body;

    if (!name || !category) {
      return res.status(400).json({ message: "Required fields missing" });
    }
 let categoryArray = [];
    if (typeof category === "string") {
      try {
        const parsed = JSON.parse(category);
        categoryArray = Array.isArray(parsed)
          ? parsed
          : typeof parsed === "string"
          ? parsed.split("/")
          : [];
      } catch {
        categoryArray = category.split("/");
      }
    } else if (Array.isArray(category)) {
      categoryArray = category;
    }

    if (categoryArray.length === 0) {
      return res.status(400).json({ message: "Category array required" });
    }

    let uploadedImages = [];
    if (req.files && req.files.length > 0) {
      uploadedImages = await Promise.all(
        req.files.map(async (file) => {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "posts",
          });
          return result.secure_url;
        })
      );
    }

    const post = new Post({
      name,
      description,
      category: categoryArray,
      hashtags: hashtags ? JSON.parse(hashtags) : [],
      voteFields: voteFields ? JSON.parse(voteFields) : [], // ✅ parse from frontend
      images: uploadedImages,
      createdBy: req.user.id,
        recentNormalVotes: [],
  recentJuryVotes: [],
        score: { averages: {}, totalScore: 0 }    
        
    });
  const keywords = extractKeywordsPost(post);
    await saveKeywords(keywords);
    const savedPost = await post.save();
    console.log('post created successfully')
    res.status(201).json(savedPost);
  } catch (err) {
    console.error("Post creation failed:", err);
    res.status(500).json({ message: err.message || "Internal server error" });
  }
};


export const editPost = async (req, res) => {
  console.log("Editing post...");
  try {
    const { id } = req.params;
    const { name, description, category, hashtags, voteFields, removeImages } = req.body;

    console.log("Images to remove:", removeImages);

    // 1️⃣ Find post
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    // 2️⃣ Handle uploaded new images
    let newImages = [];
    if (req.files && req.files.length > 0) {
      newImages = await Promise.all(
        req.files.map(async (file) => {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "posts",
          });
          return result.secure_url;
        })
      );
    }

    // 3️⃣ Handle removing old images
    let updatedImages = [...post.images];
    if (removeImages) {
      const imagesToRemove = JSON.parse(removeImages);
      for (const url of imagesToRemove) {
        const publicId = getCloudinaryPublicId(url);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
        updatedImages = updatedImages.filter((img) => img !== url);
      }
    }

    // 4️⃣ Merge old + new images
    updatedImages = [...updatedImages, ...newImages];

    // 5️⃣ Parse category like createPost
    let categoryArray = [];
    if (category) {
      if (typeof category === "string") {
        try {
          const parsed = JSON.parse(category);
          categoryArray = Array.isArray(parsed)
            ? parsed
            : typeof parsed === "string"
            ? parsed.split("/")
            : [];
        } catch {
          categoryArray = category.split("/");
        }
      } else if (Array.isArray(category)) {
        categoryArray = category;
      }
    }

    // 6️⃣ Update post fields
    post.name = name || post.name;
    post.description = description || post.description;
    post.category = categoryArray.length ? categoryArray : post.category;
    post.hashtags = hashtags ? JSON.parse(hashtags) : post.hashtags;
    post.voteFields = voteFields ? JSON.parse(voteFields) : post.voteFields;
    post.images = updatedImages;

    // 7️⃣ Save updated post
    await post.save();
    console.log("Post updated successfully");
    return res.status(200).json({ success: true, post });
  } catch (err) {
    console.error("Edit post failed:", err);
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};


export const getDefaultPosts = async (req, res) => {
  console.log("getting default posts");
  try {
    const limit = parseInt(req.query.limit) || 10; // default = 10 posts

    const posts = await Post.find()
      .sort({ createdAt: -1 }) // newest first
      .limit(limit)
      .populate("createdBy", "name profile handle")
      .populate("votes.user", "name profile handle");

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching default posts:", error);
    res.status(500).json({ message: "Server error while fetching default posts" });
  }
};

// ✅ Get all posts (with votes & creator populated)
// controllers/postController.js


export const getPosts = async (req, res) => {
  try {
    const limit = Math.max(1, parseInt(req.query.limit || "10", 10));
    let cursor = req.query.cursor || null;
    const categoryQuery = req.query.category || "";
    const query = req.query.query?.trim() || "";   // 🔥 added search
    const parts = categoryQuery ? categoryQuery.split(",").map(c => c.trim()) : [];

    const total = await Post.countDocuments({});

    console.log(
      "category filter:", parts.join(", ") || "none",
      "query:", query || "none",
      "cursor:", cursor,
      "limit:", limit
    );

    // 🔥 Build search conditions
    let searchCondition = {};
    if (query) {
      const regex = { $regex: query, $options: "i" };
      searchCondition = {
        $or: [
          { name: regex },
          { description: regex },
          { category: regex },
          { hashtags: regex },
        ]
      };
    }

    // ------------------------------------------------------------
    // CASE 1: NO CATEGORY FILTER
    // ------------------------------------------------------------
    if (!parts.length) {
      const findQuery = {
        ...searchCondition, // 🔥 apply search
        ...(cursor && mongoose.isValidObjectId(cursor)
          ? { _id: { $lt: new mongoose.Types.ObjectId(cursor) } }
          : {})
      };

      const posts = await Post.find(findQuery)
        .sort({ _id: -1 })
        .limit(limit)
        .populate("createdBy", "name profile handle")
        .select("-__v")
        .lean();

      const nextCursor = posts.length ? posts[posts.length - 1]._id.toString() : null;
      const hasMore = posts.length === limit;

      return res.json({
        success: true,
        results: posts,
        limit,
        nextCursor,
        count: total,
        hasMore,
      });
    }

    // ------------------------------------------------------------
    // CASE 2: CATEGORY FILTER
    // ------------------------------------------------------------

    // 🔥 apply search inside filtered docs
    const filteredDocs = await Post.find({
      category: { $in: parts },
      ...searchCondition, // 🔥 added
    })
      .sort({ createdAt: -1 })
      .select("_id")
      .lean();

    const nonFilteredDocs = await Post.find({
      category: { $nin: parts },
      ...searchCondition, // 🔥 added
    })
      .sort({ createdAt: -1 })
      .select("_id")
      .lean();

    const combinedIds = [
      ...filteredDocs.map(d => d._id.toString()),
      ...nonFilteredDocs.map(d => d._id.toString()),
    ];

    const totalCombined = combinedIds.length;

    const startIndex =
      cursor && combinedIds.includes(cursor)
        ? combinedIds.indexOf(cursor) + 1
        : 0;

    if (startIndex >= totalCombined) {
      return res.json({
        success: true,
        results: [],
        limit,
        nextCursor: null,
        count: total,
        hasMore: false,
      });
    }

    const pagedIdStrings = combinedIds.slice(startIndex, startIndex + limit);

    if (!pagedIdStrings.length) {
      return res.json({
        success: true,
        results: [],
        limit,
        nextCursor: null,
        count: total,
        hasMore: false,
      });
    }

    const objectIds = pagedIdStrings.map(id => new mongoose.Types.ObjectId(id));

    const posts = await Post.find({ _id: { $in: objectIds } })
      .populate("createdBy", "name profile handle")
      .select("-__v")
      .lean();

    const orderedPosts = pagedIdStrings.map(id =>
      posts.find(p => p._id.toString() === id)
    );

    const nextCursor = pagedIdStrings.length
      ? pagedIdStrings[pagedIdStrings.length - 1]
      : null;

    const hasMore = startIndex + limit < totalCombined;

    return res.json({
      success: true,
      results: orderedPosts,
      limit,
      nextCursor,
      count: total,
      hasMore,
    });

  } catch (err) {
    console.error("Error getting posts:", err);
    res.status(500).json({ message: err.message });
  }
};

// export const getPosts = async (req, res) => {
//   try {
//     const limit = Math.max(1, parseInt(req.query.limit || "10", 10));
//     let cursor = req.query.cursor || null;
//     const categoryQuery = req.query.category || "";
//     const parts = categoryQuery ? categoryQuery.split(",").map(c => c.trim()) : [];

//     const total = await Post.countDocuments({});

//     console.log("category filter:", parts.join(", ") || "none", "cursor:", cursor, "limit:", limit);

//     // ---- CASE 1: NO CATEGORY FILTER ----
//     if (!parts.length) {
//       // Validate cursor first
//       const findQuery = (cursor && mongoose.isValidObjectId(cursor))
//         ? { _id: { $lt: new mongoose.Types.ObjectId(cursor) } }
//         : {};

//       const posts = await Post.find(findQuery)
//         .sort({ _id: -1 })
//         .limit(limit)
//         .populate("createdBy", "name profile handle")
//         .select("-__v")
//         .lean();

//       const nextCursor = posts.length ? posts[posts.length - 1]._id.toString() : null;
//       const hasMore = posts.length === limit;

//       return res.json({
//         success: true,
//         results: posts,
//         limit,
//         nextCursor,
//         count: total,
//         hasMore,
//       });
//     }

//     // ---- CASE 2: CATEGORY FILTER ----
//     const filteredDocs = await Post.find({ category: { $in: parts } })
//       .sort({ createdAt: -1 })
//       .select("_id")
//       .lean();

//     const nonFilteredDocs = await Post.find({ category: { $nin: parts } })
//       .sort({ createdAt: -1 })
//       .select("_id")
//       .lean();

//     const combinedIds = [
//       ...filteredDocs.map(d => d._id.toString()),
//       ...nonFilteredDocs.map(d => d._id.toString()),
//     ];

//     const totalCombined = combinedIds.length;

//     // If cursor supplied but not valid, treat it as null (start from 0)
//     const startIndex = (cursor && combinedIds.includes(cursor))
//       ? combinedIds.indexOf(cursor) + 1
//       : 0;

//     if (startIndex >= totalCombined) {
//       return res.json({
//         success: true,
//         results: [],
//         limit,
//         nextCursor: null,
//         count: total,
//         hasMore: false,
//       });
//     }

//     const pagedIdStrings = combinedIds.slice(startIndex, startIndex + limit);
//     if (!pagedIdStrings.length) {
//       return res.json({
//         success: true,
//         results: [],
//         limit,
//         nextCursor: null,
//         count: total,
//         hasMore: false,
//       });
//     }

//     // map to ObjectId safely (we built these from real _id strings so they are valid)
//     const objectIds = pagedIdStrings.map(id => new mongoose.Types.ObjectId(id));
//     const posts = await Post.find({ _id: { $in: objectIds } })
//       .populate("createdBy", "name profile handle")
//       .select("-__v")
//       .lean();

//     const orderedPosts = pagedIdStrings.map(id => posts.find(p => p._id.toString() === id));

//     const nextCursor = pagedIdStrings.length ? pagedIdStrings[pagedIdStrings.length - 1] : null;
//     const hasMore = startIndex + limit < totalCombined;

//     return res.json({
//       success: true,
//       results: orderedPosts,
//       limit,
//       nextCursor,
//       count: total,
//       hasMore,
//     });

//   } catch (err) {
//     console.error("Error getting posts:", err);
//     res.status(500).json({ message: err.message });
//   }
// };
// export const getPosts = async (req, res) => {
//   try {
//     const page = Math.max(1, parseInt(req.query.page || '1', 10));
//     const limit = Math.max(1, parseInt(req.query.limit || '10', 10));
//     const categoryQuery = req.query.category || '';
//     const parts = categoryQuery ? categoryQuery.split(',').map(c => c.trim()) : [];
//     const skip = (page - 1) * limit;

//     console.log("category filter:", parts.join(', ') || 'none', page, limit);

//     let posts = [];
//     let total = await Post.countDocuments({}); // total posts count (for client ref)

//     if (parts.length) {
//       // Count totals
//       const totalMatching = await Post.countDocuments({ category: { $in: parts } });
//       const totalNonMatching = total - totalMatching;

//       // If we still have filtered posts left in the current page range
//       if (skip < totalMatching) {
//         // 1️⃣ Get matching posts for this page
//         const matchingPosts = await Post.find({ category: { $in: parts } })
//           .sort({ createdAt: -1 })
//           .skip(skip)
//           .limit(limit)
//           .populate([
//             { path: 'createdBy', select: 'name profile handle' },
//             { path: 'votes.user', select: 'name profile handle' },
//           ]);

//         posts = matchingPosts;

//         // If this page still has room (e.g. last filtered page not full), fill with others
//         if (matchingPosts.length < limit && skip + limit > totalMatching) {
//           const remaining = limit - matchingPosts.length;
//           const nonMatchingSkip = Math.max(0, skip + matchingPosts.length - totalMatching);

//           const extra = await Post.find({ category: { $nin: parts } })
//             .sort({ createdAt: -1 })
//             .skip(nonMatchingSkip)
//             .limit(remaining)
//             .populate([
//               { path: 'createdBy', select: 'name profile handle' },
//               { path: 'votes.user', select: 'name profile handle' },
//             ]);

//           posts = [...matchingPosts, ...extra];
//         }
//       } else {
//         // 2️⃣ All filtered posts exhausted — continue with non-matching posts
//         const nonMatchingSkip = skip - totalMatching;

//         posts = await Post.find({ category: { $nin: parts } })
//           .sort({ createdAt: -1 })
//           .skip(nonMatchingSkip)
//           .limit(limit)
//           .populate([
//             { path: 'createdBy', select: 'name profile handle' },
//             { path: 'votes.user', select: 'name profile handle' },
//           ]);
//       }
//     } else {
//       // No filter
//       posts = await Post.find({})
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(limit)
//         .populate([
//           { path: 'createdBy', select: 'name profile handle' },
//           { path: 'votes.user', select: 'name profile handle' },
//         ]);
//     }

//     res.json({
//       results: posts,
//       page,
//       limit,
//       count: total,
//     });
//   } catch (err) {
//     console.error('Error getting posts:', err);
//     res.status(500).json({ message: err.message });
//   }
// };
// controllers/postController.js (update getPosts)


// export const getPosts = async (req, res) => {
//   try {
//     const page = Math.max(1, parseInt(req.query.page || "1"));
//     const limit = Math.max(1, parseInt(req.query.limit || "10"));
//     const skip = (page - 1) * limit;

//     const categoryQuery = req.query.category || "";
//     const parts = categoryQuery
//       ? categoryQuery.split(",").map(c => c.trim())
//       : [];

//     // total posts count
//     const total = await Post.countDocuments({});

//     // ---- CASE 1: NO CATEGORY FILTER ----
//     if (!parts.length) {
//       const posts = await Post.find({})
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(limit)
//         .populate("createdBy", "name profile handle")
//         .select("-__v")
//         .lean();

//       return res.json({
//         success: true,
//         results: posts,
//         page,
//         limit,
//         count: total,
//         hasMore: page * limit < total,
//       });
//     }

//     // ---- CASE 2: CATEGORY FILTER PRESENT ----

//     // filtered first
//     const filtered = await Post.find({ category: { $in: parts } })
//       .sort({ createdAt: -1 })
//       .select("_id")
//       .lean();

//     // then non-filtered
//     const nonFiltered = await Post.find({ category: { $nin: parts } })
//       .sort({ createdAt: -1 })
//       .select("_id")
//       .lean();

//     const combinedIds = [
//       ...filtered.map(d => d._id),
//       ...nonFiltered.map(d => d._id),
//     ];

//     const pagedIds = combinedIds.slice(skip, skip + limit);

//     if (!pagedIds.length) {
//       return res.json({
//         success: true,
//         results: [],
//         page,
//         limit,
//         count: total,
//         hasMore: false,
//       });
//     }

//     // fetch posts in original filtered-first sorted order
//     const posts = await Post.find({ _id: { $in: pagedIds } })
//       .populate("createdBy", "name profile handle")
//       .select("-__v")
//       .lean();

//     // reorder manually to match pagedIds order
//     const orderedPosts = pagedIds.map(id =>
//       posts.find(p => p._id.toString() === id.toString())
//     );

//     return res.json({
//       success: true,
//       results: orderedPosts,
//       page,
//       limit,
//       count: total,
//       hasMore: page * limit < combinedIds.length,
//     });

//   } catch (err) {
//     console.error("Error getting posts:", err);
//     res.status(500).json({ message: err.message });
//   }
// };


export const searchPosts = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "Search query is required" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
console.log(`Searching posts for query: "${query}" | page: ${page}, limit: ${limit}`);
    const posts = await Post.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
        { hashtags: { $regex: query, $options: "i" } },
      ],
    })
      .populate("createdBy", "name profile handle")
      .populate("votes.user", "name profile handle")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }) // optional
      .lean();

    return res.status(200).json({
      page,
      limit,
      count: posts.length,
      results: posts,
    });
  } catch (error) {
    console.error("Error in searchPosts:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


// ✅ Get single post by ID (with votes populated)
export const getPostById = async (req, res) => {
  console.log("getting post by id");

  try {
    const userId = req.user?.id; // logged-in user
    const post = await Post.findById(req.params.id)
      .populate("createdBy", "name profile handle")
      .populate("votes.user", "name profile handle");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // convert mongoose doc → plain object
    const postObj = post.toObject();

    // add isMyPost flag
    postObj.isMyPost = userId
      ? post.createdBy?._id.toString() === userId.toString()
      : false;

    res.json(postObj);
    console.log("got the post");
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const getPostsByHandle = async (req, res) => {
  try {
    const { handle } = req.params;
    const limit = Math.max(1, parseInt(req.query.limit || "10"));
    const page = Math.max(1, parseInt(req.query.page || "1"));

    const user = await User.findOne({ handle })
      .select("_id name profile handle")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const total = await Post.countDocuments({ createdBy: user._id });

    const posts = await Post.find({ createdBy: user._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("createdBy", "name profile handle")
      .select("-__v")
      .lean();

    // POSTS ALREADY CONTAIN recentNormalVotes & recentJuryVotes
    return res.json({
      success: true,
      results: posts,
      page,
      limit,
      count: total,
      hasMore: page * limit < total,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// export const getPostsByHandle = async (req, res) => {
//   try {
//     const { handle } = req.params;
//     const limit = Math.max(1, parseInt(req.query.limit || "10", 10));
//     const page = Math.max(1, parseInt(req.query.page || "1", 10));

//     // 1) Find user
//     const user = await User.findOne({ handle })
//       .select("_id name profile handle")
//       .lean();

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // 2) Count total posts
//     const total = await Post.countDocuments({ createdBy: user._id });

//     if (total === 0) {
//       return res.json({
//         success: true,
//         results: [],
//         page,
//         limit,
//         count: 0,
//         hasMore: false,
//       });
//     }

//     const skip = (page - 1) * limit;

//     // 3) Fetch posts (only Post collection — high performance)
//     const posts = await Post.find({ createdBy: user._id })
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit)
//       .populate("createdBy", "name profile handle")
//       .lean();

//     const postIds = posts.map(p => p._id);

//     // ----------------------------------------------------
//     // 4) Fetch ONLY last 4 normal votes per post
//     // ----------------------------------------------------
//     const normalVotes = await Vote.aggregate([
//       { $match: { post: { $in: postIds }, } },
//       { $lookup: {
//           from: "users",
//           localField: "user",
//           foreignField: "_id",
//           as: "user",
//           pipeline: [{ $project: { name: 1, profile: 1, handle: 1, role: 1 }}]
//       }},
//       { $unwind: "$user" },
//       { $match: { "user.role": { $ne: "jury" }}},
//       { $sort: { createdAt: -1 }},
//       {
//         $group: {
//           _id: "$post",
//           votes: { $push: "$$ROOT" }
//         }
//       },
//       {
//         $project: {
//           votes: { $slice: ["$votes", 4] }
//         }
//       }
//     ]);

//     // ----------------------------------------------------
//     // 5) Fetch ONLY last 4 jury votes per post
//     // ----------------------------------------------------
//     const juryVotes = await Vote.aggregate([
//       { $match: { post: { $in: postIds }, } },
//       { $lookup: {
//           from: "users",
//           localField: "user",
//           foreignField: "_id",
//           as: "user",
//           pipeline: [{ $project: { name: 1, profile: 1, handle: 1, role: 1 }}]
//       }},
//       { $unwind: "$user" },
//       { $match: { "user.role": "jury" }},
//       { $sort: { createdAt: -1 }},
//       {
//         $group: {
//           _id: "$post",
//           votes: { $push: "$$ROOT" }
//         }
//       },
//       {
//         $project: {
//           votes: { $slice: ["$votes", 4] }
//         }
//       }
//     ]);

//     // Convert arrays into lookup objects
//     const normalByPost = Object.fromEntries(normalVotes.map(v => [String(v._id), v.votes]));
//     const juryByPost   = Object.fromEntries(juryVotes.map(v => [String(v._id), v.votes]));

//     // ----------------------------------------------------
//     // 6) Attach votes and return final response
//     // ----------------------------------------------------
//     const results = posts.map(post => {
//       const pid = String(post._id);

//       const recentNormalVotes = normalByPost[pid] || [];
//       const recentJuryVotes   = juryByPost[pid] || [];

//       return {
//         ...post,
//         recentNormalVotes,
//         recentJuryVotes,
//         totalVotesCount: recentNormalVotes.length
//       };
//     });

//     return res.json({
//       success: true,
//       results,
//       page,
//       limit,
//       count: total,
//       hasMore: page * limit < total,
//     });

//   } catch (err) {
//     console.error("Error in getPostsByHandle:", err);
//     return res.status(500).json({ message: err.message });
//   }
// };

// export const getPostsByHandle = async (req, res) => {
//   console.log("Getting posts by handle:", req.params.handle);

//   try {
//     const { handle } = req.params;
//     const limit = parseInt(req.query.limit || "10", 10);
//     const page = parseInt(req.query.page || "1", 10);

//     // Find user
//     const user = await User.findOne({ handle });
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Total posts
//     const total = await Post.countDocuments({ createdBy: user._id });
//     if (total === 0) {
//       return res.json({
//         success: true,
//         results: [],
//         page,
//         limit,
//         count: 0,
//         hasMore: false,
//       });
//     }

//     const skip = (page - 1) * limit;

//     // -------- Fetch posts --------
//     const posts = await Post.find({ createdBy: user._id })
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit)
//       .populate("createdBy", "name profile handle")
//       .lean();

//     const postIds = posts.map(p => String(p._id)); // force strings for consistent keys

//     // -------- Fetch votes for these posts --------
//     const votes = await Vote.find({ post: { $in: postIds } })
//       .populate("user", "name profile handle role")
//       .sort({ createdAt: -1 })
//       .lean();

//     // -------- Group votes per post (separate normal/jury) --------
//     const votesByPost = {};
//     postIds.forEach(id => {
//       votesByPost[id] = { recentNormalVotes: [], recentJuryVotes: [] };
//     });

//     for (const v of votes) {
//       const pid = String(v.post);
//       if (!votesByPost[pid]) continue;

//       // DEFENSIVE role extraction:
//       const role = v.user && v.user.role ? String(v.user.role).trim().toLowerCase() : null;

//       if (role === "jury") {
//         if (votesByPost[pid].recentJuryVotes.length < 4) {
//           votesByPost[pid].recentJuryVotes.push(v);
//         }
//       } else {
//         // If role is missing (null) we'll treat as non-jury — but log briefly if needed
//         // If you want to treat missing role as jury, change this behavior accordingly.
//         if (votesByPost[pid].recentNormalVotes.length < 4) {
//           votesByPost[pid].recentNormalVotes.push(v);
//         }
//       }
//     }

//     // -------- Attach votes into posts --------
//     const final = posts.map(p => {
//       const pid = String(p._id);
//       return {
//         ...p,
//         recentNormalVotes: votesByPost[pid].recentNormalVotes,
//         recentJuryVotes: votesByPost[pid].recentJuryVotes,
//         totalVotesCount: votesByPost[pid].recentNormalVotes.length,
//       };
//     });

//     return res.json({
//       success: true,
//       results: final,
//       page,
//       limit,
//       count: total,
//       hasMore: page * limit < total,
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: err.message });
//   }
// };


// export const getPostsByHandle = async (req, res) => {
//   console.log("Getting posts by handle:", req.params.handle);

//   try {
//     const { handle } = req.params;
//     const limit = parseInt(req.query.limit || "10", 10);
//     const page = parseInt(req.query.page || "1", 10);

//     // Find user
//     const user = await User.findOne({ handle });
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Total posts
//     const total = await Post.countDocuments({ createdBy: user._id });
//     if (total === 0) {
//       return res.json({
//         success: true,
//         results: [],
//         page,
//         limit,
//         count: 0,
//         hasMore: false,
//       });
//     }

//     const skip = (page - 1) * limit;

//     // -------- Fetch posts (fast) --------
//     const posts = await Post.find({ createdBy: user._id })
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit)
//       .populate("createdBy", "name profile handle")
//       .lean();

//     const postIds = posts.map(p => p._id);

//     // -------- Fetch ALL votes for these posts (in 1 query!) --------
//     const votes = await Vote.find({ post: { $in: postIds } })
//       .populate("user", "name profile handle role")
//       .sort({ createdAt: -1 }) // newest first
//       .lean();

//     // -------- Group votes per post --------
//     const votesByPost = {};
//     postIds.forEach(id => {
//       votesByPost[id] = { normal: [], jury: [] };
//     });

//     for (const v of votes) {
//       const pid = String(v.post);
//       if (!votesByPost[pid]) continue;

//       if (v.user.role === "jury") {
//           if (votesByPost[pid].jury.length < 4)
//             votesByPost[pid].jury.push(v);
//       } else {
//           if (votesByPost[pid].normal.length < 4)
//             votesByPost[pid].normal.push(v);
//       }
//     }

//     // -------- Attach votes into posts --------
//     const final = posts.map(p => {
//       const pid = String(p._id);
//       return {
//         ...p,
//         recentNormalVotes: votesByPost[pid].normal,
//         recentJuryVotes: votesByPost[pid].jury,
//         totalVotesCount: votesByPost[pid].normal.length,
//       };
//     });

//     return res.json({
//       success: true,
//       results: final,
//       page,
//       limit,
//       count: total,
//       hasMore: page * limit < total,
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: err.message });
//   }
// };


// export const getPostsByHandle = async (req, res) => {
//   console.log("Getting posts by handle:", req.params.handle);

//   try {
//     const { handle } = req.params;
//     const limit = parseInt(req.query.limit || "10", 10);
//     const page = parseInt(req.query.page || "1", 10);

//     // Find user
//     const user = await User.findOne({ handle });
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Count posts
//     const total = await Post.countDocuments({ createdBy: user._id });

//     if (total === 0) {
//       return res.json({
//         success: true,
//         results: [],
//         page,
//         limit,
//         count: 0,
//         hasMore: false,
//       });
//     }

//     const skip = (page - 1) * limit;

//     // ------- NEW PIPELINE (same as getPosts) -------
//     const results = await Post.aggregate([
//       { $match: { createdBy: user._id } },
//       { $sort: { createdAt: -1 } },
//       { $skip: skip },
//       { $limit: limit },

//       // populate createdBy
//       {
//         $lookup: {
//           from: "users",
//           localField: "createdBy",
//           foreignField: "_id",
//           as: "createdBy"
//         }
//       },
//       { $unwind: "$createdBy" },

//       // recent normal votes
//       {
//         $lookup: {
//           from: "votes",
//           let: { postId: "$_id" },
//           pipeline: [
//             { $match: { $expr: { $eq: ["$post", "$$postId"] } } },
//             {
//               $lookup: {
//                 from: "users",
//                 localField: "user",
//                 foreignField: "_id",
//                 as: "userDoc"
//               }
//             },
//             { $unwind: "$userDoc" },
//             { $match: { "userDoc.role": { $ne: "jury" } } },
//             { $sort: { createdAt: -1 } },
//             { $limit: 4 },
//             {
//               $project: {
//                 _id: 1,
//                 fields: 1,
//                 totalVote: 1,
//                 createdAt: 1,
//                 user: {
//                   _id: "$userDoc._id",
//                   name: "$userDoc.name",
//                   profile: "$userDoc.profile",
//                   handle: "$userDoc.handle",
//                   role: "$userDoc.role"
//                 }
//               }
//             }
//           ],
//           as: "recentNormalVotes"
//         }
//       },

//       // recent jury votes
//       {
//         $lookup: {
//           from: "votes",
//           let: { postId: "$_id" },
//           pipeline: [
//             { $match: { $expr: { $eq: ["$post", "$$postId"] } } },
//             {
//               $lookup: {
//                 from: "users",
//                 localField: "user",
//                 foreignField: "_id",
//                 as: "userDoc"
//               }
//             },
//             { $unwind: "$userDoc" },
//             { $match: { "userDoc.role": "jury" } },
//             { $sort: { createdAt: -1 } },
//             { $limit: 4 },
//             {
//               $project: {
//                 _id: 1,
//                 fields: 1,
//                 totalVote: 1,
//                 createdAt: 1,
//                 user: {
//                   _id: "$userDoc._id",
//                   name: "$userDoc.name",
//                   profile: "$userDoc.profile",
//                   handle: "$userDoc.handle",
//                   role: "$userDoc.role"
//                 }
//               }
//             }
//           ],
//           as: "recentJuryVotes"
//         }
//       },

//       // add counts
//       {
//         $addFields: {
//           totalVotesCount: { $size: { $ifNull: ["$recentNormalVotes", []] } }
//         }
//       },

//       { $project: { votes: 0 } }
//     ]);

//     return res.json({
//       success: true,
//       results,
//       page,
//       limit,
//       count: total,
//       hasMore: page * limit < total,
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: err.message });
//   }
// };

// export const getPostsByHandle = async (req, res) => {
//   console.log("Getting posts by handle:", req.params.handle);

//   try {
//     const { handle } = req.params;
//     const limit = parseInt(req.query.limit || "10", 10);
//     const page = parseInt(req.query.page || "1", 10);

//     // Find user
//     const user = await User.findOne({ handle });
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Get total count first
//     const total = await Post.countDocuments({ createdBy: user._id });

//     if (total === 0) {
//       return res.json({
//         success: true,
//         results: [],
//         page,
//         limit,
//         count: 0,
//         hasMore: false,
//       });
//     }

//     // Pagination calculation
//     const skip = (page - 1) * limit;

//     // Fetch only required posts
//     const results = await Post.find({ createdBy: user._id })
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit)
//       .populate("createdBy", "name profile handle")
//       .populate("votes.user", "name profile handle")
//       .lean();

//     res.json({
//       success: true,
//       results,
//       page,
//       limit,
//       count: total,
//       hasMore: page * limit < total,
//     });

//     console.log(`Returned page ${page} (${results.length} posts) for:`, handle);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: err.message });
//   }
// };

// ✅ Delete post by postId
export const deletePost = async (req, res) => {
  console.log('Deleting post...');
  try {
    const { id } = req.params;
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // ✅ Allow only post creator or admin to delete
    if (post.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete this post" });
    }

    // ✅ Delete images from Cloudinary
    if (post.images && post.images.length > 0) {
      await Promise.all(
        post.images.map(async (imageUrl) => {
          const publicId = imageUrl.split("/").slice(-2).join("/").split(".")[0];
          await cloudinary.uploader.destroy(publicId);
        })
      );
    }

    await Post.findByIdAndDelete(id);
    console.log('Post deleted successfully');
    res.json({ message: "Post deleted successfully" });

  } catch (err) {
    console.error("Post deletion failed:", err);
    res.status(500).json({ message: err.message || "Internal server error" });
  }
};


export const votePost = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const postId = req.params.id;
    const userId = req.user.id;
console.log(req.user)
    // 1) parse fields & compute totalVote
    const fields = {};
    for (const k in req.body) {
      const v = Number(req.body[k]);
      if (!Number.isNaN(v)) fields[k] = v;
    }
    const values = Object.values(fields);
    const totalVote = values.length ? values.reduce((a,b) => a+b,0) / values.length : null;

    // start transaction (recommended)
    session.startTransaction();

    // 2) load post (with voteFields & voteStats)
    const post = await Post.findById(postId).session(session);
    if (!post) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Post not found" });
    }

    const voteFields = post.voteFields || [];

    // 3) find existing vote (if any)
    const existingVote = await Vote.findOne({ post: postId, user: userId }).session(session);

    // 4) upsert the Vote (we'll use findOneAndUpdate)
    const upsertedVote = await Vote.findOneAndUpdate(
      { post: postId, user: userId },
      { $set: { fields, totalVote, userRole: req.user.role  } },
      { upsert: true, new: true, setDefaultsOnInsert: true, session }
    ).populate("user", "name profile handle role");

    // 5) Update post.voteStats (incremental)
    const role = (upsertedVote.user && upsertedVote.user.role) ? upsertedVote.user.role : "normal";
    const roleKey = role === "jury" ? "jury" : "normal";

    // Ensure sums objects exist
    post.voteStats = post.voteStats || { normal: { count: 0, sums: {} }, jury: { count: 0, sums: {} } };
    post.voteStats.normal = post.voteStats.normal || { count: 0, sums: {} };
    post.voteStats.jury = post.voteStats.jury || { count: 0, sums: {} };

    if (!existingVote) {
      // increment count ONCE per vote
      post.voteStats[roleKey].count = (post.voteStats[roleKey].count || 0) + 1;

      // add sums per field
      for (const fieldName of voteFields) {
        const newVal = typeof fields[fieldName] === "number" ? fields[fieldName] : 0;
        const prev = post.voteStats[roleKey].sums[fieldName] || 0;
        post.voteStats[roleKey].sums[fieldName] = prev + newVal;
      }
    } else {
      // update sums for each field
      for (const fieldName of voteFields) {
        const newVal = typeof fields[fieldName] === "number" ? fields[fieldName] : 0;
        const oldVal = existingVote?.fields?.[fieldName] ?? 0;
        const delta = newVal - oldVal;
        const prev = post.voteStats[roleKey].sums[fieldName] || 0;
        post.voteStats[roleKey].sums[fieldName] = prev + delta;
      }
    }

    // 6) Update recent votes array (update existing entry or unshift)
    const voteData = {
      user: {
        _id: upsertedVote.user._id,
        name: upsertedVote.user.name,
        profile: upsertedVote.user.profile,
        handle: upsertedVote.user.handle,
        role: upsertedVote.user.role
      },
      userRole: upsertedVote.user.role,
      fields: upsertedVote.fields,
      totalVote: upsertedVote.totalVote,
      votedAt: new Date()
    };
console.log("voteData:", voteData);
    const arr = roleKey === "jury" ? post.recentJuryVotes : post.recentNormalVotes;
    const idx = arr.findIndex(v => String(v.user._id) === String(upsertedVote.user._id));
if (idx !== -1) {

  arr[idx].user = voteData.user;   // ✅ THIS LINE FIXES EVERYTHING

  arr[idx].fields = voteData.fields;
  arr[idx].totalVote = voteData.totalVote;
  arr[idx].votedAt = voteData.votedAt;
} else {
  arr.unshift(voteData);
  if (arr.length > 4) arr.pop();
}
    // 7) Recompute score from post.voteStats
    const averages = {};
    for (const f of voteFields) {
      const juryCount = post.voteStats.jury.count || 0;
      const normalCount = post.voteStats.normal.count || 0;

      const jurySum = post.voteStats.jury.sums?.[f] ?? 0;
      const normalSum = post.voteStats.normal.sums?.[f] ?? 0;

      const juryAvg = juryCount > 0 ? jurySum / juryCount : null;
      const normalAvg = normalCount > 0 ? normalSum / normalCount : null;

      let weighted = 0;
      if (juryAvg !== null && normalAvg !== null) weighted = juryAvg * 0.6 + normalAvg * 0.4;
      else if (juryAvg !== null) weighted = juryAvg;
      else if (normalAvg !== null) weighted = normalAvg;
      else weighted = 0;

      averages[f] = Number(weighted.toFixed(2));
    }

    const totalScore = Number((Object.values(averages).reduce((s, v) => s + v, 0) / (voteFields.length || 1)).toFixed(1));
    post.score = { averages, totalScore };

    // 8) Save post (inside transaction)
    await post.save({ session });

    // commit
    await session.commitTransaction();
    session.endSession();

    // 9) Return populated updated post (quick read)
    const updatedPost = await Post.findById(postId)
      .populate("createdBy", "name profile handle")
      .lean();

    // emit socket (outside txn)
    const io = req.app.get("io");
    io.emit("vote:update", { updatedPost });
  if (String(updatedPost.createdBy._id) !== String(userId)) {
      await handleVoteNotification(
        updatedPost.createdBy._id,
        updatedPost._id,
        userId
      );
    }
    
    return res.json({ post: updatedPost });

  } catch (err) {
    try { await session.abortTransaction(); } catch (e) {}
    session.endSession();
    console.error("votePost error:", err);
    return res.status(500).json({ message: err.message });
  }
};

// export const votePost = async (req, res) => {
//   const session = await mongoose.startSession();
//   try {
//     const postId = req.params.id;
//     const userId = req.user.id;

//     // 1) parse fields & compute totalVote
//     const fields = {};
//     for (const k in req.body) {
//       const v = Number(req.body[k]);
//       if (!Number.isNaN(v)) fields[k] = v;
//     }
//     const values = Object.values(fields);
//     const totalVote = values.length ? values.reduce((a,b) => a+b,0) / values.length : null;

//     // start transaction (recommended)
//     session.startTransaction();

//     // 2) load post (with voteFields & voteStats)
//     const post = await Post.findById(postId).session(session);
//     if (!post) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(404).json({ message: "Post not found" });
//     }

//     const voteFields = post.voteFields || [];

//     // 3) find existing vote (if any)
//     const existingVote = await Vote.findOne({ post: postId, user: userId }).session(session);

//     // 4) upsert the Vote (we'll use findOneAndUpdate)
//     const upsertedVote = await Vote.findOneAndUpdate(
//       { post: postId, user: userId },
//       { $set: { fields, totalVote } },
//       { upsert: true, new: true, setDefaultsOnInsert: true, session }
//     ).populate("user", "name profile handle role");

//     // 5) Update post.voteStats (incremental)
//     const role = (upsertedVote.user && upsertedVote.user.role) ? upsertedVote.user.role : "normal";
//     const roleKey = role === "jury" ? "jury" : "normal";

//     // Ensure sums objects exist
//     post.voteStats = post.voteStats || { normal: { count: 0, sums: {} }, jury: { count: 0, sums: {} } };
//     post.voteStats.normal = post.voteStats.normal || { count: 0, sums: {} };
//     post.voteStats.jury = post.voteStats.jury || { count: 0, sums: {} };

//     // For each vote field, compute delta = new - old (old 0 if missing)
//     for (const fieldName of voteFields) {
//       const newVal = typeof fields[fieldName] === "number" ? fields[fieldName] : 0;
//       const oldVal = existingVote?.fields?.[fieldName] ?? null;

//       if (existingVote) {
//         // update (counts unchanged) — adjust sums by delta
//         const delta = newVal - (oldVal === null ? 0 : oldVal);
//         const prev = post.voteStats[roleKey].sums[fieldName] || 0;
//         post.voteStats[roleKey].sums[fieldName] = prev + delta;
//       } else {
//         // insert — increment count & add sum
//         post.voteStats[roleKey].count = (post.voteStats[roleKey].count || 0) + 1;
//         const prev = post.voteStats[roleKey].sums[fieldName] || 0;
//         post.voteStats[roleKey].sums[fieldName] = prev + newVal;
//       }
//     }

//     // If the user changed role (very rare), you'd need to move counts between normal/jury.
//     // That scenario isn't handled here; if you support role changes, handle accordingly.

//     // 6) Update recent votes array (update existing entry or unshift)
//     const voteData = {
//       user: {
//         _id: upsertedVote.user._id,
//         name: upsertedVote.user.name,
//         profile: upsertedVote.user.profile,
//         handle: upsertedVote.user.handle,
//         role: upsertedVote.user.role
//       },
//       fields: upsertedVote.fields,
//       totalVote: upsertedVote.totalVote,
//       votedAt: new Date()
//     };

//     const arr = roleKey === "jury" ? post.recentJuryVotes : post.recentNormalVotes;

//     const idx = arr.findIndex(v => String(v.user._id) === String(upsertedVote.user._id));
//     if (idx !== -1) {
//       // update existing entry
//       arr[idx].fields = voteData.fields;
//       arr[idx].totalVote = voteData.totalVote;
//       arr[idx].votedAt = voteData.votedAt;
//     } else {
//       arr.unshift(voteData);
//       if (arr.length > 4) arr.pop();
//     }

//     // 7) Recompute score from post.voteStats (cheap)
//     const averages = {};
//     for (const f of voteFields) {
//       const juryCount = post.voteStats.jury.count || 0;
//       const normalCount = post.voteStats.normal.count || 0;

//       const jurySum = post.voteStats.jury.sums?.[f] ?? 0;
//       const normalSum = post.voteStats.normal.sums?.[f] ?? 0;

//       const juryAvg = juryCount > 0 ? jurySum / juryCount : null;
//       const normalAvg = normalCount > 0 ? normalSum / normalCount : null;

//       let weighted = 0;
//       if (juryAvg !== null && normalAvg !== null) weighted = juryAvg * 0.6 + normalAvg * 0.4;
//       else if (juryAvg !== null) weighted = juryAvg;
//       else if (normalAvg !== null) weighted = normalAvg;
//       else weighted = 0;

//       averages[f] = Number(weighted.toFixed(2));
//     }

//     const totalScore = Number((Object.values(averages).reduce((s, v) => s + v, 0) / (voteFields.length || 1)).toFixed(1));
//     post.score = { averages, totalScore };

//     // 8) Save post (inside transaction)
//     await post.save({ session });

//     // commit
//     await session.commitTransaction();
//     session.endSession();

//     // 9) Return populated updated post (quick read)
//     const updatedPost = await Post.findById(postId)
//       .populate("createdBy", "name profile handle")
//       .lean();

//     // emit socket (outside txn)
//     const io = req.app.get("io");
//     io.emit("vote:update", { updatedPost });

//     return res.json({ post: updatedPost });

//   } catch (err) {
//     try { await session.abortTransaction(); } catch (e) {}
//     session.endSession();
//     console.error("votePost error:", err);
//     return res.status(500).json({ message: err.message });
//   }
// };

// export const votePost = async (req, res) => {
//   try {
//     const postId = req.params.id;
//     const userId = req.user.id;

//     // -----------------------------
//     // 1) Parse dynamic vote fields
//     // -----------------------------
//     const fields = {};
//     for (const key in req.body) {
//       const val = Number(req.body[key]);
//       if (!isNaN(val)) fields[key] = val;
//     }

//     const values = Object.values(fields);
//     const totalVote = values.length > 0
//       ? values.reduce((a, b) => a + b, 0) / values.length
//       : null;

//     // -----------------------------
//     // 2) Upsert vote & populate user
//     // -----------------------------
//     const savedVote = await Vote.findOneAndUpdate(
//       { post: postId, user: userId },
//       { $set: { fields, totalVote } },
//       { upsert: true, new: true, setDefaultsOnInsert: true }
//     ).populate("user", "name profile handle role");

//     // -----------------------------
//     // 3) Recalculate score
//     // -----------------------------
//     const post = await Post.findById(postId);
//     if (!post) return res.status(404).json({ message: "Post not found" });

//     const calc = await calculateScore(postId);
//     post.score = { averages: calc.averages, totalScore: calc.totalScore };

//     // -----------------------------
//     // 4) Prepare vote object
//     // -----------------------------
//     const voteData = {
//       user: {
//         _id: savedVote.user._id,
//         name: savedVote.user.name,
//         profile: savedVote.user.profile,
//         handle: savedVote.user.handle,
//         role: savedVote.user.role
//       },
//       fields: savedVote.fields,
//       totalVote: savedVote.totalVote,
//       votedAt: new Date()
//     };

//     // -----------------------------
//     // 5) Insert or update in recent votes
//     // -----------------------------
//     const voteArray = savedVote.user.role === "jury"
//       ? post.recentJuryVotes
//       : post.recentNormalVotes;

//     const existingIndex = voteArray.findIndex(
//       v => v.user._id.toString() === savedVote.user._id.toString()
//     );

//     if (existingIndex !== -1) {
//       // Update existing vote
//       voteArray[existingIndex].fields = savedVote.fields;
//       voteArray[existingIndex].totalVote = savedVote.totalVote;
//       voteArray[existingIndex].votedAt = new Date();
//     } else {
//       // Insert new vote at the front
//       voteArray.unshift(voteData);
//       if (voteArray.length > 4) voteArray.pop();
//     }

//     await post.save();

//     // -----------------------------
//     // 6) Fetch updated post with creator populated
//     // -----------------------------
//     const updatedPost = await Post.findById(postId)
//       .populate("createdBy", "name profile handle")
//       .lean();

//     // -----------------------------
//     // 7) Emit via socket
//     // -----------------------------
//     const io = req.app.get("io");
//     io.emit("vote:update", { updatedPost });

//     // -----------------------------
//     // 8) Send response
//     // -----------------------------
//     return res.json({ post: updatedPost });

//   } catch (err) {
//     console.error("votePost error:", err);
//     return res.status(500).json({ message: err.message });
//   }
// };



// export const votePost = async (req, res) => {
//   try {
//     const postId = req.params.id;
//     const userId = req.user.id;

//     console.log("🔥 Voting:", postId, "by:", userId);

//     // -----------------------------
//     // 1) Parse dynamic vote fields
//     // -----------------------------
//     const fields = {};
//     for (const key in req.body) {
//       const val = Number(req.body[key]);
//       if (!Number.isNaN(val)) fields[key] = val;
//     }

//     const values = Object.values(fields);
//     const totalVote =
//       values.length > 0
//         ? values.reduce((a, b) => a + b, 0) / values.length
//         : null;

//     // -----------------------------
//     // 2) Upsert vote
//     // -----------------------------
//     await Vote.findOneAndUpdate(
//       { post: postId, user: userId },
//       { $set: { fields, totalVote } },
//       { upsert: true, new: true, setDefaultsOnInsert: true }
//     );

//     // -----------------------------
//     // 3) Recalculate score
//     // -----------------------------
//     const calc = await calculateScore(postId);

//     const post = await Post.findById(postId);
//     if (!post) return res.status(404).json({ message: "Post not found" });

//     post.score = {
//       averages: calc.averages,
//       totalScore: calc.totalScore,
//     };

//     await post.save();

//     // -----------------------------
//     // 4) Get updated post + votes
//     // -----------------------------
//     const updatedPost = await Post.findById(postId)
//       .populate("createdBy", "name profile handle")
//       .lean();

//     // 4.1) Recent normal votes (exclude jury)
//     const recentNormalVotes = await Vote.find({ post: postId })
//       .populate("user", "name profile handle role")
//       .where("user.role").ne("jury") // exclude jury
//       .sort({ createdAt: -1 })
//       .limit(4)
//       .lean();

//     // 4.2) Recent jury votes
//     const recentJuryVotes = await Vote.find({ post: postId })
//       .populate("user", "name profile handle role")
//       .where("user.role").equals("jury") // only jury
//       .sort({ createdAt: -1 })
//       .limit(4)
//       .lean();

//     // ✅ Attach directly to post object
//     updatedPost.recentNormalVotes = recentNormalVotes;
//     updatedPost.recentJuryVotes = recentJuryVotes;
//     updatedPost.score = post.score;

//     // -----------------------------
//     // 5) Emit via socket
//     // -----------------------------
//     const io = req.app.get("io");
//     io.emit("vote:update", {
//       updatedPost,
//     });

//     console.log("📡 EMITTED vote:update for post:", updatedPost);

//     // -----------------------------
//     // 6) Send response
//     // -----------------------------
//     return res.json({
//       post: updatedPost,
//     });
//   } catch (err) {
//     console.error("votePost error:", err);
//     return res.status(500).json({ message: err.message });
//   }
// };


// export const votePost = async (req, res) => {
//   try {
//     const postId = req.params.id;
//     const userId = req.user.id;

//     console.log("🔥 Voting:", postId, "by:", userId);

//     // -----------------------------------
//     // 1) DYNAMIC FIELDS (any structure)
//     // -----------------------------------
//     const fields = {};
//     for (const key in req.body) {
//       const val = Number(req.body[key]);
//       if (!Number.isNaN(val)) fields[key] = val;
//     }

//     const values = Object.values(fields);
//     const totalVote =
//       values.length > 0
//         ? values.reduce((a, b) => a + b, 0) / values.length
//         : null;

//     // -----------------------------------
//     // 2) UPSERT VOTE
//     // -----------------------------------
//     await Vote.findOneAndUpdate(
//       { post: postId, user: userId },
//       { $set: { fields, totalVote } },
//       { upsert: true, new: true, setDefaultsOnInsert: true }
//     );

//     // -----------------------------------
//     // 3) RECALCULATE SCORE
//     // -----------------------------------
//     const calc = await calculateScore(postId);

//     const post = await Post.findById(postId);
//     if (!post) return res.status(404).json({ message: "Post not found" });

//     post.score = {
//       averages: calc.averages,
//       totalScore: calc.totalScore,
//     };

//     await post.save();

//     // -----------------------------------
//     // 4) GET UPDATED POST + 4 NORMAL + 4 JURY
//     // -----------------------------------
//     const updatedPost = await Post.findById(postId)
//       .populate("createdBy", "name profile handle")
//       .lean();


//     // 📌 4.1 4 recent normal votes
//     const recentNormalVotes = await Vote.find({ post: postId })
//       .populate("user", "name profile handle role")
//       .sort({ createdAt: -1 })
//       .limit(4)
//       .lean();


//     // 📌 4.2 4 recent jury votes (fastest & clean)
//     const recentJuryVotes = await Vote.aggregate([
//       { $match: { post: new mongoose.Types.ObjectId(postId) } },
//       {
//         $lookup: {
//           from: "users",
//           localField: "user",
//           foreignField: "_id",
//           as: "user",
//         },
//       },
//       { $unwind: "$user" },
//       { $match: { "user.role": "jury" } },
//       { $sort: { createdAt: -1 } },
//       { $limit: 4 },
//       {
//         $project: {
//           fields: 1,
//           totalVote: 1,
//           createdAt: 1,
//           user: {
//             _id: "$user._id",
//             name: "$user.name",
//             profile: "$user.profile",
//             handle: "$user.handle",
//             role: "$user.role",
//           },
//         },
//       },
//     ]);

//     // Attach into post object so frontend receives 1 payload
//     updatedPost.recentNormalVotes = recentNormalVotes;
//     updatedPost.recentJuryVotes = recentJuryVotes;

//     // -----------------------------------
//     // 5) REALTIME SOCKET EMIT
//     // -----------------------------------
//     const io = req.app.get("io");
// io.emit("vote:update", {
//   updatedPost,               // full post
//   recentNormalVotes,
//   recentJuryVotes,
//   newScore: updatedPost.score
// });


//     console.log("📡 EMITTED vote:update for post:", postId);

// console.log('current updated postis', recentJuryVotes, recentNormalVotes);

//     // -----------------------------------
//     // 6) SEND RESPONSE
//     // -----------------------------------
//     return res.json({
//       post: updatedPost,
//       overview: {
//         recentNormalVotes,
//         recentJuryVotes,
//       },
//     });

//   } catch (err) {
//     console.error("votePost error:", err);
//     return res.status(500).json({ message: err.message });
//   }
// };


// export const votePost = async (req, res) => {
//   try {
//     const postId = req.params.id;
//     const userId = req.user.id;
//     const { creativity, aesthetics, composition, emotion } = req.body;
// console.log("voting on post:", postId, "by user:", userId, "with votes:", req.body);
//     // Build fields object dynamically (keep compatible with existing voteFields)
//     const fields = {};
//     if (creativity !== undefined) fields.creativity = Number(creativity);
//     if (aesthetics !== undefined) fields.aesthetics = Number(aesthetics);
//     if (composition !== undefined) fields.composition = Number(composition);
//     if (emotion !== undefined) fields.emotion = Number(emotion);

//     const totalVote = (() => {
//       const vals = Object.values(fields).filter(v => Number.isFinite(v));
//       return vals.length ? vals.reduce((a,b)=>a+b,0) / vals.length : null;
//     })();

//     // Upsert vote
//     const voteDoc = await Vote.findOneAndUpdate(
//       { post: postId, user: userId },
//       { $set: { fields, totalVote } },
//       { upsert: true, new: true, setDefaultsOnInsert: true }
//     );

//     // Recalculate Post.score from votes collection
//     const post = await Post.findById(postId);
//     if (!post) return res.status(404).json({ message: "Post not found" });

// const calc = await calculateScore(postId);
//     post.score = { averages: calc.averages || {}, totalScore: calc.totalScore || 0 };
//     await post.save();

//     // Return updated post with createdBy, and also provide the 4 normal + 4 jury overview
//     const updatedPost = await Post.findById(postId)
//       .populate("createdBy", "name profile handle")
//       .lean();

//     // get overview votes
//     const normalVotes = await Vote.find({ post: postId })
//       .populate("user", "name profile handle role")
//       .sort({ createdAt: -1 })
//       .limit(4)
//       .lean();

//     const juryVotes = await Vote.find({ post: postId })
//       .populate("user", "name profile handle role")
//       .where("user")
//       .populate({ path: "user", match: { role: "jury" } }) // optional double-check
//       .sort({ createdAt: -1 })
//       .limit(4)
//       .lean();

//     // Better: explicitly filter by user role for jury
//     const juryVotes2 = await Vote.aggregate([
// { $match: { post: new mongoose.Types.ObjectId(postId) } },
//       {
//         $lookup: {
//           from: "users",
//           localField: "user",
//           foreignField: "_id",
//           as: "userDoc"
//         }
//       },
//       { $unwind: "$userDoc" },
//       { $match: { "userDoc.role": "jury" } },
//       { $sort: { createdAt: -1 } },
//       { $limit: 4 },
//       { $project: { fields: 1, totalVote: 1, createdAt: 1, user: "$userDoc" } }
//     ]);
// console.log("Vote recorded and post score updated", normalVotes, juryVotes2);
// console.log('now score is', calc)
//     // send back minimal combined payload used in UI
//     return res.json({
//       post: updatedPost,
//       overview: {
//         recentNormalVotes: normalVotes,
//         recentJuryVotes: juryVotes2
//       }
//     });

//   } catch (err) {
//     console.error("votePost err", err);
//     return res.status(500).json({ message: err.message });
//   }
// };

// export const votePost = async (req, res) => {
//   console.log("posting votes");
//   try {
//     const { creativity, aesthetics, composition, emotion } = req.body;
//     const post = await Post.findById(req.params.id)
//       .populate("votes.user", "name profile handle");

//     if (!post) return res.status(404).json({ message: "Post not found" });

//     const userId = req.user.id;
//   const existingVote = post.votes.find(
//   (v) => v.user && v.user._id.toString() === userId
// );

//     if (existingVote) {
//       existingVote.creativity = creativity ?? existingVote.creativity;
//       existingVote.aesthetics = aesthetics ?? existingVote.aesthetics;
//       existingVote.composition = composition ?? existingVote.composition;
//       existingVote.emotion = emotion ?? existingVote.emotion;
//     } else {
//       post.votes.push({
//         user: userId,
//         creativity,
//         aesthetics,
//         composition,
//         emotion,
//       });
//     }

//     await post.save();
//     console.log("vote posted successfully");

//     const updatedPost = await Post.findById(req.params.id)
//       .populate("createdBy", "name profile handle")
//       .populate("votes.user", "name profile handle");

//     // ✅ Create notification (don’t notify if user voted own post)
//   if (String(updatedPost.createdBy._id) !== String(userId)) {
//       await handleVoteNotification(
//         updatedPost.createdBy._id,
//         updatedPost._id,
//         userId
//       );
//     }


//     res.json(updatedPost);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// ✅ Get all votes for a specific post
export const getVotesForPost = async (req, res) => {
  console.log("getting votes for post");
  try {
    const postId = req.params.id;
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.max(1, parseInt(req.query.limit || "10", 10));
    const skip = (page - 1) * limit;

    const [votes, total] = await Promise.all([
      Vote.find({ post: postId })
        .populate("user", "name profile handle role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Vote.countDocuments({ post: postId })
    ]);

    res.json({
      results: votes,
      page,
      limit,
      count: total
    });
    console.log("got votes for post");
  } catch (err) {
    console.error("getVotesForPost", err);
    res.status(500).json({ message: err.message });
  }
};
export const getNonJuryVotesForPost = async (req, res) => {

  try {
    const postId = req.params.id;
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.max(1, parseInt(req.query.limit || "10", 10));
    const skip = (page - 1) * limit;
console.log("Fetching non-jury votes for post:", postId, "page:", page, "limit:", limit);
    const filter = {
      post: postId,
      userRole: { $in: ["normal", "dev"] }   // 🔥 only non-jury stored in Vote
    };

    const [votes, total] = await Promise.all([
      Vote.find(filter)
        .populate("user", "name profile handle role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Vote.countDocuments(filter)
    ]);
console.log(`Fetched ${votes.length} non-jury votes out of ${total} total for post:`, postId);
    res.json({
      results: votes,
      page,
      limit,
      count: total
    });

  } catch (err) {
    console.error("getNonJuryVotesForPost", err);
    res.status(500).json({ message: err.message });
  }
};

export const getJuryVotesForPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.max(1, parseInt(req.query.limit || "10", 10));
    const skip = (page - 1) * limit;
console.log("Fetching jury votes for post:", postId, "page:", page, "limit:", limit);
    const filter = {
      post: postId,
      userRole: "jury"
    };

    const [votes, total] = await Promise.all([
      Vote.find(filter)
        .populate("user", "name profile handle role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Vote.countDocuments(filter)
    ]);
console.log("Found jury votes:", votes.length, "total:", total);
    res.json({
      results: votes,
      page,
      limit,
      count: total
    });
  } catch (err) {
    console.error("getJuryVotesForPost", err);
    res.status(500).json({ message: err.message });
  }
};
