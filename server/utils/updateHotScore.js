import Post from "../models/post.js";
import { calculateHotScore } from "./hotScore.js";

export const updateHotScore = async (postId, session = null) => {
  const query = Post.findById(postId).select(
    "views uniqueViewers drip voteStats createdAt"
  );

  if (session) query.session(session);

  const post = await query;
  if (!post) return;

  const votes =
    (post.voteStats?.normal?.count || 0) +
    (post.voteStats?.jury?.count || 0) * 2;

  const hotScore = calculateHotScore({
    views: post.views || 0,
    uniqueViewers: post.uniqueViewers || 0,
    drip: post.drip || 0,
    votes,
    createdAt: post.createdAt,
  });

  await Post.findByIdAndUpdate(
    postId,
    { hotScore },
    session ? { session } : {}
  );
};
