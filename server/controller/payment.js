import Razorpay from "razorpay";
import crypto from "crypto";
import Product from "../models/designs.js";
import Order from "../models/Order.js";
import Payment from "../models/payment.js";
import Notification from "../models/notification.js";
import nodemailer from "nodemailer";
import Stripe from "stripe";
import paypal from "@paypal/checkout-server-sdk";
import dotenv from "dotenv";
import User from "../models/user.js";
import WalletTransaction from "../models/wallet.js";
import { error } from "console";
// Razorpay Client
dotenv.config();
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });
  export const getWallet = async (req, res) => {
    try {
      console.log("🔹 getWallet called for user:", req.user.id);

      const user = await User.findById(req.user.id).select("balance razorpayAccountId");
      if (!user) {
        console.log("❌ User not found");
        return res.status(404).json({ success: false, message: "User not found" });
      }
      console.log("✅ User found:", user);

      // Fetch all transactions for this user
      const transactions = await WalletTransaction.find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .lean();

      console.log(`🔹 Found ${transactions.length} wallet transactions`);

      const enrichedTransactions = await Promise.all(
        transactions.map(async (tx, idx) => {
          console.log(`🔹 Processing transaction ${idx}:`, tx);

          if (tx.type === "CREDIT" && tx.reference) {
            const payment = await Payment.findOne({ paymentId: tx.reference }).populate("products");
            if (!payment) {
              console.log(`❌ No payment found for reference: ${tx.reference}`);
              return tx;
            }

            console.log(`✅ Found payment ${payment._id} for transaction ${tx._id}`);

            // Find the product that corresponds to this seller
            const index = payment.sellers.findIndex(s => s.toString() === req.user.id);
            if (index === -1) {
              console.log(`❌ User ${req.user.id} not found in payment.sellers`);
              return tx;
            }

            const product = payment.products[index] || null;
            console.log(`🔹 Product matched for transaction ${tx._id}:`, product?._id);

           return { 
  ...tx, 
  product:  tx.product 
};
          }

          return tx;
        })
      );

      console.log("🔹 Enriched transactions:", enrichedTransactions);

      res.json({
        success: true,
        balance: user.balance,
        razorpayAccountId: user.razorpayAccountId || null,
        transactions: enrichedTransactions,
      });
    } catch (err) {
      console.error("❌ getWallet error:", err);
      res.status(500).json({ success: false, message: "Failed to fetch wallet" });
    }
  };

  // 📌 Create Order for Multiple Products (from Cart)
  export const createCartOrder = async (req, res) => {
    try {
      const { cartItems } = req.body; // [{ productId }, { productId }]
      const buyerId = req.user.id;

      console.log("🔹 createCartOrder called | buyer:", buyerId, " cart:", cartItems);

      // 1️⃣ Fetch all products
      const products = await Product.find({ _id: { $in: cartItems.map(i => i.productId) } }).populate("postedBy");

      if (!products || products.length === 0) {
        console.log("❌ No products found in cart");
        return res.status(404).json({ success: false, message: "No products found" });
      }

      // 2️⃣ Calculate total amount
      const totalAmount = products.reduce((sum, p) => sum + p.amount, 0);

      console.log("✅ Products found:", products.map(p => p._id));
      console.log("💰 Total amount:", totalAmount);

      // 3️⃣ Create Razorpay Order
      const options = {
        amount: totalAmount * 100, // in paise
        currency: "INR",
        receipt: `cart_${Date.now()}`,
      };

      console.log("📝 Creating Razorpay order with options:", options);

      const order = await razorpay.orders.create(options);

      console.log("✅ Razorpay cart order created:", order.id);

      // 4️⃣ Store Payment Record (linked to multiple products)
      await Payment.create({
        buyer: buyerId,
        products: products.map(p => p._id),
        sellers: products.map(p => p.postedBy._id),
        orderId: order.id,
        amount: totalAmount,
        status: "CREATED",
      });

      console.log("💾 Cart Payment record created in DB");

      res.json({
        success: true,
        orderId: order.id,
        key: process.env.RAZORPAY_KEY_ID,
        amount: options.amount,
        currency: options.currency,
      });

    } catch (err) {
      console.error("❌ createCartOrder error:", err);
      res.status(500).json({ success: false, message: "Failed to create cart order" });
    }
  };


  // 📌 Capture Cart Payment
  export const captureCartPayment = async (req, res) => {
    try {
      const { orderId, paymentId, signature } = req.body;
      const buyerId = req.user.id;

      // 1️⃣ Verify signature
      const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(orderId + "|" + paymentId)
        .digest("hex");

      if (generatedSignature !== signature) {
        return res.status(400).json({ success: false, message: "Invalid payment signature" });
      }

      // 2️⃣ Update Payment record
      const payment = await Payment.findOneAndUpdate(
        { orderId },
        { status: "COMPLETED", paymentId },
        { new: true }
      ).populate("sellers products");

      if (!payment) {
        return res.status(404).json({ success: false, message: "Payment not found" });
      }

      console.log("✅ Cart Payment captured:", paymentId);

      // 3️⃣ Process each product & seller
      for (const product of payment.products) {
        const seller = product.postedBy;

        // Credit seller balance
        await User.findByIdAndUpdate(seller._id, { $inc: { balance: product.amount } });
    const buyer = await User.findById(buyerId).select("name email handle");
        // WalletTransaction
      await WalletTransaction.create({
  user: seller._id,
  type: "CREDIT",
  amount: product.amount,
  reference: paymentId,
  status: "SUCCESS",
  product: {
    _id: product._id,
    name: product.name,
    amount: product.amount,
    image: product.image?.[0] || "", // take first image
  },
      purchasedBy: buyer
          ? { handle: buyer.handle, name: buyer.name, email: buyer.email }
          : null,
  
});


        // Order record for buyer
        await Order.create({
          user: buyerId,
          product: product._id,
          amount: product.amount,
          status: "paid",
        });

        // Email to buyer for each product
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
            <p><a href="${product.driveLink}" target="_blank">Click here to download your asset</a></p>
          `,
        });

        // Notifications
        await Notification.create({
          recipient: buyerId,
          sender: seller._id,
          type: "order_created",
          message: `You successfully purchased ${product.name}`,
          meta: { productId: product._id },
          image: product.image?.[0] || "",
        });

        await Notification.create({
          recipient: seller._id,
          sender: buyerId,
          type: "product_sold",
          message: `purchased your product.`,
          meta: { productId: product._id },
          image: product.image?.[0] || "",
        });
      }

      res.json({
        success: true,
        message: "Cart payment captured successfully",
        products: payment.products,
      });

    } catch (err) {
      console.error("❌ captureCartPayment error:", err);
      res.status(500).json({ success: false, message: "Failed to capture cart payment" });
    }
  };


  export const createOrder = async (req, res) => {
    try {
      const { productId } = req.body;
      const buyerId = req.user.id;

      console.log("🔹 createOrder called | buyer:", buyerId, " product:", productId);

      const product = await Product.findById(productId).populate("postedBy");
      if (!product) {
        console.log("❌ Product not found");
        return res.status(404).json({ success: false, message: "Product not found" });
      }

      console.log("✅ Product found:", product._id, " Seller:", product.postedBy._id);

      const options = {
        amount: product.amount * 100,
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      };

      console.log("📝 Creating Razorpay order with options:", options);

      const order = await razorpay.orders.create(options);

      console.log("✅ Razorpay order created:", order.id);

  await Payment.create({
    buyer: buyerId,
    products: [productId],               // wrap in array
    sellers: [product.postedBy._id],    // wrap in array
    orderId: order.id,
    amount: product.amount,
    status: "CREATED",
  });


      console.log("💾 Payment record created in DB");

      res.json({
        success: true,
        orderId: order.id,
        key: process.env.RAZORPAY_KEY_ID,
        amount: options.amount,
        currency: options.currency,
      });
    } catch (err) {
      console.log(err)
      console.error("❌ createOrder error:", err);
      res.status(500).json({ success: false, message: "Failed to create order" });
    }
  };


export const capturePayment = async (req, res) => {
  try {
    const { orderId, paymentId, signature } = req.body;
    const buyerId = req.user.id;

    // 1️⃣ Verify payment signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(orderId + "|" + paymentId)
      .digest("hex");

    if (generatedSignature !== signature) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    // 2️⃣ Update Payment record
    const payment = await Payment.findOneAndUpdate(
      { orderId },
      { status: "COMPLETED", paymentId },
      { new: true }
    ).populate("sellers products");

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    // 3️⃣ Normalize single-product orders to arrays
    const products = Array.isArray(payment.products) ? payment.products : [payment.products];
    const sellers = Array.isArray(payment.sellers) ? payment.sellers : [payment.sellers];

    // 4️⃣ Process each product
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const seller = sellers[i];

      if (!seller || !product) continue; // safety check

      // Credit seller balance
      await User.findByIdAndUpdate(seller._id, { $inc: { balance: product.amount } });
    const buyer = await User.findById(buyerId).select("name email handle");
      // WalletTransaction for seller
   await WalletTransaction.create({
  user: seller._id,
  type: "CREDIT",
  amount: product.amount,
  reference: paymentId,
  status: "SUCCESS",
  product: {
    _id: product._id,
    name: product.name,
    amount: product.amount,
    image: product.image?.[0] || "", // take first image
  },
      purchasedBy: buyer
          ? { handle: buyer.handle, name: buyer.name, email: buyer.email }
          : null,
});


      // Order record for buyer
      await Order.create({
        user: buyerId,
        product: product._id,
        amount: product.amount,
        status: "paid",
      });

      // Send email to buyer
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
        secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: req.user.email,
        subject: `Your purchase: ${product.name}`,
        html: `
          <h2>Thanks for purchasing ${product.name} 🎉</h2>
          <p><a href="${product.driveLink}" target="_blank">Click here to download your asset</a></p>
        `,
      });

      // Notifications
      await Notification.create({
        recipient: buyerId,
        sender: seller._id,
        type: "order_created",
        message: `You successfully purchased ${product.name}`,
        meta: { productId: product._id },
        image: product.image?.[0] || "",
      });

      await Notification.create({
        recipient: seller._id,
        sender: buyerId,
        type: "product_sold",
        message: `purchased your product.`,
        meta: { productId: product._id },
        image: product.image?.[0] || "",
      });
    }

    res.json({
      success: true,
      message: "Payment captured successfully",
      products,
    });
  } catch (err) {
    console.error("❌ capturePayment error:", err);
    res.status(500).json({ success: false, message: "Failed to capture payment" });
  }
};

export const connectRazorpayAccount = async (req, res) => {
  try {
    const { razorpayAccountId } = req.body;
    const userId = req.user.id;

    console.log("🔹 connectRazorpayAccount called | user:", userId, " account:", razorpayAccountId);

    const user = await User.findByIdAndUpdate(userId, { razorpayAccountId }, { new: true });

    console.log("✅ Razorpay account connected for user:", user._id);

    res.json({ success: true, message: "Razorpay account connected", user });
  } catch (err) {
    console.error("❌ connectRazorpayAccount error:", err);
    res.status(500).json({ success: false, message: "Failed to connect account" });
  }
};


const razorpayX = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const withdrawBalance = async (req, res) => {
  
  try {
    const user = await User.findById(req.user.id);

    console.log("🔹 withdrawBalance called | user:", req.user.id, " balance:", user.balance);

    if (!user.razorpayAccountId) {
      console.log("❌ No Razorpay account connected");
      return res.status(400).json({ success: false, message: "Connect Razorpay account first" });
    }
    if (user.balance <= 0) {
      console.log("❌ No balance available for withdrawal");
      return res.status(400).json({ success: false, message: "No balance to withdraw" });
    }

    console.log("📝 Creating payout via RazorpayX for user:", user._id);

    const payout = await razorpayX.payouts.create({
      account_number: process.env.RAZORPAYX_ACCOUNT_NUMBER,
      fund_account: {
        account_type: "rzp_account",
        account: { id: user.razorpayAccountId },
      },
      amount: user.balance * 100,
      currency: "INR",
      mode: "IMPS",
      purpose: "payout",
      narration: "Earnings from MZCO",
    });

    console.log("✅ Payout created:", payout.id);

    const amount = user.balance;
    user.balance = 0;
    await user.save();

    console.log("💾 User balance reset to 0 after withdrawal");

    await WalletTransaction.create({
      user: user._id,
      type: "DEBIT",
      amount,
      reference: payout.id,
      status: "SUCCESS",
    });

    console.log("💾 WalletTransaction DEBIT saved for user:", user._id);

    res.json({ success: true, message: "Withdrawal successful", payout });
  } catch (err) {
    console.error("❌ withdrawBalance error:", err);
    res.status(500).json({ success: false, message: "Withdrawal failed" });
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
// export const getRazorpayConnectUrl = (req, res) => {
//   console.log('trying to connect')
//   try {
//     const clientId = process.env.RAZORPAY_KEY_ID; // from Razorpay Connect app
//     const redirectUri = encodeURIComponent(process.env.RAZORPAY_REDIRECT_URI);
// console.log(clientId , redirectUri)
//     const url = `https://connect.razorpay.com/authorize?response_type=code&client_id=${clientId}&scope=account&redirect_uri=${redirectUri}`;
// console.log('done')
//     res.json({ success: true, url });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: "Failed to get Razorpay connect URL" });
//   }
// };

// // Step 2: Callback after seller approves (exchange code for account info)
// export const razorpayConnectCallback = async (req, res) => {
//   try {
//     const { code } = req.query; // Razorpay returns ?code=xxxx

//     if (!code) return res.status(400).json({ success: false, message: "No code provided" });

//     const clientId = process.env.RAZORPAY_CLIENT_ID;
//     const clientSecret = process.env.RAZORPAY_CLIENT_SECRET;
//     const redirectUri = process.env.RAZORPAY_REDIRECT_URI;

//     // Exchange code for access token + account id
//     const response = await axios.post(
//       "https://connect.razorpay.com/merchant/oauth/token",
//       new URLSearchParams({
//         grant_type: "authorization_code",
//         code: code ,
//         client_id: clientId,
//         client_secret: clientSecret,
//         redirect_uri: redirectUri,
//       }),
//       { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
//     );

//     const { access_token, razorpay_account_id } = response.data;

//     // Save razorpay_account_id in user model
//     await User.findByIdAndUpdate(req.user.id, { razorpayAccountId: razorpay_account_id });

//     res.json({ success: true, message: "Razorpay account connected", razorpay_account_id });
//   } catch (err) {
//     console.error("Razorpay Connect error:", err.response?.data || err.message);
//     res.status(500).json({ success: false, message: "Failed to connect Razorpay account" });
//   }
// };

// export const createRazorpayOrder = async (req, res) => {
//   console.log('reached to create razor');
//   try {
//     const { productId } = req.body;
//     const userId = req.user.id;

//     console.log(productId, userId);
//     console.log("Using Razorpay ID:", `"${process.env.RAZORPAY_KEY_ID}"`);

//     const product = await Product.findById(productId);
//     if (!product) return res.status(404).json({ success: false, message: "Product not found" });

//     const options = {
//       amount: product.amount * 100, // amount in paise
//       currency: "INR",
//       receipt: `receipt_${Date.now()}`,
//     };

//     const order = await razorpay.orders.create(options);

//     await Payment.create({
//       user: userId,
//       product: productId,
//       orderId: order.id,
//       amount: product.amount,
//       status: "CREATED",
//       method: "razorpay",
//     });

//     console.log("done order", order);

//     res.json({
//       success: true,
//       orderId: order.id,
//       key: process.env.RAZORPAY_KEY_ID,
//       amount: options.amount,        // ✅ include amount
//       currency: options.currency,    // ✅ include currency
//     });
//   } catch (err) {
//     console.error("createRazorpayOrder error:", err);
//     res.status(500).json({ success: false, message: "Failed to create Razorpay order" });
//   }
// };


// // ✅ Capture Razorpay Payment
// export const captureRazorpayPayment = async (req, res) => {
//   console.log('reached to capture razor')
//   try {
//     const { orderId, paymentId, signature, productId } = req.body;
//     const userId = req.user.id;

//     // Verify signature
//     const generatedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//       .update(orderId + "|" + paymentId)
//       .digest("hex");

//     if (generatedSignature !== signature) {
//       return res.status(400).json({ success: false, message: "Invalid payment signature" });
//     }

//     // Update payment status
//     await Payment.findOneAndUpdate(
//       { orderId },
//       { status: "COMPLETED", paymentId },
//       { new: true }
//     );

//     const product = await Product.findById(productId);

//     // Save in Orders collection
//     const order = new Order({
//       user: userId,
//       product: productId,
//       amount: product.amount,
//       status: "paid",
//     });
//     await order.save();

//     // Send Email
//     const transporter = nodemailer.createTransport({
//       host: process.env.SMTP_HOST || "smtp.gmail.com",
//       port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
//       secure: false,
//       auth: {
//         user: process.env.SMTP_USER,
//         pass: process.env.SMTP_PASS,
//       },
//     });

//     await transporter.sendMail({
//       from: process.env.SMTP_FROM || process.env.SMTP_USER,
//       to: req.user.email,
//       subject: `Your purchase: ${product.name}`,
//       html: `
//         <h2>Thanks for purchasing ${product.name} 🎉</h2>
//         <p><a href="${product.driveLink}" target="_blank">Click here to download</a></p>
//       `,
//     });

//     // Create Notification
//     await Notification.create({
//       recipient: userId,         // the user who unlocked the product
//       sender: product.postedBy,  // the product creator
//       type: "order_created", // or custom type
//       message: `Your order for ${product.name} was created successfully`,
//       meta: { productId: product._id },
//       image: product.image?.[0] || "", // first image of the product
//     });

//     res.json({ success: true, message: "Razorpay payment successful, email sent" });
//   } catch (err) {
//     console.error("captureRazorpayPayment error:", err.message);
//     res.status(500).json({ success: false, message: "Failed to capture Razorpay payment" });
//   }
// };