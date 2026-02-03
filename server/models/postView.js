// models/PostView.js
import mongoose from "mongoose";

const postViewSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
    viewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // 🧠 useful for analytics
    ipHash: String,
    userAgent: String,

    // anti-spam window
    viewedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    // weight system (future)
    weight: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: false }
);

// 🔥 critical compound index
postViewSchema.index(
  { post: 1, viewer: 1, viewedAt: 1 },
  { unique: false }
);

export default mongoose.model("PostView", postViewSchema);
