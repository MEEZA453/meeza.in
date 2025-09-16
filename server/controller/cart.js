import Cart from "../models/cart.js";
import Product from "../models/designs.js";

// Add to Cart (no duplicate, no quantity)
export const addToCart = async (req, res) => {
  console.log('adding..')
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // Prevent duplicate entries
    const alreadyInCart = cart.items.some(item => item.product.toString() === productId);
    if (alreadyInCart) {
      return res.status(400).json({ success: false, message: "Product already in cart" });
    }

    cart.items.push({ product: productId });
    await cart.save();
console.log('added to cart')
    res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error("Add to cart error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Remove from Cart
export const removeFromCart = async (req, res) => {
  console.log('removing')
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    cart.items = cart.items.filter(item => item.product.toString() !== productId);
    await cart.save();
console.log('removed  from  cart')
    res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error("Remove from cart error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Get User Cart
export const getUserCart = async (req, res) => {
  console.log('getting user  cart')
  try {
    const userId = req.user.id;
    const cart = await Cart.findOne({ user: userId })
.populate({
        path: "items.product",
        select: "name amount image postedBy",
        populate: {
          path: "postedBy",
          select: "name email handle profile" // 👈 user fields from User model
        }
      })

    if (!cart) return res.status(200).json({ success: true, cart: { items: [] } });
console.log('got the user cart')
    res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error("Get cart error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Clear Cart
export const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    cart.items = [];
    await cart.save();

    res.status(200).json({ success: true, message: "Cart cleared", cart });
  } catch (error) {
    console.error("Clear cart error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
