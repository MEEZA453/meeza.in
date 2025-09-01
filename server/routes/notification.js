import express from "express";
import {
  getNotifications,
  markAllAsRead,
  markOneAsRead,
  deleteNotification,
} from "../controller/notification.js";
import { verifyToken } from "../middleweres/auth.js";

const router = express.Router();


router.get("/", verifyToken , getNotifications);

router.put("/read", verifyToken, markAllAsRead);

router.put("/read/:id", verifyToken, markOneAsRead);


router.delete("/:id", verifyToken, deleteNotification);

export default router;
