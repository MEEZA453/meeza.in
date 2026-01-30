import Razorpay from "razorpay";
import crypto from "crypto";
import Subscription from "../models/subscription.js";
import User from "../models/user.js"; // your user model
import Payment from "../models/payment.js"; // optional: your payment model if used
import { stripe } from "../lib/stripe.js";

function computeEndDate(startDate, plan) {
  const start = new Date(startDate);
  if (plan === "monthly") {
    const d = new Date(start);
    d.setMonth(d.getMonth() + 1);
    return d;
  } else {
    const d = new Date(start);
    d.setMonth(d.getMonth() + 12);
    return d;
  }
}
function chooseGateway(currency) {
  // INR → Razorpay
  if (currency === "INR") return "razorpay";

  // Everything else → Stripe
  return "stripe";
}
export const createSubscriptionOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { plan, gateway: requestedGateway } = req.body;

    if (!["monthly", "yearly"].includes(plan)) {
      return res.status(400).json({ success: false, message: "Invalid plan" });
    }

    // Base prices in USD
    const pricesUSD = { monthly: 5, yearly: 48 };
    const amountUSD = pricesUSD[plan];

    // Decide gateway
    const gateway = requestedGateway || "stripe";

    const startDate = new Date();
    const endDate = computeEndDate(startDate, plan);

    let amount;
    let currency;

    // 🔁 Currency handling
    if (gateway === "razorpay") {
      const USD_TO_INR = 83; // keep configurable
      amount = Math.round(amountUSD * USD_TO_INR);
      currency = "INR";
    } else {
      amount = amountUSD;
      currency = "USD";
    }

    const subscription = await Subscription.create({
      user: userId,
      plan,
      amount,
      currency,
      startDate,
      endDate,
      gateway,
      status: "PENDING",
    });

    // 🟦 Stripe flow
    if (gateway === "stripe") {
      return res.json({
        success: true,
        gateway: "stripe",
        subscriptionId: subscription._id,
        amount,
        currency,
      });
    }

    // 🟩 Razorpay flow
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: amount * 100, // paise
      currency: "INR",
      receipt: `sub_${subscription._id}`,
    });

    subscription.razorpayOrderId = order.id;
    await subscription.save();

    return res.json({
      success: true,
      gateway: "razorpay",
      orderId: order.id,
      key: process.env.RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: "INR",
      subscriptionId: subscription._id,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Order creation failed" });
  }
};


export const createStripePaymentIntent = async (req, res) => {
  try {
    const { subscriptionId } = req.body;
console.log("createStripePaymentIntent called with subscriptionId:", subscriptionId);
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ success: false, message: "Subscription not found" });
    }
console.log("Creating Stripe PaymentIntent for subscription:", subscriptionId);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(subscription.amount * 100),
      currency: subscription.currency.toLowerCase(),
      metadata: {
        subscriptionId: subscription._id.toString(),
        userId: subscription.user.toString(),
      },
      automatic_payment_methods: { enabled: true },
    });

    subscription.stripePaymentIntentId = paymentIntent.id;
    await subscription.save();

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
console.log("Stripe PaymentIntent created:", paymentIntent.id);
  } catch (err) {
    console.error("createStripePaymentIntent error", err);
    res.status(500).json({ success: false, message: "Failed to create PaymentIntent" });
  }
};

export const verifySubscriptionPayment = async (req, res) => {
  console.log("verifySubscriptionPayment:", req.body);

  try {
    // =========================
    // 🟢 STRIPE (PaymentIntent)
    // =========================
    if (req.body.paymentIntentId) {
      const { paymentIntentId } = req.body;

      const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (intent.status !== "succeeded") {
        return res
          .status(400)
          .json({ success: false, message: "Stripe payment not successful" });
      }

      const subscriptionId = intent.metadata.subscriptionId;

      const subscription = await Subscription.findById(subscriptionId).populate("user");
      if (!subscription) {
        return res
          .status(404)
          .json({ success: false, message: "Subscription not found" });
      }

      subscription.status = "ACTIVE";
      subscription.stripePaymentIntentId = intent.id;

      await subscription.save();

      await User.findByIdAndUpdate(subscription.user._id, {
        premium: true,
        premiumExpiresAt: subscription.endDate,
        upcomingSubscription: null,
      });
console.log("Stripe subscription activated for subscription:", subscription);
      return res.json({
        success: true,
        message: "Stripe subscription activated",
        subscription,
      });
    }

    // =========================
    // 🟢 RAZORPAY (UNCHANGED)
    // =========================
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      subscriptionId,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !subscriptionId
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing verification data" });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }

    const subscription = await Subscription.findById(subscriptionId).populate("user");
    if (!subscription) {
      return res
        .status(404)
        .json({ success: false, message: "Subscription not found" });
    }

    subscription.razorpayPaymentId = razorpay_payment_id;
    subscription.razorpaySignature = razorpay_signature;
    subscription.status = "ACTIVE";

    await subscription.save();

    await User.findByIdAndUpdate(subscription.user._id, {
      premium: true,
      premiumExpiresAt: subscription.endDate,
      upcomingSubscription: null,
    });
console.log("Razorpay subscription verified for subscription:", subscription);
    return res.json({
      success: true,
      message: "Razorpay subscription verified",
      subscription,
    });
  } catch (err) {
    console.error("verifySubscriptionPayment error", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to verify subscription payment" });
  }
};



export const getSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    // find most recent ACTIVE that contains now
    const now = new Date();
    const current = await Subscription.findOne({
      user: userId,
      startDate: { $lte: now },
      endDate: { $gt: now },
      status: "ACTIVE"
    }).sort({ endDate: -1 });

    // find nearest upcoming subscription (SCHEDULED or PENDING) starting after now
    const upcoming = await Subscription.findOne({
      user: userId,
      startDate: { $gt: now },
      status: { $in: ["SCHEDULED", "PENDING"] }
    }).sort({ startDate: 1 });

    const premium = !!current;
    let planRunningOut = false;
    let currentPlan = null;
    let upcomingPlan = null;

    if (current) {
      const msLeft = current.endDate.getTime() - now.getTime();
      const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
      // planRunningOut true when <= 3 days left
      planRunningOut = daysLeft <= 3;
      currentPlan = {
        id: current._id,
        plan: current.plan,
        startDate: current.startDate,
        endDate: current.endDate,
        amount: current.amount,
        currency: current.currency,
      };
    }

    if (upcoming) {
      upcomingPlan = {
        id: upcoming._id,
        plan: upcoming.plan,
        startDate: upcoming.startDate,
        endDate: upcoming.endDate,
        amount: upcoming.amount,
        currency: upcoming.currency,
        status: upcoming.status
      };
    }

    res.json({ success: true, premium, planRunningOut, currentPlan, upcomingPlan });
  } catch (err) {
    console.error("getSubscriptionStatus error", err);
    res.status(500).json({ success: false, message: "Failed to get subscription status" });
  }
};
