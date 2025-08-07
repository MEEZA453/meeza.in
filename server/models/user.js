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
    require : true,
    unique: true,
    sparse: true, // allows it to be null initially

  },
  favourites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product", // or whatever model your favourites reference
    }
  ],
  profile: String,
  handle: {
    type: String,
    unique: true,
    sparse: true, // allows it to be null initially
  },
  password: String,
  instagram : String,
  bio : String
});

export default mongoose.model('User', userSchema);