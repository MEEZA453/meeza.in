import Product from "../models/designs.js";
import User from "../models/user.js";

// ✅ Add to Hot List (Only Dev)
export const addToHotList = async (req, res) => {
  console.log("Reached addToHotList");

  try {
    const userId = req.user.id;
    const { productId } = req.body;

    const user = await User.findById(userId);
    if (!user || user.role !== "dev") {
      return res.status(403).json({ success: false, message: "Only developers can add products to hot list." });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    if (!product.isHot) {
      product.isHot = true;
      await product.save();
    }

    console.log("Added to Hot List");
    res.status(200).json({ success: true, message: "Product added to hot list." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Remove from Hot List (Only Dev)
export const removeFromHotList = async (req, res) => {
  console.log("Reached removeFromHotList");

  try {
    const userId = req.user.id;
    const { productId } = req.body;

    const user = await User.findById(userId);
    if (!user || user.role !== "dev") {
      return res.status(403).json({ success: false, message: "Only developers can remove products from hot list." });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    if (product.isHot) {
      product.isHot = false;
      await product.save();
    }

    console.log("Removed from Hot List");
    res.status(200).json({ success: true, message: "Product removed from hot list." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Get All Hot Products
export const getAllHotProducts = async (req, res) => {
  console.log("Reached getAllHotProducts");

  try {
    const hotProducts = await Product.find({ isHot: true })
      .sort({ createdAt: -1 })
      .populate("postedBy", "name profile handle");

    res.status(200).json({
      success: true,
      hotProducts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
