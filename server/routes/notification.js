import express from "express";
import {
  getNotifications,
  markAllAsRead,
  markOneAsRead,
  deleteNotification,
  getUnreadNotifications,
} from "../controller/notification.js";
import { verifyToken } from "../middleweres/auth.js";

const router = express.Router();


router.get("/", verifyToken , getNotifications);
router.get("/unread", verifyToken, getUnreadNotifications);
router.put("/read", verifyToken, markAllAsRead);

router.put("/read/:id", verifyToken, markOneAsRead);


router.delete("/:id", verifyToken, deleteNotification);

export default router;
