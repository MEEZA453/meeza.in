
import mongoose from "mongoose";

const voteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  creativity: { type: Number, min: 0, max: 10 },
  aesthetics: { type: Number, min: 0, max: 10 },
  composition: { type: Number, min: 0, max: 10 },
  emotion: { type: Number, min: 0, max: 10 },
  totalVote: { type: Number },
}, { _id: false });


const achievementSchema = new mongoose.Schema({ 
  type: { type: String }, // e.g. "design_of_the_day"
  awardedAt: { type: Date, default: Date.now },
  score: { type: Number, default: 0 },
}, { _id: false });


const pendingSchema = new mongoose.Schema({
  type: { type: String },
  startedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
    score: { type: Number, default: 0 }, // ← add this,
  votes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Jury/Dev who voted to cancel
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
  isHighlighted: { type: Boolean, default: false },
highlightedBy: [
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    highlightedAt: { type: Date, default: Date.now }
  }
]
,
  appreciations: [
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: String,
    profile: String,
    handle: String,
    appreciatedAt: { type: Date, default: Date.now }
  }
],
appreciationCount: { type: Number, default: 0 },
currentAchievement: achievementSchema,
  achievementHistory: [achievementSchema],
  pendingAchievement: pendingSchema,
  // 🔗 New field: linked assets
  assets: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }]
}, { timestamps: true });

postSchema.index({ "currentAchievement.type": 1 });
postSchema.index({ "pendingAchievement.expiresAt": 1 });
postSchema.index({ createdAt: -1 });
export default mongoose.model("Post", postSchema);
