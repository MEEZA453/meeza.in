import User from "../models/user.js";
import Notification from '../models/notification.js'
// Follow a user
export const followUser = async (req, res) => {
  console.log("got follow request");
  try {
    const userId = req.user.id;        // logged-in user
    const targetId = req.params.id;    // user to follow

    if (userId === targetId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const user = await User.findById(userId);
    const targetUser = await User.findById(targetId);

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.following.includes(targetId)) {
      return res.status(400).json({ message: "Already following this user" });
    }

    user.following.push(targetId);
    targetUser.followers.push(userId);

    await user.save();
    await targetUser.save();

    // ✅ Create notification
    await Notification.create({
      recipient: targetId,
      sender: userId,
      type: "follow",
      message: `@${user.handle} started following you`,
    });

    console.log("following");
    res.status(200).json({ message: "Followed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const unfollowUser = async (req, res) => {
  console.log("got unfollow request");
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

    // remove follow
    user.following = user.following.filter((id) => id.toString() !== targetId);
    targetUser.followers = targetUser.followers.filter((id) => id.toString() !== userId);

    await user.save();
    await targetUser.save();

    console.log("unfollowed");
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
  console.log('got get following req')
  try {
    const user = await User.findOne({ handle: req.params.handle }).populate("following", "name handle profile");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user.following);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
