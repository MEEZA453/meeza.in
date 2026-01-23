import mongoose from "mongoose";

const folderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    profile: { type: String, default: "" },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "private"
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    posts: [
      {
        post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
        savedAt: { type: Date, default: Date.now }
      }
    ],

    products: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        savedAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);


export default mongoose.model("Folder", folderSchema);
