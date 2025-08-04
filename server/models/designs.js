import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User model
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    image: [],
    amount: {
      type: Number,
      required: true,
    },

    sections: [
      {
        title: { type: String, required: true },
        content: { type: [String], required: true },
      },
    ],
    hastags: [String],
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
export default Product;
