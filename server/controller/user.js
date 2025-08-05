import User from "../models/user.js";
import Product from '../models/designs.js'
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken.js";

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
  const { id } = req.params;
console.log(id ,' reached to the get user product')
  try {
    const user = await User.findOne({ id }); // Find user by custom ID
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
