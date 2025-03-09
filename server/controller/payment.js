import dotenv from 'dotenv';
dotenv.config(); // Ensure .env is loaded

console.log("Stripe API Key:", process.env.STRIPE_SECRET_KEY); // Debug: check API key

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createOrder = async (req, res) => {
  console.log('Reached to the createOrder');
  try {
    console.log(req.body);
    const items = req.body; // Expected items: [{ name, amount, quantity, image }, ...]
    
    const line_items = items.map((item) => {
      const priceInCents = Number(item.amount) * 100;
      if (isNaN(priceInCents)) throw new Error("Invalid price value");

      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name, // Ensure image is an array
            images : ['https://in.pinterest.com/pin/435793701461167365/']
          },
          unit_amount: priceInCents,
        },
        quantity: item.quantity,
      };
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `http://meeza.netlify.app`, 
      cancel_url: `http://meeza.netlify.app`,
    });

    console.log('Checkout session created. Session URL:', session.url);
    res.status(200).json({ url: session.url });

  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: error.message });
  }
};
