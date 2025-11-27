// cron/achievementScheduler.js
import cron from "node-cron";
import Post from "../models/post.js";
import Notification from "../models/notification.js";
import { calculateAverageScore } from "../utils/caltulateAvgScore.js"; 
import User from "../models/user.js";
import Vote from "../models/vote.js";
import mongoose from "mongoose";
import { calculateScore } from "../utils/calculateScore.js";
const thresholds = {
  day: { minNormal: 3, minJuryDev: 1 },
  week: { minNormal: 5, minJuryDev: 2 },
  month: { minNormal: 10, minJuryDev: 3 },
};

// Every day at 00:00
cron.schedule("0 0 * * *", async () => {
  console.log("🏁 Running daily achievement nomination...");
  await generatePendingAchievements("day", thresholds.day.minNormal, thresholds.day.minJuryDev);
});

// Every Monday 00:00
cron.schedule("0 0 * * 1", async () => {
  console.log("🏁 Running weekly achievement nomination...");
  await generatePendingAchievements("week", thresholds.week.minNormal, thresholds.week.minJuryDev);
});

// Every 1st of month 00:00
cron.schedule("0 0 1 * *", async () => {
  console.log("🏁 Running monthly achievement nomination...");
  await generatePendingAchievements("month", thresholds.month.minNormal, thresholds.month.minJuryDev);
});
// const countVotesByRole = async (post) => {
//   let normalVotes = 0;
//   let juryDevVotes = 0;

//   for (const vote of post.votes) {
//     const user = await User.findById(vote.user).select("role");
//     if (!user) continue;
//     if (user.role === "normal") normalVotes++;
//     else if (["jury", "dev"].includes(user.role)) juryDevVotes++;
//   }

//   return { normalVotes, juryDevVotes };
// };
const countVotesByRole = async (postId) => {
  const votes = await Vote.aggregate([
    { $match: { post: new mongoose.Types.ObjectId(postId) } },

    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "userDoc"
      }
    },
    { $unwind: "$userDoc" },

    {
      $group: {
        _id: null,
        normalVotes: {
          $sum: { $cond: [{ $eq: ["$userDoc.role", "normal"] }, 1, 0] }
        },
        juryDevVotes: {
          $sum: { $cond: [{ $in: ["$userDoc.role", ["jury", "dev"]] }, 1, 0] }
        }
      }
    }
  ]);

  return votes[0] || { normalVotes: 0, juryDevVotes: 0 };
};
// Utility: get parent category
function getParentCategory(post) {
  // post.category = ["Design", "Graphic Design"]
  return post.category?.[0] || "General";
}

// Example: "Design" => "Design_of_the_day"
function getAchievementType(post, period) {
  const parent = getParentCategory(post);
  return `${parent}_of_the_${period}`; // e.g., Design_of_the_day
}

export async function generatePendingAchievements(period, minNormal = 1, minJuryDev = 2) {
  console.log('generating pending achievements');
  const now = new Date();
  const since = new Date();

  if (period === "day") since.setDate(now.getDate() - 1);
  if (period === "week") since.setDate(now.getDate() - 7);
  if (period === "month") since.setMonth(now.getMonth() - 1);

  // const posts = await Post.find({ createdAt: { $gte: since } }).populate("createdBy");
  const posts = await Post.find({ 
  $and: [
    { pendingAchievement: null },
    { $or: [
        { createdAt: { $gte: since } },
      ] 
    }
  ]
}).populate("createdBy");
  if (!posts.length) return;

  // 1️⃣ Group posts by parent category
  const postsByCategory = {};
  for (const post of posts) {
      const parent = post.category?.[0] || "General";
      if (!postsByCategory[parent]) postsByCategory[parent] = [];
      postsByCategory[parent].push(post);
  }

  // 2️⃣ Loop through each category and pick top post
  for (const [parent, categoryPosts] of Object.entries(postsByCategory)) {
      const scored = [];

for (const post of categoryPosts) {
  const { normalVotes, juryDevVotes } = await countVotesByRole(post._id);

  if (normalVotes >= minNormal && juryDevVotes >= minJuryDev) {

    const scoreData = await calculateScore(post._id);
    const avgScore = scoreData.totalScore;

    scored.push({ post, avgScore });

    post.totalScore = avgScore;
    await post.save();

    console.log(`Post: ${post.name}, Parent: ${parent}, AvgScore: ${avgScore}`);
  }
}

//       for (const post of categoryPosts) {
//           const { normalVotes, juryDevVotes } = await countVotesByRole(post);
//           if (normalVotes >= minNormal && juryDevVotes >= minJuryDev) {
//              const avgScore = calculateAverageScore(post);
// scored.push({ post, avgScore });
// post.totalScore = avgScore; // ← add this
// await post.save();

//               console.log(`Post: ${post.name}, Parent: ${parent}, AvgScore: ${avgScore}`);
//           }
//       }

      if (!scored.length) continue; // no post passed threshold

      // 3️⃣ Pick top post in this category
      scored.sort((a, b) => b.avgScore - a.avgScore || a.post.createdAt - b.post.createdAt);
      const top = scored[0];
      if (!top) continue;

      // 4️⃣ Set pending achievement
      const type = `${parent}_of_the_${period}`;
top.post.pendingAchievement = {
    type,
    startedAt: now,
    expiresAt: new Date(Date.now() - 1000),
    score: top.avgScore,
    votes: [],
    category: top.post.category[0] // ← lock the category now
};
   
      await top.post.save();

      console.log(`Top post for ${parent}: ${top.post.name}, Achievement: ${type}`);
  }
}

// export async function generatePendingAchievements(period, minNormal = 1, minJuryDev = 2) {
//   console.log('generating pending achivments')
//   const now = new Date();
//   const since = new Date();

//   if (period === "day") since.setDate(now.getDate() - 1);
//   if (period === "week") since.setDate(now.getDate() - 7);
//   if (period === "month") since.setMonth(now.getMonth() - 1);

//   const posts = await Post.find({ createdAt: { $gte: since } }).populate("createdBy");
//   if (!posts.length) return;

//   const scored = [];

//   for (const post of posts) {
//       const { normalVotes, juryDevVotes } = await countVotesByRole(post);
//       console.log(`Post: ${post.name}, NormalVotes: ${normalVotes}, JuryDevVotes: ${juryDevVotes}`);
      
//       if (normalVotes >= minNormal && juryDevVotes >= minJuryDev) {
//         console.log('it can be calculate')
//         const avgScore = calculateAverageScore(post);
//         console.log(`AvgScore: ${avgScore}`);
//         // Save the achievement type now to avoid future changes
//         const achievementType = getAchievementType(post, period);
//         scored.push({ post, avg: avgScore, achievementType });
//       }
//   }

//   if (!scored.length) return; // no post passed threshold

//   scored.sort((a, b) => b.avg - a.avg || a.post.createdAt - b.post.createdAt);
//   const top = scored[0];
//   if (!top) return;

//   const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

//   // Save the parent category-based achievement type inside pendingAchievement
//   top.post.pendingAchievement = {
//     type: top.achievementType, // <-- fixed at nomination time
//     startedAt: now,
//   expiresAt: new Date(Date.now() - 1000), // expired 1 second ago
//     votes: [],
//   };
//   await top.post.save();

// //   const juries = await User.find({ role: { $in: ["jury", "dev"] } });
// //   for (const jury of juries) {
// //       await Notification.create({
// //         recipient: jury._id,
// //         type: "achievement_review",
// //         message: `A post "${top.post.name}" is pending your review.`,
// //         post: top.post._id,
// //       });
// //   }

//   console.log('top post is :', top.post.name, 'Achievement:', top.post.pendingAchievement.type);
// //   await Notification.create({
// //     recipient: top.post.createdBy._id,
// //     type: "achievement_pending",
// //     message: `Your post "${top.post.name}" is nominated for ${top.post.pendingAchievement.type.replace(/_/g, " ")}! Jury will review within 24h.`,
// //     post: top.post._id,
// //     image: top.post.images?.[0],
// //   });
// }


//  export async function generatePendingAchievements(period, minNormal = 1, minJuryDev = 2) {
//     console.log('generating pending achivments')
//   const now = new Date();
//   const since = new Date();

//   if (period === "day") since.setDate(now.getDate() - 1);
//   if (period === "week") since.setDate(now.getDate() - 7);
//   if (period === "month") since.setMonth(now.getMonth() - 1);

//   const posts = await Post.find({ createdAt: { $gte: since } }).populate("createdBy");
//   if (!posts.length) return;

//   const scored = [];

//   for (const post of posts) {
//       const { normalVotes, juryDevVotes } = await countVotesByRole(post);
//        console.log(`Post: ${post.name}, NormalVotes: ${normalVotes}, JuryDevVotes: ${juryDevVotes}`);
//       if (normalVotes >= minNormal && juryDevVotes >= minJuryDev) {
//         console.log('it can be calculate')
//           const avgScore = calculateAverageScore(post);
//          console.log(`AvgScore: ${avgScore}`)
//       scored.push({ post, avg: avgScore });
//     }
//   }

//   if (!scored.length) return; // no post passed threshold

// scored.sort((a, b) => b.avg - a.avg || a.post.createdAt - b.post.createdAt);
//   const top = scored[0];
//   if (!top) return;

//   const type = `design_of_the_${period}`;
//   const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

// //   top.post.pendingAchievement = {
// //     type,
// //     startedAt: now,
// //     expiresAt: expires,
// //     votes: [],
// //   };
// top.post.pendingAchievement = {
//   type,
//   startedAt: now,
//   expiresAt: new Date(Date.now() - 1000), // expired 1 second ago
//   votes: [],
// };
// await top.post.save();
//   await top.post.save();
//     // console.log('top post is:', console.log(top.post))


// const juries = await User.find({ role: { $in: ["jury", "dev"] } });
// for (const jury of juries) {
    
//   await Notification.create({
//     recipient: jury._id,
//     type: "achievement_review",
//     message: `A post "${top.post.name}" is pending your review.`,
//     post: top.post._id,
//   });
// }
// console.log('top post is :', top.post.name)
//   await Notification.create({
//     recipient: top.post.createdBy._id,
//     type: "achievement_pending",
//     message: `Your post "${top.post.name}" is nominated for ${type.replace(/_/g, " ")}! Jury will review within 24h.`,
//     post: top.post._id,
//     image: top.post.images?.[0],
//   });
// }
