

import jwt from "jsonwebtoken";
import Product from "../models/designs.js";
import Order from "../models/Order.js";
import nodemailer from "nodemailer";
import Notification from "../models/notification.js";
export const unlockFreeProduct = async (req, res) => {
  console.log("unlocking..");
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const product = await Product.findById(productId);
    if (!product)
      return res.status(404).json({ success: false, message: "Product not found" });

    // check if user already unlocked
    let order = await Order.findOne({ user: userId, product: productId, status: "free" });
    if (!order) {
      order = new Order({ user: userId, product: productId, amount: 0, status: "free" });
      await order.save();
    }

    // generate a secure short-lived token (optional)
    const token = jwt.sign({ userId, productId }, process.env.JWT_SECRET, { expiresIn: "15m" });

    // send email with download link
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
    const mail = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: `Your download for ${product.name}`,
      text: `Thanks for unlocking ${product.name}. Here is your download link: ${product.driveLink}`,
      html: `
        <h2>Thanks for unlocking ${product.name} 🎉</h2>
        <p><a href="${product.driveLink}" target="_blank">Click here to download</a></p>
        <p>This link is for your use only.</p>
      `,
    };

    await transporter.sendMail(mail);
    console.log("Download email sent to:", email);

    // ✅ create a notification
    await Notification.create({
      recipient: userId,         // the user who unlocked the product
      sender: product.postedBy,  // the product creator
      type: "order_created", // or custom type
      message: `Your order for ${product.name} was created successfully`,
      meta: { productId: product._id },
      image: product.image?.[0] || "", // first image of the product
    });

    res.json({
      success: true,
      message: "Unlocked successfully. Check your email for the download link.",
    });
  } catch (error) {
    console.error("unlockFreeProduct error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
// export const downloadProduct = async (req, res) => {
//   console.log('downloading')
//   try {
//     const { token } = req.query;
//     if (!token) return res.status(400).json({ success: false, message: "Missing token" });

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     const order = await Order.findOne({
//       user: decoded.userId,
//       product: decoded.productId,
//       status: "free",
//     });
//     if (!order) return res.status(403).json({ success: false, message: "You haven’t unlocked this product" });

//     const product = await Product.findById(decoded.productId);
//     if (!product) return res.status(404).json({ success: false, message: "Product not found" });

//     // send only here, not in getDesign/getDesignById
//     res.json({ success: true, downloadLink: product.driveLink });
//   } catch (error) {
//     console.log('downloaded')
//     console.error("downloadProduct error:", error.message);
//     res.status(400).json({ success: false, message: "Invalid or expired token" });
//   }
// };
export const downloadProduct = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ success: false, message: "Missing token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const order = await Order.findOne({
      user: decoded.userId,
      product: decoded.productId,
      status: "free",
    });
    if (!order) {
      return res.status(403).json({ success: false, message: "You haven’t unlocked this product" });
    }

    const product = await Product.findById(decoded.productId).populate("postedBy", "name");
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // ✅ get user email from auth middleware
    const email = req.user.email;

    // 📧 send mail using your existing setup
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mail = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: `Your download for ${product.name}`,
      text: `Thanks for unlocking ${product.name}. Here is your download link: ${product.driveLink}`,
      html: `
        <p>Thanks for unlocking <b>${product.name}</b> 🎉</p>
        <p><a href="${product.driveLink}" target="_blank">Click here to download</a></p>
        <p>This link is for your use only and was sent securely.</p>
      `,
    };

    await transporter.sendMail(mail);
    console.log("Download email sent to:", email);

    res.json({ success: true, message: "Download link sent to your email" });
  } catch (error) {
    console.error("downloadProduct error:", error.message);
    res.status(400).json({ success: false, message: "Invalid or expired token" });
  }
};
