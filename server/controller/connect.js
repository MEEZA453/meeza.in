import { stripe } from "../lib/stripe.js";
import User from "../models/user.js";
import Razorpay from "razorpay";
/**
 * Create Stripe Express Account + Onboarding Link
 */
export const createStripeConnectAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Create account if not exists
    if (!user.stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        capabilities: {
          transfers: { requested: true },
        },
        business_type: "individual",
        metadata: { userId },
      });

      user.stripeAccountId = account.id;
      await user.save();
    }

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: user.stripeAccountId,
      refresh_url: process.env.STRIPE_CONNECT_REFRESH_URL,
      return_url: process.env.STRIPE_CONNECT_RETURN_URL,
      type: "account_onboarding",
    });

    return res.json({
      success: true,
      url: accountLink.url,
    });
  } catch (err) {
    console.error("Stripe connect error:", err);
    return res.status(500).json({ success: false, message: "Stripe connect failed" });
  }
};
export const stripeConnectReturn = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user?.stripeAccountId) {
      return res.status(400).json({ success: false, message: "No Stripe account" });
    }

    const account = await stripe.accounts.retrieve(user.stripeAccountId);

    const onboarded =
      account.charges_enabled === true &&
      account.payouts_enabled === true;

    user.stripeOnboarded = onboarded;
    await user.save();

    return res.json({
      success: true,
      stripeOnboarded: onboarded,
    });
  } catch (err) {
    console.error("Stripe return error:", err);
    return res.status(500).json({ success: false, message: "Failed to verify Stripe onboarding" });
  }
};
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createRazorpayAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, contact, bank } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false });

    // Create fund account
    const fundAccount = await razorpay.fundAccount.create({
      account_type: "bank_account",
      contact: {
        name,
        email,
        contact,
        type: "vendor",
      },
      bank_account: {
        name,
        ifsc: bank.ifsc,
        account_number: bank.accountNumber,
      },
    });

    user.razorpayAccountId = fundAccount.id;
    user.razorpayOnboarded = true;
    await user.save();

    return res.json({ success: true });
  } catch (err) {
    console.error("Razorpay connect error:", err);
    return res.status(500).json({ success: false, message: "Razorpay connect failed" });
  }
};