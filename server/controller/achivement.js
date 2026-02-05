// controllers/achievement.js
import Post from "../models/post.js";
import Notification from "../models/notification.js";
import User from "../models/user.js";
import {attachIsAppreciated} from '../utils/attactIsAppreciated.js'
export const getPendingAchievements = async (req, res) => {
  const posts = await Post.find({ "pendingAchievement.type": { $exists: true } })
    .populate("createdBy", "name handle profile");
  res.json(posts);
};

export const voteAgainstAchievement = async (req, res) => {
  const { postId } = req.body;
  const userId = req.user.id;
  const user = await User.findById(userId);
  if (!user.isDev && !user.isJury) return res.status(403).json({ message: "Not authorized" });

  const post = await Post.findById(postId).populate("createdBy");
  if (!post?.pendingAchievement?.type) return res.status(404).json({ message: "No pending achievement" });

  if (!post.pendingAchievement.votes.includes(userId)) {
    post.pendingAchievement.votes.push(userId);
    await post.save();
  }

  res.json({ success: true, message: "Voted to cancel pending achievement." });
};
export const getAchievementsByPeriod = async (req, res) => {
  try {
    const { period = "week" } = req.query; // day | week | month

    if (!["day", "week", "month"].includes(period.toLowerCase())) {
      return res.status(400).json({ message: "Invalid period. Use day, week, or month." });
    }

    const now = new Date();
    const since = new Date();

    if (period === "day") since.setDate(now.getDate() - 1);
    if (period === "week") since.setDate(now.getDate() - 7);
    if (period === "month") since.setMonth(now.getMonth() - 1);

    const regex = new RegExp(`_of_the_${period}$`, "i");

    console.log(`🎯 Fetching all achievements of the ${period} since ${since.toISOString()}`);

    const posts = await Post.find({
      "currentAchievement.type": { $regex: regex },
      "currentAchievement.awardedAt": { $gte: since },
    })
      .sort({ "currentAchievement.awardedAt": -1 })
      .populate("createdBy", "name profile handle")
      .populate("votes.user", "name profile handle")
      .lean(); // ✅ FIX

    if (!posts.length) {
      return res.status(404).json({ message: `No achievements for this ${period} yet.` });
    }

    const postsWithFlag = await attachIsAppreciated(
      posts,
      req.user?.id || null,
      "Post"
    );

    console.log("posts with flag", postsWithFlag.length);

    res.json({
      success: true,
      period,
      total: postsWithFlag.length,
      achievements: postsWithFlag,
    });
  } catch (error) {
    console.error("❌ Error fetching achievements by period:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getAllAchievements = async (req, res) => {
console.log('getting all achivements')
  try {
    const posts = await Post.find({
     "currentAchievement.type": { 
  $in: [
    "Design_of_the_day",
    "Design_of_the_week",
    "Design_of_the_month",
    "Photography_of_the_day",
    "Photography_of_the_week",
    "Photography_of_the_month",
    "creativity_of_the_day",
    "creativity_of_the_week",
    "creativity_of_the_month",
    "Portrait_of_the_day",
    "Portrait_of_the_week",
    "Portrait_of_the_month"
  ]
}

    })
    .sort({ "currentAchievement.awardedAt": -1 })
    .populate("createdBy", "name profile handle")
    .populate("votes.user", "name profile handle");
const postsWithFlag = await attachIsAppreciated(
  posts,
  req.user?.id || null,
  "Post"
);
    res.json(postsWithFlag);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const getAchievementsByTypes = async (req, res) => {
  console.log('getting by type')
  try {
    const typesQuery = req.query.types;
    if (!typesQuery) return res.status(400).json({ message: "types query is required" });

    // Split comma-separated types
    const types = typesQuery.split(',');

    const posts = await Post.find({
      "currentAchievement.type": { $in: types },
    })
      .populate("createdBy", "name profile handle")
      .populate("votes.user", "name profile handle");
const postsWithFlag = await attachIsAppreciated(
  posts,
  req.user?.id || null,
  "Post"
);
    res.json(postsWithFlag);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    const { period = "day", category } = req.query;

    const since = new Date();
    if (period === "day") since.setDate(since.getDate() - 1);
    if (period === "week") since.setDate(since.getDate() - 7);
    if (period === "month") since.setMonth(since.getMonth() - 1);

    const filter = { createdAt: { $gte: since } };
    if (category) filter.category = category;

    const posts = await Post.find(filter)
      .populate("createdBy", "name profile handle")
      .populate("votes.user", "name profile handle");

    const scored = posts.map(post => ({
      post,
      avgScore: calculateAverageScore(post),
    }));

    scored.sort((a, b) => b.avgScore - a.avgScore);

    console.log("Top scored posts:", scored.slice(0, 3).map(s => s.post.name));
    res.json(scored.map(s => ({ post: s.post, avgScore: s.avgScore })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};