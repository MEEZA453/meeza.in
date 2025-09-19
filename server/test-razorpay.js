import Razorpay from "razorpay";
import dotenv from "dotenv";

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID?.trim(),
  key_secret: process.env.RAZORPAY_KEY_SECRET?.trim(),
});

(async () => {
  try {
    const order = await razorpay.orders.create({
      amount: 50000,
      currency: "INR",
      receipt: "test_1",
    });
    console.log("✅ Order created:", order);
  } catch (err) {
    console.error("❌ Error:", err);
  }
})();
