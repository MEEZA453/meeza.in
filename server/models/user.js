import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    required: true,
    unique: true,
  },
  googleId: {
    type: String,
    unique: true,
  },
  profile: String,
  handle: {
    type: String,
    unique: true,
    sparse: true, // allows it to be null initially
  },
  password: String,
});

export default mongoose.model('User', userSchema);