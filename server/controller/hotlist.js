import Product from "../models/designs.js";
import User from "../models/user.js";
import { sanitizeProduct } from "../utils/sanitizeProduct.js";

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
    const userId = req.user?.id || null;
console.log('userid ',userId)
    // Fetch all hot products
    let hotProducts = await Product.find({ isHot: true })
      .sort({ createdAt: -1 })
      .populate("postedBy", "name profile handle followers")
      .lean();

    // Transform data like getDesign
    hotProducts = hotProducts.map((product) => {
      const base = sanitizeProduct(product);

const isMyProduct =
  userId ? product.postedBy?._id.toString() === userId.toString() : false;

      let isFollowing = false;

      if (userId && !isMyProduct) {
        isFollowing = product.postedBy?.followers?.some(
          (f) => f.toString() === userId.toString()
        );
      }

      return {
        ...base,
        isMyProduct,
        isFollowing,
      };
    });

    console.log("got hoooot");

    // ✅ Return EXACT OLD STRUCTURE to avoid frontend breaking
    res.status(200).json({
      success: true,
      hotProducts, // <-- same key as before
    });
  } catch (err) {
    console.error("Error in getAllHotProducts:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

