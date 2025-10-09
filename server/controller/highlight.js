import User from "../models/user.js";
import Product from "../models/designs.js";
export const addToHighlight = async (req, res) => {
console.log('reached to add highlight')
  try {
    const userId = req.user.id;
    const { designId } = req.body;
console.log(userId)
    const user = await User.findById(userId);

    if (!user.highlights.includes(designId)) {
      user.highlights.push(designId);

      await user.save();
    }
console.log('added to highlight')
    res.status(200).json({ success: true, message: "Design added to highlight." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
export const removeFromHighlight = async (req, res) => {
  console.log('reached to remove highlight')
  try {
    const userId = req.user.id;
    const { designId } = req.body;

    await User.findByIdAndUpdate(userId, {
      $pull: { highlights: designId },
    });
console.log('removed highlikt')
    res.status(200).json({ success: true, message: "Design removed from highlifht." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAllHighlights = async (req, res) => {
  console.log("reached to getAllHighlights");
  try {
    const requesterUserId = req.user?.id || null;
    const { category } = req.query; // e.g. "Design,Photography"
    console.log("category filter:", category);

    // Pull all highlights from all users and populate post details
    const usersWithHighlights = await User.find({ highlights: { $exists: true, $ne: [] } })
      .populate({
        path: "highlights",
        options: { sort: { createdAt: -1 } }, // newest first
        populate: [
          { path: "createdBy", select: "name profile handle" },
          { path: "votes.user", select: "name profile handle" },
        ],
      });

    // Flatten all highlights into one array
    let highlights = usersWithHighlights.flatMap(user => user.highlights);

    // 🔹 Filter & sort by category like getPosts
    if (category) {
      const parts = category.split(",").map(c => c.trim());

      // Posts matching any of the selected categories
      const inCategory = highlights
        .filter(p => p.category.some(c => parts.includes(c)))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // Posts NOT in selected categories
      const outCategory = highlights
        .filter(p => !p.category.some(c => parts.includes(c)))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      highlights = [...inCategory, ...outCategory];
    } else {
      // No filter → sort all by newest
      highlights = highlights.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    return res.status(200).json({
      success: true,
      highlights,
      requesterUserId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

