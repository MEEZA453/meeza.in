import Post from "../models/post.js";
 import User from "../models/user.js";
import { cloudinary } from "../config/cloudinery.js";
import Notification from "../models/notification.js";
import Product from "../models/designs.js"


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
  console.log('getting assets of posts')
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId).populate("assets");

    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    res.status(200).json({ success: true, assets: post.assets });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
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
      category,
      hashtags: hashtags ? JSON.parse(hashtags) : [],
      voteFields: voteFields ? JSON.parse(voteFields) : [], // ✅ parse from frontend
      images: uploadedImages,
      createdBy: req.user.id
    });

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
      const imagesToRemove = JSON.parse(removeImages); // expect array of URLs
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

    // 5️⃣ Update fields
    post.name = name || post.name;
    post.description = description || post.description;
    post.category = category || post.category;
    post.hashtags = hashtags ? JSON.parse(hashtags) : post.hashtags;
    post.voteFields = voteFields ? JSON.parse(voteFields) : post.voteFields;
    post.images = updatedImages;

    // 6️⃣ Save
    await post.save();
    console.log("Post updated successfully");
    res.status(200).json({ success: true, post });
  } catch (err) {
    console.error("Edit post failed:", err);
    res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

export const getDefaultPosts = async (req, res) => {
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
export const getPosts = async (req, res) => {
    console.log('getting post')

  try {
    const posts = await Post.find()
    .sort({ createdAt: -1 })
      .populate("createdBy", "name profile handle")
      .populate("votes.user", "name profile handle");
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
    console.log('got all posts.')

};
export const searchPosts = async (req, res) => {
  try {
    const { query } = req.query; // example: /search?query=design

    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "Search query is required" });
    }

    const posts = await Post.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
        { hashtags: { $regex: query, $options: "i" } }, // if hashtags are strings
      ],
    })
      .populate("createdBy", "name profile handle")
      .populate("votes.user", "name profile handle")
      .limit(20);

    return res.status(200).json(posts);
  } catch (error) {
    console.error("Error in searchPosts:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get single post by ID (with votes populated)
export const getPostById = async (req, res) => {
    console.log('getting post by id')

  try {
    const post = await Post.findById(req.params.id)
    .sort({ createdAt: -1 })
      .populate("createdBy", "name profile handle")
      .populate("votes.user", "name profile handle");

    if (!post) return res.status(404).json({ message: "Post not found" });

    res.json(post);
    console.log('got the post')
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const getPostsByHandle = async (req, res) => {
  console.log('Getting posts by handle:', req.params.handle);

  try {
    // Step 1: Find the user by handle
    const user = await User.findOne({ handle: req.params.handle });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Step 2: Find posts created by this user
    const posts = await Post.find({ createdBy: user._id })
    .sort({ createdAt: -1 })
      .populate("createdBy", "name profile handle")
      .populate("votes.user", "name profile handle")
      .sort({ createdAt: -1 });

    if (!posts.length) {
      return res.status(404).json({ message: "No posts found for this handle" });
    }

    res.json(posts);
    console.log(`Got ${posts.length} post(s) for handle:`, req.params.handle);


  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

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
  console.log("posting votes");
  try {
    const { creativity, aesthetics, composition, emotion } = req.body;
    const post = await Post.findById(req.params.id)
      .populate("votes.user", "name profile handle");

    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user.id;
    const existingVote = post.votes.find(
      (v) => v.user._id.toString() === userId
    );

    if (existingVote) {
      existingVote.creativity = creativity ?? existingVote.creativity;
      existingVote.aesthetics = aesthetics ?? existingVote.aesthetics;
      existingVote.composition = composition ?? existingVote.composition;
      existingVote.emotion = emotion ?? existingVote.emotion;
    } else {
      post.votes.push({
        user: userId,
        creativity,
        aesthetics,
        composition,
        emotion,
      });
    }

    await post.save();
    console.log("vote posted successfully");

    const updatedPost = await Post.findById(req.params.id)
      .populate("createdBy", "name profile handle")
      .populate("votes.user", "name profile handle");

    // ✅ Create notification (don’t notify if user voted own post)
    if (String(updatedPost.createdBy._id) !== String(userId)) {
      await Notification.create({
        recipient: updatedPost.createdBy._id,
        sender: userId,
        type: "vote",
        post: updatedPost._id,
        message: `@${req.user.handle} voted your post`,
        // store preview image (use first image from post)
        image: updatedPost.images && updatedPost.images.length > 0
          ? updatedPost.images[0]
          : null,
      });
    }

    res.json(updatedPost);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get all votes for a specific post
export const getVotesForPost = async (req, res) => {
    console.log('getting votes')
  try {
    const post = await Post.findById(req.params.id)
    .sort({ createdAt: -1 })
      .populate("votes.user", "name profile handle");

    if (!post) return res.status(404).json({ message: "Post not found" });

    res.json(post.votes);
    console.log('got all votes')
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
