// backend/models/OtpToken.js
import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 }
}, { timestamps: true });

// TTL index for automatic deletion
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OtpToken = mongoose.model('OtpToken', otpSchema);

export default OtpToken;
 
