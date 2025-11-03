import User from "../models/user.js";
import Notification from '../models/notification.js'
// Follow a user
export const followUser = async (req, res) => {
  console.log("got follow request");
  try {
    const userId = req.user.id;
    const targetId = req.params.id;

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

    // ✅ Follow action
    user.following.push(targetId);
    targetUser.followers.push(userId);

    await user.save();
    await targetUser.save();

    // ✅ Check if the target already follows the current user
    const isFollowingBack = targetUser.following.includes(userId);

    // ✅ Create notification including isFollowing info
    const notification = await Notification.create({
      recipient: targetId,
      sender: userId,
      type: "follow",
      message: `@${user.handle} started following you`,
      isFollowing: isFollowingBack, // 🔥 save directly in DB
    });

    const populatedNotification = await notification.populate("sender", "handle profile name");

    console.log("following");
    res.status(200).json({
      message: "Followed successfully",
      notification: populatedNotification,
    });

  } catch (error) {
    console.error("Error in followUser:", error);
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
    const { handle } = req.params;
    const currentUserId = req.user?._id || req.query.currentUserId; // ✅ fallback for testing

    // 1️⃣ Find the target user (whose followers you’re viewing)
    const user = await User.findOne({ handle })
      .populate("followers", "name handle profile");

    if (!user) return res.status(404).json({ message: "User not found" });

    // 2️⃣ Fetch current user's following list
    let followingSet = new Set();
    if (currentUserId) {
      const currentUser = await User.findById(currentUserId, "following");
      if (currentUser) {
        followingSet = new Set(currentUser.following.map(f => f.toString()));
      } else {
        console.warn("⚠️ currentUser not found for ID:", currentUserId);
      }
    } else {
      console.warn("⚠️ currentUserId missing in request");
    }

    // 3️⃣ Combine followers + following info
    const followersWithStatus = user.followers.map(follower => ({
      _id: follower._id,
      name: follower.name,
      handle: follower.handle,
      profile: follower.profile,
      isFollowing: followingSet.has(follower._id.toString())
    }));

    res.status(200).json(followersWithStatus);
  } catch (error) {
    console.error("Error fetching followers:", error);
    res.status(500).json({ message: error.message });
  }
};
// Get following
// Get Following
export const getFollowing = async (req, res) => {
  console.log('got get following req');
  try {
    const { handle } = req.params;
    const currentUserId = req.user?._id || req.query.currentUserId; // fallback for testing

    // 1️⃣ Find the target user (whose following list you're viewing)
    const user = await User.findOne({ handle })
      .populate("following", "name handle profile");

    if (!user) return res.status(404).json({ message: "User not found" });

    // 2️⃣ Fetch current user's following list
    let followingSet = new Set();
    if (currentUserId) {
      const currentUser = await User.findById(currentUserId, "following");
      if (currentUser) {
        followingSet = new Set(currentUser.following.map(f => f.toString()));
      } else {
        console.warn("⚠️ currentUser not found for ID:", currentUserId);
      }
    } else {
      console.warn("⚠️ currentUserId missing in request");
    }

    // 3️⃣ Combine following list + mutual follow info
    const followingWithStatus = user.following.map(followedUser => ({
      _id: followedUser._id,
      name: followedUser.name,
      handle: followedUser.handle,
      profile: followedUser.profile,
      isFollowing: followingSet.has(followedUser._id.toString()), // whether current user also follows them
    }));

    res.status(200).json(followingWithStatus);
  } catch (error) {
    console.error("Error fetching following:", error);
    res.status(500).json({ message: error.message });
  }
};
