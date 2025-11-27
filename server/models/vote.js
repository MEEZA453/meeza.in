// models/Vote.js
import mongoose from "mongoose";

const voteSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  fields: { type: mongoose.Schema.Types.Mixed, default: {} }, // { creativity: 8.5, ... }
  totalVote: { type: Number },
}, { timestamps: true });

// unique per user+post so one vote per user per post
voteSchema.index({ post: 1, user: 1 }, { unique: true });

export default mongoose.model("Vote", voteSchema);
