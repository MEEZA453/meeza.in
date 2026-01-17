import mongoose from "mongoose";

const folderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      default: ""
    },

    profile: {
      type: String,
      default: "" // cover image / thumbnail
    },

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

    // saved items
    posts: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Post" }
    ],

    products: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Product" }
    ]
  },
  { timestamps: true }
);

export default mongoose.model("Folder", folderSchema);
