// models/ContributionRequest.js
import mongoose from "mongoose";

const contributionRequestSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, default: "" },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
    handledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // admin who accepted/rejected
    handledAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("ContributionRequest", contributionRequestSchema);
