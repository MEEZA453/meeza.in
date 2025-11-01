// utils/handleVoteNotification.js
import Notification from "../models/notification.js";
import Post from "../models/post.js";

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

    // get latest post to count total unique voters
    const post = await Post.findById(postId).populate("votes.user", "handle profile");
    if (!post) return null;

    // total unique voters (count of votes array)
    const totalVotes = post.votes.length;

    // prepare latest two voters (including this sender)
    // find latest two unique voter IDs sorted by vote time (last updated)
    const latestTwo = post.votes
      .slice(-2) // get latest two
      .map((v) => v.user?._id)
      .filter(Boolean);

    if (existingNotification) {
      // update it instead of creating new
      existingNotification.meta = {
        voters: latestTwo,
        totalVotes,
      };
      existingNotification.isRead = false; // mark unread on update
      await existingNotification.save();
    } else {
      // create a new notification
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
