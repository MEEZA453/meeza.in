import User from "../models/user.js";
import Product from "../models/designs.js";
export const addToPromotion = async (req, res) => {
console.log('reached to add highlight')
  try {
    const userId = req.user.id;
    const { designId } = req.body;

    const user = await User.findById(userId);

    if (!user.promotions.includes(designId)) {
      user.promotions.push(designId);

      await user.save();
    }
console.log('added to promotion')
    res.status(200).json({ success: true, message: "Design added to highlight." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
export const removeFromPromotion = async (req, res) => {
  console.log('reached to remove promotion')
  try {
    const userId = req.user.id;
    const { designId } = req.body;

    await User.findByIdAndUpdate(userId, {
      $pull: { promotions: designId },
    });
console.log('removed promotion')
    res.status(200).json({ success: true, message: "Design removed from highlifht." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


export const getAllPromotion = async (req, res) => {
  console.log('reached to getAll promotion')
  try {
    const requesterUserId = req.user?.id || null;

    // Pull all highlights from all users and populate post details
    const usersWithPromotions = await User.find({ promotions: { $exists: true, $ne: [] } })
    .sort({ createdAt: -1 })
      .populate({
        path: "promotions",
        populate: [
          { path: "createdBy", select: "name profile handle" },
          { path: "votes.user", select: "name profile handle" }
        ]
      });

    // Flatten all highlights into one array
    const promotions = usersWithPromotions.flatMap(user => user.promotions);


    return res.status(200).json({
      success: true,
      promotions,
      requesterUserId
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
