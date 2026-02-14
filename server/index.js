import express from 'express';
import { env } from './config/dotenv.js';
import connectDB from './config/db.js';
import cors from 'cors';
import { Server as IOServer } from 'socket.io';
import http from 'http';
import path from 'path';
import multer from 'multer';
import designRoute from './routes/postDesign.js';
import highlightDesignRoute from './routes/postHighlightDesign.js';
import orderPaymentRoutes from './routes/orderPayment.js';
import cartRoute from './routes/cart.js'
import userRoute from './routes/user.js'
import postRoute from './routes/post.js'
import favRoute from './routes/favourait.js'
import highlightRoute from './routes/highlight.js'
import promotionRoute from './routes/promotion.js'
import orderRouter from './routes/order.js'
import hotListRouter from './routes/hotlist.js'
import notificationRoute from './routes/notification.js'
import achivementRoute from './routes/achivement.js'
import folderRoute from './routes/folder.js'
import payoutRoutes from "./routes/payout.js";
import connectRoute from "./routes/connect.js";
import searchRoute from './routes/search.js'
import { generatePendingAchievements } from './corn/achievementScheduler.js';
import { finalizePendingAchievements } from './corn/achievementFinalizer.js';
import mongoose from 'mongoose';
import webhookRoutes from "./routes/webhook.js";
import subscriptionRoutes from "./routes/subscribtion.js";
import Product from './models/designs.js';
import { startSubscriptionCron } from './corn/subscribtion.js';
import Post from './models/post.js';
import walletRoute from './routes/wallet.js';
import appreciationRoute from './routes/appreciation.js'
import cron from "node-cron";
import { processHighlightQueue } from './corn/highlightQueueProcessor.js';
import couponRoute from './routes/coupon.js'
import assetsRouter from "./routes/asset.js";
// Define the server port
const PORT = env.PORT || 8080;
const app = express();
const __dirname = path.resolve(); // Fix for ES module
const server = http.createServer(app);

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
const io = new IOServer(server, {
  cors: {
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
    methods: ["GET","POST"]
  }
});

// attach to app so controllers can access it via req.app.get('io')
app.set('io', io);



app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ limit: "500mb", extended: true }));
server.setTimeout(10 * 60 * 1000); // 10 minutes
app.use('/', designRoute);
app.use('/post',postRoute)
app.use("/user", userRoute);
app.use('/fav', favRoute);
app.use('/highlight', highlightRoute)
app.use('/notification', notificationRoute)
app.use('/achievement', achivementRoute)
app.use('/folder', folderRoute)
app.use('/search', searchRoute)
app.use("/webhooks", webhookRoutes);
app.use("/subscriptions", subscriptionRoutes);
app.use('/promotion', promotionRoute);
app.use('/hotlist', hotListRouter);
app.use('/connect', connectRoute)
app.use('/orders', orderPaymentRoutes)
app.use('/order' , orderRouter )
app.use("/appreciations", appreciationRoute);
app.use("/payouts", payoutRoutes);
app.use('/cart' , cartRoute)
app.use('/wallet', walletRoute)
app.use('/coupon', couponRoute)
app.use("/assets", assetsRouter);


// Connect to DB and start server
connectDB();
// async function migrateImagesToMedia() {
//   try {
//     const posts = await Post.find({}).lean(); // raw objects
//     console.log(`Found ${posts.length} posts to check`);

//     for (const rawPost of posts) {
//       if (Array.isArray(rawPost.images) && rawPost.images.length > 0) {
//         // Convert images to media format
//         const media = rawPost.images.map(img => {
//           if (typeof img === "string") return { url: img, type: "image" };
//           return img;
//         });

//         // Directly update in DB
//         await Post.updateOne(
//           { _id: rawPost._id },
//           { $set: { media }, $unset: { images: "" } }
//         );

//         console.log(`Migrated post ${rawPost._id}`);
//       } else {
//         console.log(`Skipping post ${rawPost._id} (no images array)`);
//       }
//     }

//     console.log("Migration complete!");
//     process.exit(0);
//   } catch (err) {
//     console.error(err);
//     process.exit(1);
//   }
// }

// migrateImagesToMedia();
async function testAchievements() {
  console.log("🏁 Testing achievement generation...");
// await generatePendingAchievements("day", 1, 1); // for quick test
// await finalizePendingAchievements();
//  await generatePendingAchievements("month", 0, 0); // for quick test
 await finalizePendingAchievements();
//  await generatePendingAchievements("week", 0, 0); // for quick test
 await finalizePendingAchievements();
//  await generatePendingAchievements("day", 0, 0); // for quick test
 await finalizePendingAchievements();
  console.log("✅ Achievement test completed");
}
// testAchievements();
cron.schedule("*/5 * * * *", async () => {
  await processHighlightQueue();
});

startSubscriptionCron();
server.listen(PORT, () => {
  console.log(`🚀 Server running with Socket.IO on port ${PORT}`);
});
