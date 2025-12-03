import User from "../models/user.js";
import Group from "../models/group.js";
import keyword from "../models/keyword.js";

// ===========================
// Helper: save recent searches
// ===========================
async function saveRecentQuery(userId, keyword) {
  if (!userId || !keyword.trim()) return;

  await User.findByIdAndUpdate(userId, {
    $pull: { recentSearches: keyword },     // remove duplicate
  });

  await User.findByIdAndUpdate(userId, {
    $push: {
      recentSearches: {
        $each: [keyword],
        $position: 0    // add at top
      }
    }
  });

  await User.findByIdAndUpdate(userId, {
    $push: {
      recentSearches: { $each: [], $slice: 10 } // max 10 entries
    }
  });
}

export const deleteRecentKeyword = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { keyword } = req.body;

    if (!userId || !keyword)
      return res.status(400).json({ success: false, message: "keyword missing" });

    await User.findByIdAndUpdate(userId, {
      $pull: { recentSearches: keyword }
    });

    res.json({ success: true, removed: keyword });
  } catch (err) {
    console.error("❌ Error deleting keyword:", err);
    res.status(500).json({ success: false });
  }
};


export const deleteRecentVisitedUser = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { removeUserId } = req.body;

    if (!userId || !removeUserId)
      return res.status(400).json({ success: false, message: "removeUserId missing" });

    await User.findByIdAndUpdate(userId, {
      $pull: { recentlyVisitedUsers: removeUserId }
    });

    res.json({ success: true, removed: removeUserId });
  } catch (err) {
    console.error("❌ Error deleting visited user:", err);
    res.status(500).json({ success: false });
  }
};
export const deleteRecentVisitedGroup = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { removeGroupId } = req.body;

    if (!userId || !removeGroupId)
      return res.status(400).json({ success: false, message: "removeGroupId missing" });

    await User.findByIdAndUpdate(userId, {
      $pull: { recentlyVisitedGroups: removeGroupId }
    });

    res.json({ success: true, removed: removeGroupId });
  } catch (err) {
    console.error("❌ Error deleting visited group:", err);
    res.status(500).json({ success: false });
  }
};

// ===========================
// GET DEFAULT RESULTS
// ===========================
export const getSearchDefaults = async (req, res) => {
  try {
    const userId = req.user?.id;

    const user = userId
      ? await User.findById(userId)
          .select("recentSearches recentlyVisitedUsers recentlyVisitedGroups")
          .populate({
            path: "recentlyVisitedUsers",
            select: "handle name profile"
          })
          .populate({
            path: "recentlyVisitedGroups",
            select: "name profile owner",
            populate: { path: "owner", select: "handle profile" }
          })
      : null;

    const trendingUsers = await User.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .select("handle name profile");

    const trendingGroups = await Group.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .select("name profile owner")
      .populate({ path: "owner", select: "handle profile" });

    return res.status(200).json({
      success: true,

      // 👉 only return the latest 4
      recentKeywords: user?.recentSearches?.slice(0, 4) || [],
      recentUsers: user?.recentlyVisitedUsers?.slice(0, 4) || [],
      recentGroups: user?.recentlyVisitedGroups?.slice(0, 4) || [],

      trendingUsers,
      trendingGroups
    });

  } catch (err) {
    console.log("❌ Error in search defaults:", err);
    res.status(500).json({ success: false });
  }
};

// ===========================
// MASTER SEARCH (INSTAGRAM LIKE)
// ===========================

export const searchEverything = async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.user?.id;
console.log('searchEverything called with query:', query, 'by user:', userId)
    if (!query || query.trim() === "")
      return res.status(400).json({ message: "Query is required" });

    // Save to recent keywords
    // if (userId) saveRecentQuery(userId, query);

    // ================================
    // 1) KEYWORD AUTOCOMPLETE
    // ================================
    const keywords = await keyword.find({
      text: { $regex: "^" + query, $options: "i" }
    })
      .sort({ popularity: -1 })
      .limit(10)
      .select("text");

    // ================================
    // 2) USERS SEARCH
    // ================================
    const users = await User.find({
      $or: [
        { handle: { $regex: query, $options: "i" } },
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } }
      ]
    })
      .limit(20)
      .select("handle name profile");

    // ================================
    // 3) GROUPS SEARCH
    // ================================
    const groups = await Group.find({
      name: { $regex: query, $options: "i" }
    })
      .limit(20)
      .select("name profile owner subscribers contributors")
      .populate({ path: "owner", select: "handle profile" })
      .lean();

    const formattedGroups = groups.map(g => ({
      _id: g._id,
      name: g.name,
      profile: g.profile,
      owner: g.owner,
      totalSubscribers: (g.subscribers || []).length,
      noOfContributors: (g.contributors || []).length,
    }));


    return res.status(200).json({
      query,
      keywords,
      users,
      groups: formattedGroups
    });

  } catch (err) {
    console.error("❌ searchEverything error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
export const saveRecentKeyword = async (req, res) => {

  try {
    const userId = req.user?.id;
    const { keyword } = req.body;

    console.log('😒saveRecentKeyword called with keyword:', keyword, 'by user:', userId)
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!keyword || !keyword.trim())
      return res.status(400).json({ message: "Keyword required" });

    // Remove duplicate
    await User.findByIdAndUpdate(userId, {
      $pull: { recentSearches: keyword }
    });

    // Add to top
    await User.findByIdAndUpdate(userId, {
      $push: {
        recentSearches: {
          $each: [keyword],
          $position: 0
        }
      }
    });

    // Limit 10 in DB
    await User.findByIdAndUpdate(userId, {
      $push: {
        recentSearches: { $each: [], $slice: 10 }
      }
    });
console.log('✅ Keyword saved successfully');
    return res.status(200).json({ success: true });

  } catch (e) {
    console.log("❌ saveRecentKeyword error:", e);
    res.status(500).json({ message: "Server error" });
  }
};