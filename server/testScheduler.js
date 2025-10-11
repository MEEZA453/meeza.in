// testScheduler.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Post from "./models/post.js";
import User from "./models/user.js";
import Notification from "./models/notification.js";
import { calculateAverageScore } from "./utils/caltulateAvgScore.js";
import { generatePendingAchievements } from "./corn/achievementScheduler"; // make sure to export function

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/test";

mongoose.connect(MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

async function testScheduler() {
  console.log("🏁 Testing achievement scheduler...");

  // You can test for day, week, or month
  await generatePendingAchievements("day", 1, 1);  // Lower thresholds for testing
  await generatePendingAchievements("week", 1, 1);
  await generatePendingAchievements("month", 1, 1);

  const posts = await Post.find().populate("createdBy");
  console.log("All posts after scheduler:", posts);

  const notifications = await Notification.find();
  console.log("All notifications:", notifications);

  mongoose.disconnect();
}

testScheduler();
