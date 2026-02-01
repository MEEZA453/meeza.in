// controller/payoutController.js
import mongoose from "mongoose";
import PayoutRequest from "../models/payout.js";
import WalletTransaction from "../models/wallet.js";
import User from "../models/user.js";
import Notification from "../models/notification.js";
import { stripe } from "../lib/stripe.js";
import Razorpay from "razorpay";

const USD_TO_INR = process.env.USD_TO_INR ? Number(process.env.USD_TO_INR) : 83;

export const createPayoutRequest = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user.id;
    const { amount, gateway } = req.body; // amount expected in USD (normalized)

    if (!amount || amount <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    const user = await User.findById(userId).session(session);
    if (!user) throw new Error("User not found");

    if ((user.balance || 0) < amount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Insufficient balance" });
    }
if (gateway === "stripe" && !user.stripeOnboarded) {
  return res.status(400).json({ message: "Stripe account not onboarded" });
}

if (gateway === "razorpay" && !user.razorpayOnboarded) {
  return res.status(400).json({ message: "Razorpay account not onboarded" });
}
    // Check connected account
    let destinationAccountId = null;
    if (gateway === "stripe") destinationAccountId = user.stripeAccountId;
    if (gateway === "razorpay") destinationAccountId = user.razorpayAccountId;

    if (!destinationAccountId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "User not connected to payout gateway" });
    }

    // Create PayoutRequest
    const payoutRequest = await PayoutRequest.create([{
      user: userId,
      amount,
      currency: "USD",
      gateway,
      destinationAccountId,
      status: "PENDING",
    }], { session });

    // Lock funds: create DEBIT transaction with PENDING status and decrement balance
    const newBalance = (user.balance || 0) - amount;

    await WalletTransaction.create([{
      user: userId,
      type: "DEBIT",
      amount,
      currency: "USD",
      reference: payoutRequest[0]._id.toString(),
      status: "PENDING",
      balanceAfter: newBalance,
      gateway,
    }], { session });

    // decrement balance immediately (prevent double spend)
    await User.findByIdAndUpdate(userId, { $inc: { balance: -amount } }, { session });

    await session.commitTransaction();
    session.endSession();

    // notify user that payout is queued
    await Notification.create({
      recipient: userId,
      sender: userId,
      type: "payout_requested",
      message: `Your withdrawal request of $${amount} has been queued.`,
    }).catch(() => {});

    return res.json({ success: true, message: "Payout requested", payoutRequest: payoutRequest[0] });
  } catch (err) {
    console.error("createPayoutRequest error:", err);
    try { await session.abortTransaction(); session.endSession(); } catch (e) {}
    return res.status(500).json({ success: false, message: "Failed to create payout request", error: err.message });
  }
};

/**
 * processPayout:
 * - This should be run by a background job or admin endpoint.
 * - For demo, provide as an authenticated admin route.
 */
export const processPayout = async (req, res) => {
  // Accept payoutRequestId in body
  const { payoutRequestId } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const payout = await PayoutRequest.findById(payoutRequestId).session(session);
    if (!payout) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: "PayoutRequest not found" });
    }
    if (payout.status !== "PENDING") {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Payout already processed" });
    }

    // mark processing
    payout.status = "PROCESSING";
    await payout.save({ session });

    const user = await User.findById(payout.user).session(session);

    // ----- Stripe Connect path -----
    if (payout.gateway === "stripe") {
      if (!payout.destinationAccountId) throw new Error("No stripe account id on user");
      // Convert amount to cents
      const amountCents = Math.round(payout.amount * 100);

      // If you want to transfer to connected account:
      // use Transfers with destination = connected account id
      // NOTE: Stripe account configuration (platform fees, etc.) matters.
      const transfer = await stripe.transfers.create({
        amount: amountCents,
        currency: payout.currency.toLowerCase(),
        destination: payout.destinationAccountId,
        metadata: { payoutRequestId: payout._id.toString(), userId: user._id.toString() },
      });

      payout.gatewayPayoutId = transfer.id;
      payout.status = "PAID";
      payout.meta = transfer;
      await payout.save({ session });

      // mark wallet tx success
      await WalletTransaction.findOneAndUpdate(
        { reference: payout._id.toString(), user: user._id, type: "DEBIT" },
        { status: "SUCCESS", /* optionally add gatewayPayoutId */ },
        { session }
      );
    }

    // ----- Razorpay route path -----
    if (payout.gateway === "razorpay") {
      if (!payout.destinationAccountId) throw new Error("No razorpay account id on user");
      // Create Razorpay instance
      const razor = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });

      // For Razorpay payouts, you must have beneficiary and then create payouts.
      // This is a simplified example — you must ensure beneficiary is created.
      // Convert amount to INR if necessary (if you store USD, convert)
      const amountInINR = Math.round(payout.amount * USD_TO_INR * 100); // paise
      // Example payload (your actual implementation may differ)
      const payoutPayload = {
        account_number: process.env.RAZORPAY_ACCOUNT_NUMBER,
        fund_account: {
          // usually you'd create a fund_account and use its id
        },
        amount: Math.round(payout.amount * USD_TO_INR), // in rupees
        currency: "INR",
        mode: "IMPS",
        purpose: "payout",
        queue_if_low_balance: true,
      };

      // This is placeholder — replace with your actual Razorpay payouts API usage.
      // Example using razor.payments.create or appropriate method per docs:
      // const razorpayResult = await razor.payouts.create(...);
      // For now, throw if not implemented
      throw new Error("Razorpay automatic payouts: implement per your Razorpay Route/Payouts configuration.");
    }

    await session.commitTransaction();
    session.endSession();

    // notify user
    await Notification.create({
      recipient: user._id,
      sender: user._id,
      type: "payout_completed",
      message: `Your withdrawal of $${payout.amount} has been processed.`,
    }).catch(() => {});

    return res.json({ success: true, message: "Payout processed", payout });
  } catch (err) {
    console.error("processPayout error:", err);
    // Attempt to set payout to FAILED and refund user's balance (reverse the earlier PENDING debit)
    try {
      // If we have payoutRequestId, we try to mark it failed and refund
      if (req.body.payoutRequestId) {
        const payoutId = req.body.payoutRequestId;
        await PayoutRequest.findByIdAndUpdate(payoutId, { status: "FAILED", meta: { error: err.message } });
        // Mark wallet tx failed and refund
        const tx = await WalletTransaction.findOneAndUpdate(
          { reference: payoutId, type: "DEBIT" },
          { status: "FAILED" }
        );
        if (tx) {
          await User.findByIdAndUpdate(tx.user, { $inc: { balance: tx.amount } });
        }
      }
    } catch (e) {
      console.error("Error while failing payout and refunding", e);
    }

    try { await session.abortTransaction(); session.endSession(); } catch (e) {}
    return res.status(500).json({ success: false, message: "Failed to process payout", error: err.message });
  }
};
