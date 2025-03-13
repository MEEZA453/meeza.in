import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    image: [],
    amount: {
      type: Number,
      required: true,
    },
    headline: {
      type: String,
      required: true,
    },
      sections: [{
        title: { type: String, required: true },
        content: { type: [String], required: true }, // Array of strings
      }],
    // relatedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }], // References other products
    hastags : [String],
    // expectedDeliveryDate: {
    //   type: Date,
    //   required: true,
    // },
    // cashOnDelivery: {
    //   type: Boolean,
    //   required: true,
    // },
    // returnOnDelivery: {
    //   type: Boolean,
    //   required: true,
    // },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
