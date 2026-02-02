import express from "express";
import { verifyToken } from "../middleweres/auth.js";
import {  getAchievementsByPeriod, getAchievementsByTypes, getAllAchievements, getLeaderboard, getPendingAchievements, voteAgainstAchievement } from "../controller/achivement.js";


const router = express.Router();

// ==============================
// Jury / Dev Routes
// ==============================
router.get("/pending", verifyToken, getPendingAchievements);       // Get pending achievements
router.post("/voteAgainst", verifyToken, voteAgainstAchievement);  // Jury/dev vote to cancel
// 🎯 New routes
router.get("/period", getAchievementsByPeriod);
// ==============================
// Feed / Public Routes
// ==============================
router.get("/leaderboard", getLeaderboard);
router.get("/types", getAchievementsByTypes);;// e.g. design_of_the_day, photography_of_the_week
router.get("/all", getAllAchievements);          // Returns all current achievements for feed

export default router;