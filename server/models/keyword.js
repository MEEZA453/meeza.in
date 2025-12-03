import mongoose from "mongoose";

const keywordSchema = new mongoose.Schema({
  text: { type: String, required: true, unique: true },
  popularity: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("Keyword", keywordSchema);
