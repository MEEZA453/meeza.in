import Post from "../models/post.js";
 import User from "../models/user.js";
import { cloudinary } from "../config/cloudinery.js";
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
    console.log(post)
    console.log('post created successfully')
    res.status(201).json(savedPost);
  } catch (err) {
    console.error("Post creation failed:", err);
    res.status(500).json({ message: err.message || "Internal server error" });
  }
};

// ✅ Get all posts (with votes & creator populated)
export const getPosts = async (req, res) => {
    console.log('getting post')

  try {
    const posts = await Post.find()
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


// ✅ Vote for a post (one per user, updates if exists)
export const votePost = async (req, res) => {
    console.log('posting votes')
  try {
    const { creativity, aesthetics, composition, emotion } = req.body;
    console.log(creativity , aesthetics, composition , emotion  )
    const post = await Post.findById(req.params.id)
   
      .populate("votes.user", "name profile handle");

    if (!post) return res.status(404).json({ message: "Post not found" });
    const userId = req.user.id;
    const existingVote = post.votes.find(v => v.user._id.toString() === userId);

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
        emotion
      });
    }

    await post.save();
console.log(post)
console.log('vote posted successfully')
    const updatedPost = await Post.findById(req.params.id)
      .populate("createdBy", "name profile handle")
      .populate("votes.user", "name profile handle");

    res.json(updatedPost);
    console.log(updatedPost)
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get all votes for a specific post
export const getVotesForPost = async (req, res) => {
    console.log('getting votes')
  try {
    const post = await Post.findById(req.params.id)
      .populate("votes.user", "name profile handle");

    if (!post) return res.status(404).json({ message: "Post not found" });

    res.json(post.votes);
    console.log('got all votes')
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
