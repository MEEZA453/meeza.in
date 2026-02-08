// controller/highlightController.js
import Post from "../models/post.js";
import HighlightRequest from "../models/highlightRequest.js";
import Notification from "../models/notification.js";
import User from "../models/user.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import { stripe } from "../lib/stripe.js";
import mongoose from "mongoose";
import {attachIsAppreciated} from '../utils/attactIsAppreciated.js'
const HIGHLIGHT_MAX_ACTIVE = 20;
export const addToHighlight = async (req, res) => {
  try {
    const userId = req.user.id;
    const { designId } = req.body;

    const post = await Post.findById(designId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Check if user already highlighted
    const already = post.highlightedBy.some(
      h => h.user.toString() === userId
    );

    if (!already) {
      post.highlightedBy.push({
        user: userId,
        highlightedAt: new Date()
      });
      post.isHighlighted = true;
    }

    await post.save();

    return res.status(200).json({ success: true, message: "Post highlighted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

// -----------------------------------------
// REMOVE HIGHLIGHT
// -----------------------------------------
export const removeFromHighlight = async (req, res) => {
  try {
    const userId = req.user.id;
    const { designId } = req.body;

    const post = await Post.findById(designId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.highlightedBy = post.highlightedBy.filter(
      h => h.user.toString() !== userId
    );

    post.isHighlighted = post.highlightedBy.length > 0;

    await post.save();

    return res.status(200).json({ success: true, message: "Highlight removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// helper: get latest highlight end
async function getLatestHighlightEnd() {
  const latest = await Post.findOne({ highlightedUntil: { $ne: null } })
    .sort({ highlightedUntil: -1 })
    .select("highlightedUntil")
    .lean();
  return latest?.highlightedUntil || null;
}

/**
 * scheduleOrActivateHighlight(reqDoc, approverId)
 * - computes startsAt & expiresAt
 * - if startsAt <= now → activate post immediately
 * - otherwise leave it scheduled (APPROVED) so the queue processor will start it when due
 */
async function scheduleOrActivateHighlight(reqDoc, approverId) {
  const now = new Date();
  const activeCount = await Post.countDocuments({ highlightedUntil: { $gt: now } });

  // determine startsAt: now if < max, else after latest end
  let startsAt = now;
  if (activeCount >= HIGHLIGHT_MAX_ACTIVE) {
    const latestEnd = await getLatestHighlightEnd() || now;
    startsAt = new Date(latestEnd);
  }

  const expiresAt = new Date(startsAt.getTime() + reqDoc.durationHours * 60 * 60 * 1000);

  // set schedule fields on request
  reqDoc.startsAt = startsAt;
  reqDoc.expiresAt = expiresAt;
  reqDoc.approvedAt = new Date();
  reqDoc.approvedBy = approverId;
  reqDoc.status = "APPROVED";
  await reqDoc.save();

  if (startsAt <= now) {
    // activate now
    const post = await Post.findById(reqDoc.post);
    if (!post) return { ok: false, message: "Post not found while activating" };

    post.isHighlighted = true;
    post.highlightedBy.push({ user: reqDoc.requester, highlightedAt: new Date() });
    post.highlightedUntil = expiresAt;
    post.lastHighlightedAt = new Date();
    await post.save();

    // notify requester
    await Notification.create({
      recipient: reqDoc.requester,
      sender: approverId,
      type: "highlight_started",
      message: `Your post has been highlighted and will expire at ${expiresAt.toISOString()}`,
      meta: { postId: post._id, highlightRequestId: reqDoc._id, expiresAt }
    });

    return { ok: true, activated: true, startsAt, expiresAt };
  } else {
    // queued
    const pendingCount = await HighlightRequest.countDocuments({ status: "APPROVED", startsAt: { $gt: now } });
    reqDoc.position = pendingCount + 1;
    await reqDoc.save();

    await Notification.create({
      recipient: reqDoc.requester,
      sender: approverId,
      type: "highlight_scheduled",
      message: `Your highlight request is approved and scheduled to start at ${startsAt.toISOString()}. Position: ${reqDoc.position}`,
      meta: { postId: reqDoc.post, highlightRequestId: reqDoc._id, startsAt, expiresAt }
    });

    return { ok: true, activated: false, startsAt, expiresAt, position: reqDoc.position };
  }
}

// 1) create request (user)
export const requestHighlight = async (req, res) => {
  try {
    const userId = req.user.id;
const { postId, durationHours = 24, priceUSD = 0 } = req.body;
console.log('sending request', postId, durationHours, priceUSD)
    if (!mongoose.Types.ObjectId.isValid(postId)) return res.status(400).json({ success: false, message: "Invalid post" });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    // Always create as PENDING_APPROVAL — paid requests require dev approval first
const reqDoc = await HighlightRequest.create({
  post: post._id,
  requester: userId,
  durationHours,
  priceUSD,
  currency: "USD",
  status: "PENDING_APPROVAL"
});
    // notify devs
const devs = await User.find({ role: "dev" })
  .select("_id")
  .lean();

for (const d of devs) {
  await Notification.create({
    recipient: d._id,
    sender: userId,                // 👈 sender stays canonical
    type: "highlight_request",
    post: post._id,

    message: `requested to highlight a post for ${durationHours} hour(s).`,

    meta: {
      postId: post._id,
postImage:
  post.media?.find(m => m.type === "image")?.url ||
  post.media?.find(m => m.type === "video")?.cover ||
  null
,


      extra: {
        highlightRequestId: reqDoc._id,
        durationHours,
        priceUSD,
      },
    },
  });
}
console.log('request successfully send')
    return res.json({ success: true, message: "Request created and sent to devs for approval", highlightRequest: reqDoc });
  } catch (err) {
    console.error("requestHighlight error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 2) dev approval (dev)
export const approveHighlightRequest = async (req, res) => {
  try {
    const devId = req.user.id;
    const { highlightRequestId, approve = true } = req.body;
    
    console.log('reached to approve highlight request')
    const reqDoc = await HighlightRequest.findById(highlightRequestId).populate("post requester").exec();
        const post = await Post.findById(reqDoc.post._id);
    if (!reqDoc) return res.status(404).json({ success: false, message: "Request not found" });

    if (!approve) {
      reqDoc.status = "REJECTED";
      reqDoc.approvedAt = new Date();
      reqDoc.approvedBy = devId;
      await reqDoc.save();

      await Notification.create({
        recipient: reqDoc.requester._id,
        sender: devId,
        type: "highlight_rejected",
        message: `Your highlight request for post ${reqDoc.post._id} was rejected.`,
        meta: { highlightRequestId: reqDoc._id, postId: reqDoc.post._id }
      });
console.log('highlight rejected')
      return res.json({ success: true, message: "Request rejected" });
    }

    // APPROVE path
    if (reqDoc.priceUSD > 0) {
      // Paid → do NOT schedule yet. Move to AWAITING_PAYMENT and notify requester to pay (dev has approved)
      reqDoc.status = "AWAITING_PAYMENT";
      reqDoc.approvedAt = new Date();
      reqDoc.approvedBy = devId;
      await reqDoc.save();

      // send notification to requester to create payment (frontend will call createPaymentForHighlight)
  await Notification.create({
  recipient: reqDoc.requester._id,
  sender: devId,
  type: "highlight_approved_awaiting_payment",
  post: reqDoc.post._id,

  message: `Highlight request has been approved. Please pay $${reqDoc.priceUSD} to confirm.`,

  meta: {
    postId: reqDoc.post._id,
postImage:
  post.media?.find(m => m.type === "image")?.url ||
  post.media?.find(m => m.type === "video")?.cover ||
  null
,

    extra: {
      highlightRequestId: reqDoc._id,
      amount: reqDoc.priceUSD,
    },
  },
});
console.log('highight approved')
      return res.json({ success: true, message: "Request approved — awaiting payment from requester", highlightRequest: reqDoc });
    } else {
      // Free request → schedule/activate immediately
      const result = await scheduleOrActivateHighlight(reqDoc, devId);
      console.log('highlighted', result)
      return res.json({ success: true, message: "Free request approved and scheduled", scheduleResult: result, highlightRequest: reqDoc });
    }

  } catch (err) {
    console.error("approveHighlightRequest error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 3) CREATE PAYMENT (called by frontend AFTER dev approved and status = AWAITING_PAYMENT)
export const createPaymentForHighlight = async (req, res) => {
  try {
    const userId = req.user.id;
   const { highlightRequestId, gateway,  } = req.body;
   console.log('creating payment for highlight', highlightRequestId, gateway,'user id ', userId)
    const reqDoc = await HighlightRequest.findById(highlightRequestId).populate("post requester").exec();
    if (!gateway || !['stripe', 'razorpay'].includes(gateway)) {
  return res.status(400).json({
    success: false,
    message: "Payment gateway is required"
  });
}
console.log('requestdoc', reqDoc.status)
    if (!reqDoc) return res.status(404).json({ success: false, message: "Highlight request not found" });
    if (reqDoc.requester._id.toString() !== userId.toString()) return res.status(403).json({ success: false, message: "Not request owner" });

 if (
  reqDoc.status !== "PENDING_PAYMENT" &&
  reqDoc.status !== "AWAITING_PAYMENT"
) {
  return res.status(400).json({
    success: false,
    message: "Request not awaiting payment"
  });
}


    // Create payment intent/order depending on gateway
    if (gateway === "stripe") {
      const amountCents = Math.round(reqDoc.priceUSD * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: "usd",
        metadata: { highlightRequestId: reqDoc._id.toString(), userId: userId.toString(), postId: reqDoc.post._id.toString() },
        automatic_payment_methods: { enabled: true }
      });

      reqDoc.stripePaymentIntentId = paymentIntent.id;
      reqDoc.status = "PENDING_PAYMENT";
      await reqDoc.save();
console.log('done stripe part')
      return res.json({ success: true, gateway: "stripe", clientSecret: paymentIntent.client_secret, highlightRequestId: reqDoc._id,  amount: reqDoc.priceUSD,      // 👈 REQUIRED
  currency: "USD",      });
    }

    if (gateway === "razorpay") {
      const razor = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
      const INR_RATE = process.env.USD_TO_INR ? Number(process.env.USD_TO_INR) : 83;
      const amountINRpaise = Math.round(reqDoc.priceUSD * INR_RATE * 100);
      const order = await razor.orders.create({ amount: amountINRpaise, currency: "INR", receipt: `hlr_${reqDoc._id}` });

      reqDoc.razorpayOrderId = order.id;
      reqDoc.status = "PENDING_PAYMENT";
      await reqDoc.save();
console.log('payment created successfully ')
      return res.json({ success: true, gateway: "razorpay", orderId: order.id, key: process.env.RAZORPAY_KEY_ID, amount: order.amount, currency: order.currency, highlightRequestId: reqDoc._id });
    }
console.log('done craaaate')
    return res.status(400).json({ success: false, message: "Unsupported gateway" });

  } catch (err) {
    console.error("createPaymentForHighlight error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 4) Verify payment (stripe or razorpay) — AFTER payment completed on client
export const verifyHighlightPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { highlightRequestId, paymentIntentId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
console.log('verifying payment')
    const reqDoc = await HighlightRequest.findById(highlightRequestId).populate("post requester").exec();
    if (!reqDoc) return res.status(404).json({ success: false, message: "Request not found" });

    // confirm ownership
    if (reqDoc.requester._id.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Only requester can verify payment" });
    }

    // STRIPE verification
    if (paymentIntentId) {
      const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (!intent || intent.status !== "succeeded") {
        return res.status(400).json({ success: false, message: "Stripe payment not successful" });
      }
      // mark paid
      reqDoc.stripePaymentIntentId = paymentIntentId;
      reqDoc.status = "PAID";
      await reqDoc.save();
    } else {
      // RAZORPAY verification
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ success: false, message: "Missing razorpay verification data" });
      }

      const gen = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(razorpay_order_id + "|" + razorpay_payment_id).digest("hex");
      if (gen !== razorpay_signature) {
        return res.status(400).json({ success: false, message: "Invalid signature" });
      }

      reqDoc.razorpayPaymentId = razorpay_payment_id;
      reqDoc.status = "PAID";
      await reqDoc.save();
    }

    // After payment is verified -> schedule/activate immediately (no more dev approval)
    const schedulingResult = await scheduleOrActivateHighlight(reqDoc, req.user.id /* mark as approvedBy = requester? or null */);

    // notify devs and requester (scheduleOrActivate already notifies requester)
    await Notification.create({
      recipient: reqDoc.requester._id,
      sender: req.user.id,
      type: "highlight_payment_confirmed",
      message: `Payment received for highlight request ${reqDoc._id}. ${schedulingResult.activated ? "Activated" : "Scheduled"}.`,
      meta: { highlightRequestId: reqDoc._id, scheduleResult: schedulingResult }
    });
console.log('payment veriried and highlighed')
    return res.json({ success: true, message: "Payment verified and highlight scheduled/started", scheduleResult: schedulingResult, highlightRequest: reqDoc });
  } catch (err) {
    console.error("verifyHighlightPayment error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
export const getAllHighlights = async (req, res) => {
  try {
    const { category } = req.query;
    const now = new Date();

    const categoryFilter = category ? { category: { $in: category.split(",") } } : {};

    const posts = await Post.find({
      isHighlighted: true,
      highlightedUntil: { $gt: now },
      ...categoryFilter
    })
      .sort({ highlightedUntil: -1 }) // show soonest-to-expire or newest highlighted
      .populate("createdBy", "name profile handle passion")
      .select("-__v")
      .lean();

    // attach isAppreciated, etc — reuse your util
    const postsWithFlag = await attachIsAppreciated(posts, req.user?.id || null, "Post");

    return res.json({ success: true, highlights: postsWithFlag });
  } catch (err) {
    console.error("getAllHighlights error", err);
    res.status(500).json({ success:false, message: err.message });
  }
};

// Dev endpoint to list pending requests
export const getHighlightRequestsForDev = async (req, res) => {
  try {
    const requests = await HighlightRequest.find({ status: { $in: ["PENDING_APPROVAL", "PAID", "PENDING_PAYMENT"] } })
      .sort({ createdAt: 1 })
      .populate("post requester")
      .lean();
    res.json({ success: true, requests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success:false, message: err.message });
  }
};