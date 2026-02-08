// models/Notification.js
import mongoose from "mongoose";

const metaSchema = new mongoose.Schema(
  {
    voters: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    totalVotes: { type: Number, default: 0 },

    // Common asset/post fields
    assetId: { type: mongoose.Schema.Types.ObjectId, ref: "Asset" },
    assetImage: { type: String },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    postImage: { type: String },
   isMultiple: { type: Boolean, default: false },
    // ✅ New fields for group_post notifications
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
    groupName: { type: String },
    groupProfile: { type: String },
    contributorHandle: { type: String },
    contributorProfile: { type: String },
    contributorAddedImages: [{ type: String }], // max 2 but array for flexibility

    // Fallback for any other dynamic data
    extra: { type: mongoose.Schema.Types.Mixed },
  },
  { _id: false }
);
const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // who gets the notification
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // who caused it
  type: {
    type: String,
    enum: ["vote", "follow", "comment","order_paid","jury_request","jury_approved", "jury_removed" ,  "jury_rejected" , "jury_removal_request" , "normal_request_rejected" , "asset_attach_request", 'order_created', 'product_sold',  
      "asset_attach_approved",  
      "asset_attach_rejected", 'cash_received',  "achievement_pending",
  "achievement_awarded",
  "group_contribution_request", "group_contribution_approved", "group_contribution_rejected",
   "group_post",
  "achievement_rejected","subscribe","become_admin",
"remove_admin",
 "achievement_review","highlight_started","highlight_scheduled", "highlight_request", "highlight_rejected","highlight_payment_confirmed","highlight_approved_awaiting_payment"], 
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
