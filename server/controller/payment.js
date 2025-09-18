import Razorpay from "razorpay";
import crypto from "crypto";
import Product from "../models/designs.js";
import Order from "../models/Order.js";
import Payment from "../models/payment.js";
import Notification from "../models/notification.js";
import nodemailer from "nodemailer";
import Stripe from "stripe";
import paypal from "@paypal/checkout-server-sdk";
// Razorpay Client
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});



const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
export const createRazorpayOrder = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const options = {
      amount: product.amount * 100, // amount in paisa
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    // Save in DB
    await Payment.create({
      user: userId,
      product: productId,
      orderId: order.id,
      amount: product.amount,
      status: "CREATED",
      method: "razorpay",
    });

    res.json({ success: true, orderId: order.id, key: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    console.error("createRazorpayOrder error:", err.message);
    res.status(500).json({ success: false, message: "Failed to create Razorpay order" });
  }
};

// ✅ Capture Razorpay Payment
export const captureRazorpayPayment = async (req, res) => {
  try {
    const { orderId, paymentId, signature, productId } = req.body;
    const userId = req.user.id;

    // Verify signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(orderId + "|" + paymentId)
      .digest("hex");

    if (generatedSignature !== signature) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    // Update payment status
    await Payment.findOneAndUpdate(
      { orderId },
      { status: "COMPLETED", paymentId },
      { new: true }
    );

    const product = await Product.findById(productId);

    // Save in Orders collection
    const order = new Order({
      user: userId,
      product: productId,
      amount: product.amount,
      status: "paid",
    });
    await order.save();

    // Send Email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: req.user.email,
      subject: `Your purchase: ${product.name}`,
      html: `
        <h2>Thanks for purchasing ${product.name} 🎉</h2>
        <p><a href="${product.driveLink}" target="_blank">Click here to download</a></p>
      `,
    });

    // Create Notification
    await Notification.create({
      recipient: userId,
      type: "order_paid",
      message: `${product.name} purchased successfully via Razorpay`,
      image: product.image,
    });

    res.json({ success: true, message: "Razorpay payment successful, email sent" });
  } catch (err) {
    console.error("captureRazorpayPayment error:", err.message);
    res.status(500).json({ success: false, message: "Failed to capture Razorpay payment" });
  }
};

// PayPal Client
function paypalClient() {
  let environment =
    process.env.NODE_ENV === "production"
      ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)
      : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET);
  return new paypal.core.PayPalHttpClient(environment);
}

// ✅ Create PayPal Order
export const createPaypalOrder = async (req, res) => {
  console.log('creating paypal order')
  try {
    const { productId } = req.body;
    const userId = req.user.id;
    console.log(productId , userId)
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: productId,
          amount: {
            currency_code: "USD",
            value: product.amount.toString(),
          },
        },
      ],
    });

    const order = await paypalClient().execute(request);

    // Save in DB
    await Payment.create({
      user: userId,
      product: productId,
      orderId: order.result.id,
      amount: product.amount,
      status: "CREATED",
    });
console.log('paypal order created')
    res.json({ success: true, orderId: order.result.id });
  } catch (err) {
    console.error("createPaypalOrder error:", err.message);
    res.status(500).json({ success: false, message: "Failed to create order" });
  }
};

// ✅ Capture Payment
export const capturePaypalOrder = async (req, res) => {
  console.log('capturing paypal order')
  try {
    const { orderId } = req.body;
    const userId = req.user.id;

    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});
    const capture = await paypalClient().execute(request);

    if (capture.result.status === "COMPLETED") {
      const payment = await Payment.findOneAndUpdate(
        { orderId },
        { status: "COMPLETED" },
        { new: true }
      );

      // Save in Order collection
      const productId = capture.result.purchase_units[0].reference_id;
      const product = await Product.findById(productId);

      const order = new Order({
        user: userId,
        product: productId,
        amount: product.amount,
        status: "paid",
      });
      await order.save();

      // Send Email
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const email = req.user.email;
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: `Your purchase: ${product.name}`,
        html: `
          <h2>Thanks for purchasing ${product.name} 🎉</h2>
          <p><a href="${product.driveLink}" target="_blank">Click here to download</a></p>
        `,
      });
console.log('paypal order captured')
      // Notification
      await Notification.create({
        recipient: userId,
        type: "order_paid",
        message: `${product.name} purchased successfully`,
        image: product.image,
      });

      return res.json({ success: true, message: "Payment captured, email sent" });
    } else {
      res.status(400).json({ success: false, message: "Payment not completed" });
    }
  } catch (err) {
    console.error("capturePaypalOrder error:", err.message);
    res.status(500).json({ success: false, message: "Failed to capture order" });
  }
};
// ✅ Create Razorpay Order
