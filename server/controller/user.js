import User from "../models/user.js";
import Product from '../models/designs.js'
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken.js";
import { cloudinary } from "../config/cloudinery.js";
import { getCloudinaryPublicId } from "../utils/getCloudinaryPublicId.js";
export const registerUser = async (req, res) => {
  console.log('reached to the register user')
  const { name, id, password, profile } = req.body;

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
console.log(user)
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const products = await Product.find({ postedBy: user._id }).populate("postedBy");
    console.log(products)
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
 console.log(handle)
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
    console.log(user)
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


