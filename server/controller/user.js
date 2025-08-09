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


export const registerUser = async (req, res) => {
  console.log('reached to the register user')
  const { name , id, password, profile } = req.body;

  try {
    const existingUser = await User.findOne({ id });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

const user = await User.create({
  name,
  id,
  password: hashedPassword,
  ...(profile && { profile }), // ✅ only add profile if it exists
});

    res.status(201).json({
      _id: user._id,
      name: user.name,
      id: user.id,
      token: generateToken(user._id),
    });
console.log('user created success')
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const loginUser = async (req, res) => {
  const { id, password } = req.body;

  try {
    const user = await User.findOne({ id });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        name: user.name,
        id: user.id,
        token: generateToken(user._id),
      });
      console.log('login successfully')
    } else {
      res.status(401).json({ message: "Invalid ID or password" });
    }
  } catch (err) {
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


export const getUserByHandle = async (req, res) => {
  const { handle } = req.params;

  try {
    if (!handle) {
      return res.status(400).json({ message: 'Handle is required' });
    }

    const user = await User.findOne({ handle });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error('Error in getUserByHandle:', error);
    return res.status(500).json({ message: 'Server error' });
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
  console.log('verifying')
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP required' });
    }

    const tokenRecord = await OtpToken.findOne({ email });
    if (!tokenRecord) {
      return res.status(400).json({ message: 'No OTP request found or OTP expired' });
    }

    // Optional: Attempt limit
    if (tokenRecord.attempts >= 5) {
      return res.status(429).json({ message: 'Too many attempts. Please request a new OTP.' });
    }

    // Check OTP
    if (tokenRecord.otp !== otp) {
      tokenRecord.attempts += 1;
      await tokenRecord.save();
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // OTP correct → remove token record
    await OtpToken.deleteOne({ email });

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        email,
        name: email.split('@')[0]
      });
    }

    // Create JWT token
    const payload = {
      id: user._id,
      email: user.email,
      name: user.name
    };
    const tokenJwt = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    const responseData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      token: tokenJwt,
      handle: user.handle || null,
      instagram: user.instagram || '',
      bio: user.bio || ''
    };
console.log('verified upt')
    return res.status(200).json(responseData);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'OTP verification failed' });
  }
};
