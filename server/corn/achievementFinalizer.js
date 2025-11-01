    // // cron/achievementFinalizer.js
    // import cron from "node-cron";
    // import Post from "../models/post.js";
    // import User from "../models/user.js";
    // import Notification from "../models/notification.js";

    // cron.schedule("0 * * * *", async () => { // every hour
    // const now = new Date();
    // const pendingPosts = await Post.find({
    //     "pendingAchievement.expiresAt": { $lte: now },
    //     "pendingAchievement.type": { $exists: true },
    // }).populate("createdBy");

    // if (!pendingPosts.length) return;
    // console.log('finilazing the pending posts:', pendingPosts)
    // const juries = await User.find({ role: { $in: ["jury", "dev"] } });
    // const totalReviewers = juries.length;

    // for (const post of pendingPosts) {
    //     const cancelVotes = post.pendingAchievement.votes.length;
    //     const cancelPercent = (cancelVotes / totalReviewers) * 100;

    //     if (cancelPercent >= 70) {
    //         console.log('achivement canceled')
    //     // ❌ Cancel achievement
    //     await Notification.create({
    //         recipient: post.createdBy._id,
    //         type: "achievement_rejected",
    //         message: `❌ Your post "${post.name}" nomination for ${post.pendingAchievement.type.replace(/_/g, " ")} was rejected.`,
    //         post: post._id,
    //     });
    //     post.pendingAchievement = null;
    //     await post.save();
    //     } else {
    //     // ✅ Confirm achievement
    //     const final = {
    //         type: post.pendingAchievement.type,
    //         awardedAt: now,
    //         score: post.totalScore || 0,
    //     };
    //     post.currentAchievement = final;
    //     post.achievementHistory.push(final);
    //     post.pendingAchievement = null;
    //     await post.save();
    // console.log('award goes to :', post)
    //     await Notification.create({
    //         recipient: post.createdBy._id,
    //         type: "achievement_awarded",
    //         message: `🏆 Your post "${post.name}" won ${final.type.replace(/_/g, " ")}!`,
    //         post: post._id,
    //         image: post.images?.[0],
    //     });
    //     }
    // }
    // });

    import Post from "../models/post.js";
import User from "../models/user.js";
import Notification from "../models/notification.js";

export async function finalizePendingAchievements() {
    console.log('finalizing')
    const now = new Date();
    const pendingPosts = await Post.find({
        "pendingAchievement.expiresAt": { $lte: now },
        "pendingAchievement.type": { $exists: true },
    }).populate("createdBy");

    if (!pendingPosts.length) return console.log("No pending posts to finalize");

    console.log("Finalizing the pending posts:", pendingPosts.map(p => p.name));

    const juries = await User.find({ role: { $in: ["jury", "dev"] } });
    const totalReviewers = juries.length;

    for (const post of pendingPosts) {
        const cancelVotes = post.pendingAchievement.votes.length;
        const cancelPercent = (cancelVotes / totalReviewers) * 100;

        if (cancelPercent >= 70) {
            console.log("❌ Achievement canceled for:", post.name);
            await Notification.create({
                recipient: post.createdBy._id,
                type: "achievement_rejected",
                message: `❌ Your post "${post.name}" nomination for ${post.pendingAchievement.type.replace(/_/g, " ")} was rejected.`,
                post: post._id,
            });
            post.pendingAchievement = null;
            await post.save();
        } else {
            // 🟢 Clear previous posts with same achievement
            await Post.updateMany(
                {
                    "currentAchievement.type": post.pendingAchievement.type,
                    _id: { $ne: post._id } // exclude the new winner
                },
                { $set: { currentAchievement: null } }
            );

            const final = {
                type: post.pendingAchievement.type,
                awardedAt: now,
                  score: post.pendingAchievement.score || 0,
            };

            post.currentAchievement = final;
            post.achievementHistory.push(final);
            post.pendingAchievement = null;
            await post.save();

            console.log("🏆 Achievement awarded for:", post.name, "type:", final);

            await Notification.create({
                recipient: post.createdBy._id,
                type: "achievement_awarded",
                message: `🏆 Your post "${post.name}" won ${final.type.replace(/_/g, " ")}!`,
                post: post._id,
                honour : final.type,
                image: post.images?.[0],
            });
        }
    }
}

// Optional: keep cron for production
import cron from "node-cron";
cron.schedule("0 * * * *", finalizePendingAchievements);
