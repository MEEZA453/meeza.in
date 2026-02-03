// models/Appreciation.js
import mongoose from "mongoose";

const appreciationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    targetType: {
      type: String,
      enum: ["Post", "Product"],
      required: true,
      index: true,
    },

    target: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "targetType",
      index: true,
    },

    // snapshot (prevents extra populate cost later)
    owner: {
      _id: mongoose.Schema.Types.ObjectId,
      name: String,
      handle: String,
      profile: String,
    },

    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: false }
);

// prevent double-like
appreciationSchema.index(
  { user: 1, target: 1 },
  { unique: true }
);

export default mongoose.model("Appreciation", appreciationSchema);
