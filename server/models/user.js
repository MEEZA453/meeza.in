import mongoose from "mongoose";
// const subscribedGroupSchema = new mongoose.Schema(
//   {
//     group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
//     notificationsEnabled: { type: Boolean, default: false }, // like YouTube bell 🔔
//   },
//   { _id: false }
// );
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
  promotions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],

  profile: String,
  handle: { type: String, unique: true, sparse: true },
  password: String,
  instagram: String,
  bio: String,
 passion: String,
  // Roles
  role: {
    type: String,
    enum: ["normal", "jury", "dev"],
    default: "normal"
  },
  // subscribedGroups: [subscribedGroupSchema],
  // Jury application pending
  juryApplied: {
    type: Boolean,
    default: false
  },
removeJuryApplied: {
  type: Boolean,
  default: false
},
// In User model
balance: { type: Number, default: 0 },
razorpayAccountId: { type: String, unique: true, sparse: true },

// Normal application pending
normalApplied: {
  type: Boolean,
  default: false
},
  // Followers / Following
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  recentSearches: {
    type: [String],
    default: [],
  },
  // inside your existing userSchema definition:
premium: { type: Boolean, default: false },
premiumExpiresAt: { type: Date, default: null },
// optional quick link to an upcoming subscription (not required, but handy)
upcomingSubscription: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription", default: null },

recentlyVisitedUsers: [
  { type: mongoose.Schema.Types.ObjectId, ref: "User" }
],
  // recently opened user profiles
folders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Folder" }],
});


// Virtuals
userSchema.virtual("isDev").get(function () { return this.role === "dev"; });
userSchema.virtual("isJury").get(function () { return this.role === "jury"; });

export default mongoose.model('User', userSchema);
