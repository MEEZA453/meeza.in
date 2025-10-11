// controllers/achievement.js
import Post from "../models/post.js";
import Notification from "../models/notification.js";
import User from "../models/user.js";

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
export const getDesignOfTheDay = async (req, res) => {
  try {
    const post = await Post.findOne({ 
      "currentAchievement.type": "design_of_the_day" 
    })
    .populate("createdBy", "name profile handle")
    .populate("votes.user", "name profile handle");

    if (!post) return res.status(404).json({ message: "No design of the day yet" });

    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const getAllAchievements = async (req, res) => {
console.log('getting all achivements')
  try {
    const posts = await Post.find({
      "currentAchievement.type": { 
        $in: [
          "design_of_the_day",
          "design_of_the_week",
          "design_of_the_month",
          "photography_of_the_day",
          "photography_of_the_week",
          "photography_of_the_month",
          "creativity_of_the_day",
          "creativity_of_the_week",
          "creativity_of_the_month"
        ] 
      }
    })
    .sort({ "currentAchievement.awardedAt": -1 })
    .populate("createdBy", "name profile handle")
    .populate("votes.user", "name profile handle");
console.log(posts)
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const getAchievementByType = async (req, res) => {
  try {
    const { type } = req.params;
    const post = await Post.findOne({ "currentAchievement.type": type })
      .populate("createdBy", "name profile handle")
      .populate("votes.user", "name profile handle");

    if (!post) return res.status(404).json({ message: "No post with this achievement yet" });

    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getLeaderboard = async (req, res) => {
    console.log('getting leaderBoard')
  try {
    const { period = "day", category } = req.query; // e.g., ?period=week&category=design

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
        
        console.logt('top scored posts',scored)
    res.json(scored.map(s => ({ post: s.post, avgScore: s.avgScore })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};