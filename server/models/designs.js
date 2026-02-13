// models/Product.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
      isAsset: { type: Boolean, default: false }, // <-- new
    name: { type: String, required: true },
    views: { type: Number, default: 0 },
uniqueViewers: { type: Number, default: 0 },
drip: { type: Number, default: 0 },
appreciationCount: { type: Number, default: 0 },

hotScore: {
  type: Number,
  default: 0,
  index: true,
},
media: [
  {
        key: { type: String }, // S3 object key (posts/...
    url: { type: String, required: true },

    type: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },

    // ✅ only used when type === "video"
    cover: {
      type: String,
      required: function () {
        return this.type === "video";
      },
    },
  },
],
    amount: { type: Number, required: true },
views: { type: Number, default: 0 },
drip: { type: Number, default: 0 },          
monthlyDrip: { type: Number, default: 0 },

    faq: [{ question: { type: String }, answer: { type: String } }],

    sections: [
      {
        title: { type: String, required: true },
        content: { type: [String], required: true },
      },
    ],
    sources : [
      {name : String, link : String}
    ],
  description : {type: String , required : false},
  hashtags: [String],
   isHot: { type: Boolean, default: false },
   groups: [
  {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
    name: String,
    profile: String,
    noOfContributors: Number,
    noOfProducts: Number,
    createdAt: Date,
  },
],

    // 🔗 New field to track which posts this asset is used in
    usedInPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
savedIn: [{ type: mongoose.Schema.Types.ObjectId, ref: "Folder" }],
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
export default Product;
