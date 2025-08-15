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
    require: true,
    unique: true,
    sparse: true,
  },
  favourites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    }
  ],
  profile: String,
  handle: {
    type: String,
    unique: true,
    sparse: true,
  },
  password: String,
  instagram: String,
  bio: String,

  // Follower / Following fields
  followers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }
  ],
  following: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }
  ]
});

export default mongoose.model('User', userSchema);
