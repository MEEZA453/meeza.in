// models/Notification.js
import mongoose from "mongoose";

const metaSchema = new mongoose.Schema(
  {
    voters: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // users who voted (populatable)
    totalVotes: { type: Number, default: 0 },
    // keep common optional fields you'll use for other notification types
    assetId: { type: mongoose.Schema.Types.ObjectId, ref: "Asset" },
    assetImage: { type: String },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    postImage: { type: String },
    extra: { type: mongoose.Schema.Types.Mixed }, // flexible place for any other data
  },
  { _id: false }
);

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // who gets the notification
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // who caused it
  type: {
    type: String,
    enum: ["vote", "follow", "comment","jury_request","jury_approved", "jury_removed" ,  "jury_rejected" , "jury_removal_request" , "normal_request_rejected" , "asset_attach_request", 'order_created', 'product_sold',  
      "asset_attach_approved",  
      "asset_attach_rejected", 'cash_received',  "achievement_pending",
  "achievement_awarded",
  "achievement_rejected", "achievement_review"], 
    required: true,
  },
  post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" }, // if related to a post

  // <-- REPLACED meta: Mixed with a small sub-schema that keeps flexibility
  meta: { type: metaSchema, default: {} },

  image: { type: String },
  honour : {type: String},
  message: { type: String }, // optional, can store '@handle voted your post'
  amount : Number,
  isRead: { type: Boolean, default: false },
   isFollowing: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("Notification", notificationSchema);
