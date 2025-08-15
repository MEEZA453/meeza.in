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
// export const getFavorites = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     console.log('reach to get fav🌶️')
//     const user = await User.findById(userId).populate('favourites');
//     res.status(200).json({ success: true, favourites: user.favourites });
   
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// backend/controllers/favController.js



export const getFavoritesByHandle = async (req, res) => {
  try {
    const requestedHandle = req.params.handle;
    const requesterUserId = req.user?.id || null;


    const targetUser = await User.findOne({ handle: requestedHandle }).populate('favourites');

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isUser = requesterUserId && targetUser._id.toString() === requesterUserId;
    return res.status(200).json({
      success: true,
      favourites: targetUser.favourites,

      isUser,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
