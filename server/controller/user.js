import User from "../models/user.js";
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
