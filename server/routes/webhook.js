import express from "express";
import crypto from "crypto";
import Stripe from "stripe";
import Subscription from "../models/subscription.js";
import User from "../models/user.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/* ===========================
   🔴 RAZORPAY WEBHOOK
=========================== */
router.post(
  "/razorpay",
  express.raw({ type: "*/*" }),
  async (req, res) => {
    try {
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
      const signature = req.headers["x-razorpay-signature"];

      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(req.body)
        .digest("hex");

      if (expectedSignature !== signature) {
        return res.status(400).send("Invalid signature");
      }

      const payload = JSON.parse(req.body.toString());

      if (payload.event === "payment.captured") {
        const payment = payload.payload.payment.entity;
        const orderId = payment.order_id;

        const subscription = await Subscription.findOne({
          razorpayOrderId: orderId,
        });

        if (!subscription) return res.sendStatus(200);

        subscription.razorpayPaymentId = payment.id;

        if (subscription.startDate <= new Date()) {
          subscription.status = "ACTIVE";
          await User.findByIdAndUpdate(subscription.user, {
            premium: true,
            premiumExpiresAt: subscription.endDate,
            upcomingSubscription: null,
          });
        } else {
          subscription.status = "SCHEDULED";
          await User.findByIdAndUpdate(subscription.user, {
            upcomingSubscription: subscription._id,
          });
        }

        await subscription.save();
      }

      res.sendStatus(200);
    } catch (err) {
      console.error("Razorpay webhook error:", err);
      res.status(500).send("Webhook error");
    }
  }
);

/* ===========================
   🔵 STRIPE WEBHOOK
=========================== */
router.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Stripe signature failed:", err.message);
      return res.status(400).send("Webhook Error");
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const subscriptionId = session.metadata.subscriptionId;

      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) return res.sendStatus(200);

      subscription.status = "ACTIVE";
      subscription.stripePaymentIntentId = session.payment_intent;
      await subscription.save();

      await User.findByIdAndUpdate(subscription.user, {
        premium: true,
        premiumExpiresAt: subscription.endDate,
        upcomingSubscription: null,
      });
    }

    res.json({ received: true });
  }
);

export default router;
  