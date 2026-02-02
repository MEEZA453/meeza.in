// controller/orderPayment.js
import Razorpay from "razorpay";
import crypto from "crypto";
import Order from "../models/Order.js";
import Product from "../models/designs.js";
import User from "../models/user.js";
import Payment from "../models/payment.js";
import Notification from "../models/notification.js";
import nodemailer from "nodemailer";
import { stripe } from "../lib/stripe.js";
import  WalletTransaction  from "../models/wallet.js";
import mongoose from "mongoose";
const USD_TO_INR = process.env.USD_TO_INR ? Number(process.env.USD_TO_INR) : 83;

// Utility to compute normalized USD amount from whatever currency
function toUSD(amount, currency) {
  if (!currency || currency === "USD") return amount;
  if (currency === "INR") return Math.round((amount / USD_TO_INR) * 100) / 100;
  return amount;
}

// Create order and return gateway info (Razorpay order or Stripe order id placeholder)
export const createProductOrder = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { productId, gateway: requestedGateway } = req.body;
console.log("createProductOrder:", req.body, "by user:", buyerId, 'productId:', productId);
    const product = await Product.findById(productId).populate("postedBy", "_id email name");
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    const seller = product.postedBy._id;
    
    if (!seller) return res.status(400).json({ success: false, message: "Seller not found" });

    // Determine amount (use product.price if exists else sent payload)
    const priceUSD = product.amount ?? 0; // assume product.price stored in USD
    if (!priceUSD || priceUSD <= 0) return res.status(400).json({ success: false, message: "Invalid product price" });

    // Choose gateway
    let gateway = requestedGateway || chooseGatewayFromCurrency(product.currency); // fallback
    // But keep simple: if product.currency === 'INR' choose razorpay else stripe.
    if (!gateway) gateway = priceUSD && req.body.gateway ? req.body.gateway : "stripe";

    // Decide currency and amount to charge
    let currency = gateway === "razorpay" ? "INR" : "USD";
    let amount = priceUSD;
    if (currency === "INR") {
      amount = Math.round(priceUSD * USD_TO_INR); // integer INR
    }

    const order = new Order({
      buyer: buyerId,
      product: product._id,
      seller: seller._id,
      amount,
      amountUSD: priceUSD,
      currency,
      gateway,
      status: "pending",
    });

    await order.save();
console.log("Created order:", order);
    // Razorpay flow
    if (gateway === "razorpay") {
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
console.log("Creating Razorpay order for amount:", amount);
      const razorOrder = await razorpay.orders.create({
        amount: amount * 100,
        currency: "INR",
        receipt: `order_${order._id}`,
        notes: {
          productId: String(product._id),
          buyerId,
          sellerId: String(seller._id),
        },
      });
console.log("Razorpay order created:", razorOrder);
      order.razorpayOrderId = razorOrder.id;
      await order.save();

      return res.json({
        success: true,
        gateway: "razorpay",
        orderId: razorOrder.id,
        key: process.env.RAZORPAY_KEY_ID,
        amount: razorOrder.amount,
        currency: "INR",
        orderIdInternal: order._id,
      });
    }

    // Stripe flow: return order ID - front will call stripe/payment-intent endpoint to create PaymentIntent
    return res.json({
      success: true,
      gateway: "stripe",
      orderId: order._id,
      amount,
      amountUSD: priceUSD,
      currency,
    });
  } catch (err) {
    console.error("createProductOrder error:", err);
    res.status(500).json({ success: false, message: "Order creation failed" });
  }
};

// create Stripe PaymentIntent for a given product order
export const createStripePaymentIntentForOrder = async (req, res) => {

  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId).populate("buyer");
    console.log("createStripePaymentIntentForOrder:", orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // create payment intent in order.currency (should be USD here)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.amount * 100),
      currency: order.currency.toLowerCase(),
      metadata: {
        orderId: order._id.toString(),
        buyerId: order.buyer._id.toString(),
        sellerId: order.seller.toString(),
      },
      automatic_payment_methods: { enabled: true },
    });

    order.stripePaymentIntentId = paymentIntent.id;
    await order.save();
console.log("Created Stripe PaymentIntent:", paymentIntent.id);
    return res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err) {
    console.error("createStripePaymentIntentForOrder error", err);
    res.status(500).json({ success: false, message: "Failed to create PaymentIntent" });
  }
};

// Verify payment (Stripe PaymentIntent or Razorpay signature)
// controller/orderPayment.js (only the verifyProductPayment function replaced)

export const verifyProductPayment = async (req, res) => {
  console.log("verifyProductPayment:", req.body);
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Stripe path
    if (req.body.paymentIntentId) {
      const { paymentIntentId } = req.body;
      const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (intent.status !== "succeeded") {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, message: "Stripe payment not successful" });
      }

      const orderId = intent.metadata.orderId;
      const order = await Order.findById(orderId).populate("product seller buyer").session(session);
      if (!order) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ success: false, message: "Order not found" });
      }

      // Idempotency: if Payment already exists for this gatewayPaymentId, skip duplication
      const existingPayment = await Payment.findOne({ gatewayPaymentId: intent.id }).session(session);
      if (existingPayment) {
        // already processed - return success (but refresh order)
        await session.commitTransaction();
        session.endSession();
        const refreshedOrder = await Order.findById(order._id).populate("product seller buyer");
        return res.json({ success: true, message: "Payment already processed", order: refreshedOrder });
      }

      // mark order paid
      order.status = "paid";
      order.stripePaymentIntentId = intent.id;
      await order.save({ session });

      // Create Payment record
      const payment = await Payment.create([{
        order: order._id,
        payer: order.buyer._id,
        payee: order.seller._id,
        amount: order.amount,
        currency: order.currency,
        gateway: "stripe",
        gatewayPaymentId: intent.id,
        meta: intent,
      }], { session });

      console.log("Payment record created for order:", order._id);

      // compute credit amount (normalized to USD)
      const creditUSD = order.amountUSD ?? toUSD(order.amount, order.currency);

      // Fetch seller and compute new balance
      const seller = await User.findById(order.seller._id).session(session);
      if (!seller) throw new Error("Seller not found during credit");

      const newBalance = (seller.balance || 0) + creditUSD;

      // Create WalletTransaction (CREDIT)
      const walletTx = await WalletTransaction.create([{
        user: seller._id,
        type: "CREDIT",
        amount: creditUSD,
        currency: "USD",
        reference: intent.id,
        status: "SUCCESS",
        product: {
          _id: order.product._id,
          name: order.product.name,
          amount: order.amountUSD || order.amount,
          image: order.product.image?.[0] || "",
        },
        purchasedBy: {
          _id: order.buyer._id,
          handle: order.buyer.handle || "",
          name: order.buyer.name || "",
          email: order.buyer.email || "",
        },
        balanceAfter: newBalance,
        gateway: "stripe",
      }], { session });

      // Update seller balance
      await User.findByIdAndUpdate(seller._id, { $inc: { balance: creditUSD } }, { session });

      console.log("Credited seller:", order.seller._id, "amount USD:", creditUSD);

      // Notification
      await Notification.create([{
        recipient: order.seller._id,
        sender: order.buyer._id,
        type: "order_created",
        message: `Your product "${order.product.name || order.product}" was purchased.`,
        meta: { productId: order.product._id, orderId: order._id },
        image: order.product.image?.[0] || "",
      }], { session });

      // optional email to buyer
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
        secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });

      const mail = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: order.buyer.email,
        subject: `Your purchase for ${order.product.name}`,
        html: `<p>Thanks for purchasing <b>${order.product.name}</b>. The seller has been credited and the download link is available in your orders.</p>`,
      };
      await transporter.sendMail(mail).catch((e) => console.warn("mail send failed", e));

      await session.commitTransaction();
      session.endSession();

      return res.json({ success: true, message: "Payment verified and seller credited", order });
    }

    // Razorpay path
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId: orderIdFromClient,
    } = req.body;
    console.log("Razorpay verification data:", req.body);
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderIdFromClient) {
      await session.abortTransaction();
      session.endSession();
      console.log("Missing Razorpay verification data");
      return res.status(400).json({ success: false, message: "Missing verification data" });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    const order = await Order.findById(orderIdFromClient).populate("product seller buyer").session(session);
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Idempotency: check Payment with this razorpay_payment_id
    const existingPayment = await Payment.findOne({ gatewayPaymentId: razorpay_payment_id }).session(session);
    if (existingPayment) {
      await session.commitTransaction();
      session.endSession();
      const refreshedOrder = await Order.findById(order._id).populate("product seller buyer");
      return res.json({ success: true, message: "Payment already processed", order: refreshedOrder });
    }

    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    order.status = "paid";
    await order.save({ session });
    console.log("Razorpay payment verified for order:", order._id);

    await Payment.create([{
      order: order._id,
      payer: order.buyer._id,
      payee: order.seller._id,
      amount: order.amount,
      currency: order.currency,
      gateway: "razorpay",
      gatewayPaymentId: razorpay_payment_id,
      meta: { razorpay_order_id, razorpay_signature },
    }], { session });

    // Credit seller: convert INR to USD-equivalent and credit USD value to wallet
    const creditUSD = order.amountUSD ?? toUSD(order.amount, order.currency);

    const seller = await User.findById(order.seller._id).session(session);
    if (!seller) throw new Error("Seller not found during credit");

    const newBalance = (seller.balance || 0) + creditUSD;

    await WalletTransaction.create([{
      user: seller._id,
      type: "CREDIT",
      amount: creditUSD,
      currency: "USD",
      reference: razorpay_payment_id,
      status: "SUCCESS",
      product: {
        _id: order.product._id,
        name: order.product.name,
        amount: order.amountUSD || order.amount,
        image: order.product.image?.[0] || "",
      },
      purchasedBy: {
        _id: order.buyer._id,
        handle: order.buyer.handle || "",
        name: order.buyer.name || "",
        email: order.buyer.email || "",
      },
      balanceAfter: newBalance,
      gateway: "razorpay",
    }], { session });

    await User.findByIdAndUpdate(seller._id, { $inc: { balance: creditUSD } }, { session });

    console.log("Credited seller:", order.seller._id, "amount USD:", creditUSD);
    
    await Notification.create([{
      recipient: order.seller._id,
      sender: order.buyer._id,
      type: "cash_received",
      message: `cash received in your wallet`,
      meta: { productId: order.product._id, amount: creditUSD, orderId: order._id },
      image: order.product.image?.[0] || "",
    }], { session });
    console.log("Notification created for seller:", order.seller._id);
    // optional email to buyer
    const transporter2 = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    const mail2 = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: order.buyer.email,
      subject: `Your purchase for ${order.product.name}`,
      html: `<p>Thanks for purchasing <b>${order.product.name}</b>. The seller has been credited and the download link is available in your orders.</p>`,
    };

    await transporter2.sendMail(mail2).catch((e) => console.warn("mail send failed", e));

    await session.commitTransaction();
    session.endSession();

    return res.json({ success: true, message: "Razorpay payment verified and seller credited", order });
  } catch (err) {
    console.error("verifyProductPayment error:", err);
    try {
      await session.abortTransaction();
      session.endSession();
    } catch (e) {
      console.warn("failed aborting tx", e);
    }
    return res.status(500).json({ success: false, message: "Failed to verify payment", error: err.message });
  }
};


// small helper (same logic you used earlier)
function chooseGatewayFromCurrency(currency) {
  if (currency === "INR") return "razorpay";
  return "stripe";
}
