// models/Group.js
import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    about: { type: String, default: "" },
    profile: { type: String, default: "" }, // brand logo / profile image url
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // superadmin
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // additional admins
    // products in group
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    // contributors is a set of users who have contributed at least one product
    contributors: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // optional tags or visibility settings in future
    visibility: { type: String, enum: ["public", "private"], default: "public" },
    // flexible meta
subscribers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// Virtuals for counts (not stored)
groupSchema.virtual("productCount").get(function () {
  return (this.products && this.products.length) || 0;
});
groupSchema.virtual("contributorCount").get(function () {
  return (this.contributors && this.contributors.length) || 0;
});

export default mongoose.model("Group", groupSchema);
