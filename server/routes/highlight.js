import express from "express";
import {
  requestHighlight,
  verifyHighlightPayment,
  approveHighlightRequest,
  getAllHighlights,
  getHighlightRequestsForDev,
  createPaymentForHighlight,
  addToHighlight,
  removeFromHighlight
} from "../controller/highlight.js";
import { verifyToken, verifyIsUser,verifyIsDev } from "../middleweres/auth.js";

const router = express.Router();
router.post('/add', verifyToken, addToHighlight);
router.post('/remove', verifyToken, removeFromHighlight);
router.post("/request", verifyToken, requestHighlight);
router.post("/approve", verifyToken,
     verifyIsDev,
      approveHighlightRequest);
router.post("/create-payment", verifyToken, createPaymentForHighlight); // NEW — called by requester after dev approved
router.post("/verify", verifyToken, verifyHighlightPayment);
router.get("/getHighlight", verifyIsUser, getAllHighlights);
router.get("/requests", verifyToken, getHighlightRequestsForDev);


export default router;
