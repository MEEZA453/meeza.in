import User from "../models/user.js";

import OtpToken from '../models/OtpToken.js';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import Product from '../models/designs.js'
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken.js";
import { cloudinary } from "../config/cloudinery.js";
import { getCloudinaryPublicId } from "../utils/getCloudinaryPublicId.js";



const JWT_SECRET = process.env.JWT_SECRET 
const OTP_TTL_MINUTES = 10;


export const getUserByHandle = async (req, res) => {
  console.log("got the user");
  const { handle } = req.params;

  try {
    if (!handle) {
      return res.status(400).json({ message: "Handle is required" });
    }

    const user = await User.findOne({ handle });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // requester (logged in user from token)
    const requesterUserId = req.user?.id?.toString() || null;

    const isUser =
      requesterUserId && user._id
        ? user._id.toString() === requesterUserId
        : false;



    return res.status(200).json({ user, isUser });
  } catch (error) {
    console.error("Error in getUserByHandle:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getDefaultUsers = async (req, res) => {
  try {
    // You can set a limit for how many users to return (e.g., latest 10 users)
    const users = await User.find({})
      .sort({ createdAt: -1 }) // newest first
      .limit(10)
      .select("-password"); // exclude sensitive fields

    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching default users:", error);
    res.status(500).json({ message: "Server error while fetching default users" });
  }
};
// In controller/user.js
export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query; // example: /search?query=mee

    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "Search query is required" });
    }

    // Case-insensitive regex search on handle or name
    const users = await User.find({
      $or: [
        { handle: { $regex: query, $options: "i" } },
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    })
      .select("-password -__v") // hide sensitive fields
      .limit(20); // limit results

    return res.status(200).json(users);
  } catch (error) {
    console.error("Error in searchUsers:", error);
    return res.status(500).json({ message: "Server error" });
  }
};



export const approveJury = async (req, res) => {
  try {
    const devUser = await User.findById(req.user.id);
    if (!devUser?.isDev) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const { userId, approve } = req.body; // approve = true / false

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (!user.juryApplied) {
      return res.status(400).json({ success: false, message: "No pending jury application" });
    }

    if (approve) {
      user.role = "jury";
      user.juryApplied = false;
      await user.save();
      return res.status(200).json({ success: true, message: "User approved as jury", user });
    } else {
      user.juryApplied = false;
      await user.save();
      return res.status(200).json({ success: true, message: "Jury application rejected", user });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};




export const applyJury = async (req, res) => {
  try {
    const userId = req.user.id; // authenticated user

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.isJury) {
      return res.status(400).json({ success: false, message: "You are already a jury" });
    }

    if (user.juryApplied) {
      return res.status(400).json({ success: false, message: "Jury application already pending" });
    }

    user.juryApplied = true;
    await user.save();

    res.status(200).json({ success: true, message: "Jury application submitted", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};




const DEV_EMAILS = ["meejanursk@gmail.com", "mzco.creative@gmail.com"]; // dev list

// ================= REGISTER =================
export const registerUser = async (req, res) => {
  console.log("Reached register user");

  const { name, id, password, profile, email } = req.body;

  try {
    if (!email || !password || !name || !id) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    const normalizedEmail = email.toLowerCase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Assign role
    let role = "normal";
    if (DEV_EMAILS.map(e => e.toLowerCase()).includes(normalizedEmail)) {
      role = "dev";
    }

    // Create user
    const user = await User.create({
      name,
      id,
      email: normalizedEmail,
      password: hashedPassword,
      role,
      ...(profile && { profile }), // only add profile if exists
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      id: user.id,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });

    console.log("✅ User created successfully:", user.email, "Role:", user.role);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ================= LOGIN =================
export const loginUser = async (req, res) => {
  const { idOrEmail, password } = req.body; // 🔑 allow login with either id or email

  try {
    if (!idOrEmail || !password) {
      return res.status(400).json({ message: "ID/Email and password are required" });
    }

    const query = idOrEmail.includes("@")
      ? { email: idOrEmail.toLowerCase() }
      : { id: idOrEmail };

    const user = await User.findOne(query);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 🔄 Auto-upgrade dev role if needed
    if (DEV_EMAILS.map(e => e.toLowerCase()).includes(user.email.toLowerCase()) && user.role !== "dev") {
      user.role = "dev";
      await user.save();
      console.log("🔄 User upgraded to DEV:", user.email);
    }

    res.json({
      _id: user._id,
      name: user.name,
      id: user.id,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });

    console.log("✅ Login successful:", user.email);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
export const getProductsByUser = async (req, res) => {
  const { handle } = req.params;
console.log(handle ,' reached to the get user product')
  try {
    const user = await User.findOne({ handle }); // Find user by custom ID

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const products = await Product.find({ postedBy: user._id }).populate("postedBy");

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user's products", error });
  }
};
export const setHandle = async (req, res) => {
  console.log('setup/handle')
  const { userId, handle } = req.body;

  if (!handle || !userId) {
    return res.status(400).json({ message: "Handle and user ID are required" });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if handle is already taken
    const existingHandle = await User.findOne({ handle });
    if (existingHandle) {
      return res.status(400).json({ message: "Handle already taken" });
    }

    user.handle = handle;
    await user.save();
console.log('handle claimed')
    return res.status(200).json({ message: "Handle set successfully", user });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error while setting handle" });
  }
};




export const updateUserProfile = async (req, res) => {
  console.log('updating user....')
  try {
    const userId = req.params.id;
    const { displayName, website, instagram, bio } = req.body;

    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    // Replace old profile image if new one is uploaded
    if (req.file && req.file.path) {
      if (user.profile) {
        const publicId = getCloudinaryPublicId(user.profile);
        if (publicId) await cloudinary.uploader.destroy(publicId);
      }
      user.profile = req.file.path;
    }

    user.name = displayName || user.name;
    user.website = website || '';
    user.instagram = instagram || '';
    user.bio = bio || '';

    await user.save();
console.log('user updated successfully' , user)
    res.status(200).json({ message: "Profile updated", user });
  } catch (err) {
    console.error("Update failed:", err);
    res.status(500).json({ message: err.message || "Internal server error" });
  }
};



const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Helper: Generate numeric OTP (default length 6)
function generateOtp(length = 6) {

  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

// Send OTP
export const sendOtp = async (req, res) => {

  try {
    const { email } = req.body;
    console.log('sending opt to :' , email)
    if (!email) return res.status(400).json({ message: 'Email required' });

    const otp = generateOtp(6);
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    // Upsert OTP token for this email
    await OtpToken.findOneAndUpdate(
      { email },
      { otp, expiresAt, attempts: 0 },
      { upsert: true, new: true }
    );

    // Send email
    const mail = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Your verification code',
      text: `Your OTP code is ${otp}. It expires in ${OTP_TTL_MINUTES} minutes.`,
      html: `<p>Your OTP code is <b>${otp}</b>. It expires in ${OTP_TTL_MINUTES} minutes.</p>`
    };
console.log('opt sent')
    await transporter.sendMail(mail);

    return res.status(200).json({ message: 'OTP sent' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to send OTP' });
  }
};

// Resend OTP (just calls sendOtp)
export const resendOtp = async (req, res) => {
console.log('resending the opt')

  return sendOtp(req, res);
};




// Verify OTP
export const verifyOtp = async (req, res) => {
  console.log("verifying OTP...");
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP required" });
    }

    const normalizedEmail = email.toLowerCase();

    const tokenRecord = await OtpToken.findOne({ email: normalizedEmail });
    if (!tokenRecord) {
      return res.status(400).json({ message: "No OTP request found or OTP expired" });
    }

    // Attempt limit
    if (tokenRecord.attempts >= 5) {
      return res.status(429).json({ message: "Too many attempts. Please request a new OTP." });
    }

    // Validate OTP
    if (tokenRecord.otp !== otp) {
      tokenRecord.attempts += 1;
      await tokenRecord.save();
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // OTP correct → cleanup
    await OtpToken.deleteOne({ email: normalizedEmail });

    // Find or create user
    let user = await User.findOne({ email: normalizedEmail });
    let isAlreadyUser = true;

    if (!user) {
      isAlreadyUser = false;
      let role = "normal";
      if (DEV_EMAILS.map(e => e.toLowerCase()).includes(normalizedEmail)) {
        role = "dev";
      }

      user = await User.create({
        email: normalizedEmail,
        name: normalizedEmail.split("@")[0],
        role,
      });
      console.log("✅ New user created:", user.email, "Role:", role);
    } else {
      // Existing user → auto-upgrade role if needed
      if (DEV_EMAILS.map(e => e.toLowerCase()).includes(normalizedEmail) && user.role !== "dev") {
        user.role = "dev";
        await user.save();
        console.log("🔄 Existing user upgraded to DEV:", user.email);
      }
    }

    // Create JWT token
    const payload = {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    const tokenJwt = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

    const responseData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      profile : user.profile,
      role: user.role,
      token: tokenJwt,
      handle: user.handle || null,
      instagram: user.instagram || "",
      bio: user.bio || "",
      isAlreadyUser,
    };

    console.log("✅ OTP verified:", user.email, "| role:", user.role, "| existing:", isAlreadyUser);
    return res.status(200).json(responseData);
  } catch (err) {
    console.error("❌ OTP verify error:", err);
    return res.status(500).json({ message: "OTP verification failed" });
  }
};