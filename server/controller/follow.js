import User from "../models/user.js";

// Follow a user
export const followUser = async (req, res) => {
  try {
    const userId = req.user.id; // the one doing the follow
    const targetId = req.params.id; // the one being followed

    if (userId === targetId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const user = await User.findById(userId);
    const targetUser = await User.findById(targetId);

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already following
    if (user.following.includes(targetId)) {
      return res.status(400).json({ message: "Already following this user" });
    }

    user.following.push(targetId);
    targetUser.followers.push(userId);

    await user.save();
    await targetUser.save();

    res.status(200).json({ message: "Followed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Unfollow a user
export const unfollowUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const targetId = req.params.id;

    if (userId === targetId) {
      return res.status(400).json({ message: "You cannot unfollow yourself" });
    }

    const user = await User.findById(userId);
    const targetUser = await User.findById(targetId);

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove from following
    user.following = user.following.filter((id) => id.toString() !== targetId);
    // Remove from followers
    targetUser.followers = targetUser.followers.filter((id) => id.toString() !== userId);

    await user.save();
    await targetUser.save();

    res.status(200).json({ message: "Unfollowed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get followers
export const getFollowers = async (req, res) => {
  try {
    const user = await User.findOne({ handle: req.params.handle }).populate("followers", "name handle profile");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user.followers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get following
export const getFollowing = async (req, res) => {
  try {
    const user = await User.findOne({ handle: req.params.handle }).populate("following", "name handle profile");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user.following);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
