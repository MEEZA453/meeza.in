// jobs/highlightQueueProcessor.js
import Post from "../models/post.js";
import HighlightRequest from "../models/HighlightRequest.js";
import Notification from "../models/notification.js";

export async function processHighlightQueue() {
  try {
    const now = new Date();
console.log('processing highlight quequ')
    // 1) Expire posts whose highlightedUntil passed
    const expired = await Post.find({ isHighlighted: true, highlightedUntil: { $lte: now } });
    for (const post of expired) {
      post.isHighlighted = false;
      post.highlightedUntil = null;
      await post.save();

      // mark related HighlightRequest as EXPIRED
      await HighlightRequest.updateMany({ post: post._id, status: "APPROVED", expiresAt: { $lte: now } }, { $set: { status: "EXPIRED" } });
    }

    // 2) start approved requests whose startsAt <= now and that are still APPROVED
    const toStart = await HighlightRequest.find({ status: "APPROVED", startsAt: { $lte: now } }).sort({ startsAt: 1 }).limit(10).populate("post requester");

    for (const r of toStart) {
      // skip if post already highlighted now (shouldn't be)
      const post = await Post.findById(r.post._id);
      if (!post) continue;

      // Activate
      post.isHighlighted = true;
      post.highlightedBy.push({ user: r.requester._id, highlightedAt: new Date() });
      post.highlightedUntil = r.expiresAt;
      post.lastHighlightedAt = new Date();
      await post.save();

      // mark request as started (still APPROVED is fine, but we can add a new status or leave)
      // We'll keep status APPROVED but set a meta flag
      await HighlightRequest.findByIdAndUpdate(r._id, { $set: { startedAt: new Date() } });

      // notify requester

    }
    
    console.log('process successful')
    // Optionally: compute queue positions and update requests->position if you want

  } catch (err) {
    console.error("processHighlightQueue error", err);
  }
}
