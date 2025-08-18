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
  favourites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
  highlights: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
  promotion: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],

  profile: String,
  handle: { type: String, unique: true, sparse: true },
  password: String,
  instagram: String,
  bio: String,

  // Roles
  role: {
    type: String,
    enum: ["normal", "jury", "dev"],
    default: "normal"
  },

  // Jury application pending
  juryApplied: {
    type: Boolean,
    default: false
  },

  // Followers / Following
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
});

// Virtuals
userSchema.virtual("isDev").get(function () { return this.role === "dev"; });
userSchema.virtual("isJury").get(function () { return this.role === "jury"; });

export default mongoose.model('User', userSchema);
