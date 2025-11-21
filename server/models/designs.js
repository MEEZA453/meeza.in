// models/Product.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true },
    image: [],
    driveLink: { type: String, required: false },
    amount: { type: Number, required: true },

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
        parent: [{ type: mongoose.Schema.Types.ObjectId, ref: "Folder" }],
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
export default Product;
