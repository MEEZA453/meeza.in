// routes/payoutRoutes.js
import express from "express";
import { createPayoutRequest, getPayoutRequests, processPayout } from "../controller/payout.js";
import { verifyIsUser, verifyToken } from "../middleweres/auth.js";
// import { verifyAdmin } from "../middleweres/admin.js"; // optional admin middleware

const router = express.Router();

router.post("/request", verifyToken, createPayoutRequest); // user requests withdraw
router.post("/process", verifyToken, processPayout); // admin or worker processes payout
router.get(
  "/admin",
  verifyToken,   // IMPORTANT
  getPayoutRequests
);
export default router;
