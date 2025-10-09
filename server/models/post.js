// models/Post.js
import mongoose from "mongoose";

const voteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  creativity: { type: Number, min: 0, max: 10 },
  aesthetics: { type: Number, min: 0, max: 10 },
  composition: { type: Number, min: 0, max: 10 },
  emotion: { type: Number, min: 0, max: 10 },
  totalVote: { type: Number },
}, { _id: false });

const postSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  category: [{ type: String, required: true }],
  hashtags: [String],
  images: [],
  voteFields: [{ type: String, enum: ["creativity", "aesthetics", "composition", "emotion"] }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  votes: [voteSchema],

  // 🔗 New field: linked assets
  assets: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }]
}, { timestamps: true });

export default mongoose.model("Post", postSchema);
