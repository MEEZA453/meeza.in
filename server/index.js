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
import searchRoute from './routes/search.js'
import { generatePendingAchievements } from './corn/achievementScheduler.js';
import { finalizePendingAchievements } from './corn/achievementFinalizer.js';
import mongoose from 'mongoose';
import webhookRoutes from "./routes/webhook.js";
import subscriptionRoutes from "./routes/subscribtion.js";
import Product from './models/designs.js';
import { startSubscriptionCron } from './corn/subscribtion.js';
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

// Serve images statically from 'uploads' folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // Store in 'uploads' folder
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname); // Unique file names
    }
});

const upload = multer({ storage });

// Image Upload Route
app.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ imageUrl: `/uploads/${req.file.filename}` }); // Send back image path
});

// Routes
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

app.use('/orders', orderPaymentRoutes)
app.use('/order' , orderRouter )

app.use('/cart' , cartRoute)

// Connect to DB and start server
connectDB();
async function testAchievements() {
  console.log("🏁 Testing achievement generation...");
// await generatePendingAchievements("day", 1, 1); // for quick test
// await finalizePendingAchievements();
 await generatePendingAchievements("month", 0, 0); // for quick test
 await finalizePendingAchievements();
 await generatePendingAchievements("week", 0, 0); // for quick test
 await finalizePendingAchievements();
 await generatePendingAchievements("day", 0, 0); // for quick test
 await finalizePendingAchievements();
  console.log("✅ Achievement test completed");
}
// testAchievements();

startSubscriptionCron();
server.listen(PORT, () => {
  console.log(`🚀 Server running with Socket.IO on port ${PORT}`);
});
