import User from "../models/user.js";
import Product from "../models/designs.js";
import post from "../models/post.js";
export const addToFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { designId } = req.body;

    const user = await User.findById(userId).select("favourites");
    const postDoc = await post.findById(designId).select("appreciations appreciationCount");

    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (!postDoc) return res.status(404).json({ success: false, message: "Post not found" });

    // If not already favorite → add at start (newest first)
    if (!user.favourites.includes(designId)) {
      user.favourites.unshift(designId);
      await user.save();

      // Add appreciation if not given before
      const already = postDoc.appreciations.some(a => String(a.user) === userId);

      if (!already) {
        postDoc.appreciations.push({
          user: userId,
          name: user.name,
          profile: user.profile,
          handle: user.handle
        });

        postDoc.appreciationCount = (postDoc.appreciationCount || 0) + 1;
        await postDoc.save();
      }
    }

    res.status(200).json({ success: true, message: "Added to favorites." });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const removeFromFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { designId } = req.body;

    await User.findByIdAndUpdate(
      userId,
      { $pull: { favourites: designId } },
      { new: true }
    );

    const postDoc = await post.findById(designId).select("appreciations appreciationCount");

    if (postDoc) {
      const before = postDoc.appreciations.length;

      postDoc.appreciations = postDoc.appreciations.filter(
        a => String(a.user) !== String(userId)
      );

      if (postDoc.appreciations.length !== before) {
        postDoc.appreciationCount = Math.max(0, postDoc.appreciationCount - 1);
        await postDoc.save();
      }
    }

    res.status(200).json({ success: true, message: "Removed from favorites." });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getPostAppreciations = async (req, res) => {
  try {
    const { postId } = req.params;

    const limit = parseInt(req.query.limit || "20", 10);
    const page = parseInt(req.query.page || "1", 10);
    const skip = (page - 1) * limit;

    const doc = await post
      .findById(postId)
      .select("appreciations appreciationCount")
      .lean();

    if (!doc) return res.status(404).json({ success: false, message: "Post not found" });

    const total = doc.appreciations.length;

    const sliced = doc.appreciations
      .sort((a, b) => b.appreciatedAt - a.appreciatedAt) // newest first
      .slice(skip, skip + limit);

    res.json({
      success: true,
      appreciations: sliced,
      count: total,
      page,
      limit,
      hasMore: page * limit < total
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// controllers/favController.js (or wherever you keep it)
export const getFavoritesByHandle = async (req, res) => {
  
  try {
    const { handle } = req.params;
    const requesterUserId = req.user?.id || null;

    const limit = parseInt(req.query.limit || "10", 10);
    const page = parseInt(req.query.page || "1", 10);
    const skip = (page - 1) * limit;

    const user = await User.findOne({ handle }).select("favourites");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // ⭐ Already in "recent → older" because of unshift()
    const favouriteIds = user.favourites;

    const total = favouriteIds.length;

    if (total === 0) {
      return res.json({
        success: true,
        favourites: [],
        count: 0,
        page,
        limit,
        hasMore: false,
        isUser: requesterUserId === String(user._id)
      });
    }

    // ⭐ apply pagination to maintain array order
    const paginatedIds = favouriteIds.slice(skip, skip + limit);

    // ⭐ fetch posts (unordered)
    const posts = await post.find({ _id: { $in: paginatedIds } })
      .populate("createdBy", "name profile handle")
      .populate("votes.user", "name profile handle")
      .lean();

    // ⭐ RE-SORT posts according to paginatedIds order
    const sortedPosts = paginatedIds
      .map(id => posts.find(p => String(p._id) === String(id)))
      .filter(Boolean);

    return res.json({
      success: true,
      favourites: sortedPosts, // <-- now correct order
      count: total,
      page,
      limit,
      hasMore: skip + limit < total,
      isUser: requesterUserId === String(user._id)
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};





