import dotenv from 'dotenv';
import Stripe from "stripe";
import Order from "../models/Order.js";
import Product from "../models/designs.js";
import User from "../models/user.js";
dotenv.config(); // Ensure .env is loaded

console.log("Stripe API Key:", process.env.STRIPE_SECRET_KEY); // Debug: check API key

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// export const createOrder = async (req, res) => {
//   console.log('Reached to the createOrder');
//   try {
//     console.log(req.body);
//     const items = req.body; // Expected items: [{ name, amount, quantity, image }, ...]
    
//     const line_items = items.map((item) => {
//       const priceInCents = Number(item.amount) * 100;
//       if (isNaN(priceInCents)) throw new Error("Invalid price value");

//       return {
//         price_data: {
//           currency: 'usd',
//           product_data: {
//             name: item.name, // Ensure image is an array
//             images : ['https://in.pinterest.com/pin/435793701461167365/']
//           },
//           unit_amount: priceInCents,
//         },
//         quantity: item.quantity,
//       };
//     });

//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ['card'],
//       line_items,
//       mode: 'payment',
//       success_url: `http://meeza.netlify.app`, 
//       cancel_url: `http://meeza.netlify.app`,
//     });

//     console.log('Checkout session created. Session URL:', session.url);
//     res.status(200).json({ url: session.url });

//   } catch (error) {
//     console.error("Error creating checkout session:", error);
//     res.status(500).json({ error: error.message });
//   }
// };

// controllers/orderController.js


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createOrder = async (req, res) => {
  try {
    const { productId } = req.body;
    const buyerId = req.user._id; // from auth middleware

    const product = await Product.findById(productId).populate("postedBy");
    if (!product) return res.status(404).json({ message: "Product not found" });

    const seller = product.postedBy;

    // Make sure seller has connected Stripe account
    if (!seller.stripeAccountId) {
      return res.status(400).json({ message: "Seller has no payout account" });
    }

    // Create Payment Intent with transfer to seller
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(product.amount * 100), // in cents/paise
      currency: "usd", // or "inr"
      application_fee_amount: Math.round(product.amount * 0.1 * 100), // 10% commission
      transfer_data: {
        destination: seller.stripeAccountId
      }
    });

    // Save order
    const order = new Order({
      product: product._id,
      buyer: buyerId,
      seller: seller._id,
      amount: product.amount,
      paymentIntentId: paymentIntent.id
    });
    await order.save();

    res.json({
      clientSecret: paymentIntent.client_secret,
      orderId: order._id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

