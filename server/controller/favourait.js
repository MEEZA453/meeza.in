import User from "../models/user.js";
import Product from "../models/designs.js";
export const addToFavorites = async (req, res) => {
console.log('reached to add fav')
  try {
    const userId = req.user.id;
    const { designId } = req.body;
console.log(userId)
    const user = await User.findById(userId);

    if (!user.favourites.includes(designId)) {
      user.favourites.push(designId);
      console.log(user)
      await user.save();
    }
console.log('added to fav')
    res.status(200).json({ success: true, message: "Design added to favorites." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
export const removeFromFavorites = async (req, res) => {
  console.log('reached to remove')
  try {
    const userId = req.user.id;
    const { designId } = req.body;

    await User.findByIdAndUpdate(userId, {
      $pull: { favourites: designId },
    });
console.log('removed fav')
    res.status(200).json({ success: true, message: "Design removed from favorites." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
export const getFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('reach 🌶️')
    const user = await User.findById(userId).populate('favourites');
    res.status(200).json({ success: true, favourites: user.favourites });
    console.log(user.favourites)
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
