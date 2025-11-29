import mongoose from "mongoose";
import Vote from "../models/vote.js";
import Post from "../models/post.js";
export const calculateScore = (voteFields = [], voteStats = {}) => {
  const averages = {};
  for (const f of voteFields) {
    const juryCount = voteStats?.jury?.count || 0;
    const normalCount = voteStats?.normal?.count || 0;
    const jurySum = voteStats?.jury?.sums?.[f] || 0;
    const normalSum = voteStats?.normal?.sums?.[f] || 0;

    const juryAvg = juryCount > 0 ? jurySum / juryCount : null;
    const normalAvg = normalCount > 0 ? normalSum / normalCount : null;

    let weighted = 0;
    if (juryAvg !== null && normalAvg !== null) weighted = juryAvg * 0.6 + normalAvg * 0.4;
    else if (juryAvg !== null) weighted = juryAvg;
    else if (normalAvg !== null) weighted = normalAvg;
    else weighted = 0;

    averages[f] = Number(weighted.toFixed(2));
  }

  const totalScore = Number(
    (
      Object.values(averages).reduce((sum, v) => sum + v, 0) /
      (voteFields.length || 1)
    ).toFixed(1)
  );

  return { averages, totalScore };
};

// export const calculateScore = async (postId) => {
//   // fetch post to get dynamic voteFields
//   const post = await Post.findById(postId).lean();
//   if (!post) return { averages: {}, totalScore: 0 };

//   const voteFields = post.voteFields || [];
//   if (voteFields.length === 0) return { averages: {}, totalScore: 0 };

//   // fetch all votes for this post
//   const votes = await Vote.find({ post: postId })
//     .populate("user", "role")
//     .lean();

//   if (!votes || votes.length === 0)
//     return { averages: {}, totalScore: 0 };

//   // split jury + normal
//   const juryVotes = votes.filter(v => v.user?.role === "jury");
// const normalVotes = votes.filter(v => v.user?.role !== "jury");
//   const averages = {};

//   voteFields.forEach(field => {
//     const juryAvg =
//       juryVotes.length > 0
//         ? juryVotes.reduce((sum, v) => sum + (v.fields?.[field] || 0), 0) / juryVotes.length
//         : null;

//     const normalAvg =
//       normalVotes.length > 0
//         ? normalVotes.reduce((sum, v) => sum + (v.fields?.[field] || 0), 0) / normalVotes.length
//         : null;

//     let weighted = 0;

//     if (juryAvg !== null && normalAvg !== null) {
//       weighted = juryAvg * 0.6 + normalAvg * 0.4;
//     } else if (juryAvg !== null) {
//       weighted = juryAvg;
//     } else if (normalAvg !== null) {
//       weighted = normalAvg;
//     } else {
//       weighted = 0;
//     }

//     averages[field] = Number(weighted.toFixed(2));
//   });

//   // final weighted post score
//   const totalScore = Number(
//     (
//       Object.values(averages).reduce((sum, v) => sum + v, 0) /
//       voteFields.length
//     ).toFixed(1)
//   );

//   return { averages, totalScore };
// };
