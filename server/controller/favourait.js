import User from "../models/user.js";
import Product from "../models/designs.js";
export const addToFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { designId } = req.body;

    const user = await User.findById(userId);
    if (!user.favorites.includes(designId)) {
      user.favorites.push(designId);
      await user.save();
    }

    res.status(200).json({ success: true, message: "Design added to favorites." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
export const removeFromFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { designId } = req.body;

    await User.findByIdAndUpdate(userId, {
      $pull: { favorites: designId },
    });

    res.status(200).json({ success: true, message: "Design removed from favorites." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
export const getFavorites = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).populate('favorites');

    res.status(200).json({ success: true, favorites: user.favorites });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
