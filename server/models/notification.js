// models/Notification.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // who gets the notification
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // who caused it
  type: {
    type: String,
    enum: ["vote", "follow", "comment","jury_request","jury_approved", "jury_removed" ,  "jury_rejected" , "jury_removal_request" , "normal_request_rejected" , "asset_attach_request", 'order_created', 'product_sold',  
      "asset_attach_approved",  
      "asset_attach_rejected"], 
    required: true,
  },
  post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" }, // if related to a post
    meta: { type: Object },
      image: { type: String },
  message: { type: String }, // optional, can store '@handle voted your post'
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("Notification", notificationSchema);
