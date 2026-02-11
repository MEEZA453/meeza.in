import cron from "node-cron";
import User from "../models/use.js";
import Post from "../models/post.js";
import Product from "../models/design.js";

const DECAY_PERCENTAGE = 0.10; // 10%

export const startDripDecay = () => {
  // Run at 00:00 on 1st of every month
  cron.schedule("0 0 1 * *", async () => {
    console.log("🔥 Applying 10% Drip Decay...");

    try {
      const multiplier = 1 - DECAY_PERCENTAGE; // 0.9

      await Promise.all([
        User.updateMany({}, [
          { $set: { drip: { $multiply: ["$drip", multiplier] } } }
        ]),
        Post.updateMany({}, [
          { $set: { drip: { $multiply: ["$drip", multiplier] } } }
        ]),
        Product.updateMany({}, [
          { $set: { drip: { $multiply: ["$drip", multiplier] } } }
        ])
      ]);

      console.log("✅ Drip decay applied successfully");
    } catch (error) {
      console.error("❌ Drip decay failed:", error);
    }
  });
};
