// controllers/draftController.js
import Post from "../models/post.js";
import Product from "../models/designs.js";
import mongoose from "mongoose";

/**
 * POST /posts/draft
 * Create a new draft post
 */
export const createPostDraft = async (req, res) => {
  try {
    const {
      description,
      category,
      voteFields,
      hashtags,
      media
    } = req.body;
console.log("createPostDraft req.body:", req.body);
    if (!req.user || !req.user.id) return res.status(401).json({ message: "Unauthorized" });

    // Normalize arrays (client may send strings)
    const categoryArray = typeof category === "string" ? JSON.parse(category || "[]") : category || [];
    const voteFieldsArr = typeof voteFields === "string" ? JSON.parse(voteFields || "[]") : voteFields || [];
    const hashtagsArr = typeof hashtags === "string" ? JSON.parse(hashtags || "[]") : hashtags || [];
    const mediaArr = typeof media === "string" ? JSON.parse(media || "[]") : media || [];

    const post = new Post({
      description,
      category: categoryArray,
      hashtags: hashtagsArr,
      voteFields: voteFieldsArr,
      media: mediaArr,
      createdBy: req.user.id,
      status: "draft",
      draftMeta: { savedAt: new Date(), autosaved: !!req.body.autosaved }
    });
    const saved = await post.save();
console.log("createPostDraft saved:", saved);
    return res.status(201).json(saved);
  } catch (err) {
    console.error("createPostDraft error:", err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};

/**
 * PATCH /posts/draft/:id
 * Update existing draft
 */
export const updatePostDraft = async (req, res) => {
  try {
    const { id } = req.params;
    const update = { ...req.body, "draftMeta.savedAt": new Date() };
    console.log("updatePostDraft req.body:", req.body);
    // only allow draft update by owner
    const post = await Post.findOne({ _id: id, createdBy: req.user.id, status: "draft" });
    if (!post) return res.status(404).json({ message: "Draft not found" });

    Object.assign(post, update);
    post.draftMeta = post.draftMeta || {};
    post.draftMeta.savedAt = new Date();
    post.draftMeta.autosaved = !!req.body.autosaved;

    const saved = await post.save();
    console.log("updatePostDraft saved:", );
    return res.json(saved);
  } catch (err) {
    console.error("updatePostDraft error:", err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};

/**
 * GET /posts/drafts
 * List drafts for user
 */
export const listPostDrafts = async (req, res) => {
  try {
    const drafts = await Post.find({ createdBy: req.user.id, status: "draft" }).sort({ updatedAt: -1 });
    console.log("listPostDrafts found:", drafts.length);
    return res.json(drafts);
  } catch (err) {
    console.error("listPostDrafts error:", err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};

/**
 * GET /posts/draft/:id
 */
export const getPostDraft = async (req, res) => {
  try {
    const draft = await Post.findOne({ _id: req.params.id, createdBy: req.user.id, status: "draft" });
    if (!draft) return res.status(404).json({ message: "Draft not found" });
    return res.json(draft);
  } catch (err) {
    console.error("getPostDraft error:", err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};

/**
 * DELETE /posts/draft/:id
 */
export const deletePostDraft = async (req, res) => {
  try {
    const deleted = await Post.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id, status: "draft" });
    if (!deleted) return res.status(404).json({ message: "Draft not found" });
    // Optionally queue S3 cleanup of media keys in deleted.media
    console.log("deletePostDraft deleted:", );
    return res.json({ success: true });
  } catch (err) {
    console.error("deletePostDraft error:", err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};

/**
 * POST /posts/draft/:id/publish
 * Publish a draft (convert to published)
 */
export const publishPostDraft = async (req, res) => {
  console.log("publishPostDraft req.body:", req.body);
  try {
    const draft = await Post.findOne({ _id: req.params.id, createdBy: req.user.id, status: "draft" });
    if (!draft) return res.status(404).json({ message: "Draft not found" });

    // Update fields from req.body if provided
    const updates = req.body || {};
    Object.assign(draft, updates);

    draft.status = "published";
    // clear draftMeta
    draft.draftMeta = undefined;

    await draft.save();
    console.log("publishPostDraft published successfully:", draft);
    return res.json(draft);
  } catch (err) {
    console.error("publishPostDraft error:", err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};


/* --- Product draft controllers (mirror of post ones) --- */

export const createProductDraft = async (req, res) => {
  try {
    const {
      name, amount, sections, faq, hashtags, sources, description, media
    } = req.body;
console.log("createProductDraft req.body:", req.body);
    const parsedSections = typeof sections === "string" ? JSON.parse(sections || "[]") : sections || [];
    const parsedFaq = typeof faq === "string" ? JSON.parse(faq || "[]") : faq || [];
    const parsedHashtags = typeof hashtags === "string" ? JSON.parse(hashtags || "[]") : hashtags || [];
    const parsedSources = typeof sources === "string" ? JSON.parse(sources || "[]") : sources || [];
    const parsedMedia = typeof media === "string" ? JSON.parse(media || "[]") : media || [];

    const product = new Product({
      name,
      amount,
      sections: parsedSections,
      faq: parsedFaq,
      hashtags: parsedHashtags,
      sources: parsedSources,
      description,
      media: parsedMedia,
      postedBy: req.user.id,
      status: "draft",
      draftMeta: { savedAt: new Date(), autosaved: !!req.body.autosaved }
    });

    await product.save();
    console.log("createProductDraft saved:", product);
    return res.status(201).json(product);
  } catch (error) {
    console.error("createProductDraft error:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const updateProductDraft = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("updateProductDraft req.body:", req.body);
    const product = await Product.findOne({ _id: id, postedBy: req.user.id, status: "draft" });
    if (!product) return res.status(404).json({ message: "Draft not found" });
    Object.assign(product, req.body);
    product.draftMeta = product.draftMeta || {};
    product.draftMeta.savedAt = new Date();
    product.draftMeta.autosaved = !!req.body.autosaved;
    await product.save();
    console.log("updateProductDraft saved:", product);
    return res.json(product);
  } catch (err) {
    console.error("updateProductDraft error:", err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};

export const listProductDrafts = async (req, res) => {
  try {
    const drafts = await Product.find({ postedBy: req.user.id, status: "draft" }).sort({ updatedAt: -1 });
    console.log("listProductDrafts found:", drafts.length);
    return res.json(drafts);
  } catch (err) {
    console.error("listProductDrafts error:", err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};

export const getProductDraft = async (req, res) => {
  try {
    const draft = await Product.findOne({ _id: req.params.id, postedBy: req.user.id, status: "draft" });
    if (!draft) return res.status(404).json({ message: "Draft not found" });
    return res.json(draft);
  } catch (err) {
    console.error("getProductDraft error:", err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};

export const deleteProductDraft = async (req, res) => {
  try {
    const deleted = await Product.findOneAndDelete({ _id: req.params.id, postedBy: req.user.id, status: "draft" });
    console.log("deleteProductDraft deleted:", deleted);
    if (!deleted) return res.status(404).json({ message: "Draft not found" });
    return res.json({ success: true });
  } catch (err) {
    console.error("deleteProductDraft error:", err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};

export const publishProductDraft = async (req, res) => {
  try {
    const draft = await Product.findOne({ _id: req.params.id, postedBy: req.user.id, status: "draft" });
console.log("publishProductDraft req.body:", req.body);    
    if (!draft) return res.status(404).json({ message: "Draft not found" });
    Object.assign(draft, req.body || {});
    draft.status = "published";
    draft.draftMeta = undefined;

    await draft.save();
    console.log("publishProductDraft published successfully:", draft);
    return res.json(draft);
  } catch (err) {
    console.error("publishProductDraft error:", err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};