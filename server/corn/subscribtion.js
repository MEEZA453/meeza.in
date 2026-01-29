import cron from "node-cron";
import Subscription from "../models/subscription.js";
import User from "../models/user.js";

export const startSubscriptionCron = () => {
  // runs every day at midnight
  cron.schedule("0 0 * * *", async () => {
    try {
      const now = new Date();

      // 1️⃣ Expire active subscriptions
      const expiredSubs = await Subscription.find({
        status: "ACTIVE",
        endDate: { $lte: now },
      });

      for (const sub of expiredSubs) {
        sub.status = "EXPIRED";
        await sub.save();

        // check if there's another active subscription
        const stillActive = await Subscription.findOne({
          user: sub.user,
          startDate: { $lte: now },
          endDate: { $gt: now },
          status: "ACTIVE",
        });

        if (!stillActive) {
          await User.findByIdAndUpdate(sub.user, {
            premium: false,
            premiumExpiresAt: null,
          });
        }
      }

      // 2️⃣ Activate scheduled subscriptions
      const scheduledSubs = await Subscription.find({
        status: "SCHEDULED",
        startDate: { $lte: now },
      });

      for (const sub of scheduledSubs) {
        sub.status = "ACTIVE";
        await sub.save();

        await User.findByIdAndUpdate(sub.user, {
          premium: true,
          premiumExpiresAt: sub.endDate,
          upcomingSubscription: null,
        });
      }

      console.log("✅ Subscription cron ran successfully");
    } catch (err) {
      console.error("❌ Subscription cron error:", err);
    }
  });
};
