// utils/handleVoteNotification.js
import Notification from "../models/notification.js";
import Post from "../models/post.js";
import Vote from "../models/vote.js";

export const handleVoteNotification = async (recipientId, postId, senderId) => {
  try {
    // find existing grouped vote notification
    let existingNotification = await Notification.findOne({
      recipient: recipientId,
      post: postId,
      type: "vote",
    })
      .populate("meta.voters", "handle profile")
      .exec();

    // get post (no heavy votes array)
    const post = await Post.findById(postId);
    if (!post) return null;

    // ✅ total votes (O(1), production-safe)
    const totalVotes =
      (post.voteStats?.normal?.count || 0) +
      (post.voteStats?.jury?.count || 0);

    // ✅ latest two voters (indexed query)
    const latestTwoVotes = await Vote.find({ post: postId })
      .sort({ updatedAt: -1 })
      .limit(2)
      .populate("user", "handle profile")
      .lean();

    const latestTwo = latestTwoVotes
      .map(v => v.user?._id)
      .filter(Boolean);

    if (existingNotification) {
      // update grouped notification
      existingNotification.meta = {
        voters: latestTwo,
        totalVotes,
      };
      existingNotification.isRead = false;
      await existingNotification.save();
    } else {
      // create new notification
      existingNotification = await Notification.create({
        recipient: recipientId,
        sender: senderId,
        post: postId,
        type: "vote",
        message: "voted your post",
        image: post.images?.[0] || null,
        meta: {
          voters: latestTwo,
          totalVotes,
        },
      });
    }

    return existingNotification;
  } catch (err) {
    console.error("Error handling vote notification:", err);
    return null;
  }
};
