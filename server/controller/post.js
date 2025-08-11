import Post from "../models/post.js";
import { cloudinary } from "../config/cloudinery.js";
// ✅ Create a post
export const createPost = async (req, res) => {
  console.log('Creating post...');
  try {
    const { name, description, category, hashtags, voteFields } = req.body;

    if (!name || !description || !category) {
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

// ✅ Vote for a post (one per user, updates if exists)
export const votePost = async (req, res) => {
    console.log('posting votes')
  try {
    const { creativity, aesthetics, composition, emotion } = req.body;
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

console.log('vote posted successfully')
    const updatedPost = await Post.findById(req.params.id)
      .populate("createdBy", "name profile handle")
      .populate("votes.user", "name profile handle");

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
      .populate("votes.user", "name profile handle");

    if (!post) return res.status(404).json({ message: "Post not found" });

    res.json(post.votes);
    console.log('got all votes')
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
