import mongoose from "mongoose";
import CreditTransaction from "../models/credit.js";
import User from "../models/user.js";

export const premiumOrCredits = (cost = 2, reason = "PREMIUM_FEATURE") => {
  return async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await User.findById(req.user.id).session(session);

      if (!user) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // 🟢 Premium user → skip credit deduction
      if (
        user.premium &&
        user.premiumExpiresAt &&
        user.premiumExpiresAt > new Date()
      ) {
        await session.commitTransaction();
        session.endSession();
        return next();
      }

      // 🟡 Credit deduction (atomic check)
      if (user.credits < cost) {
        await session.abortTransaction();
        session.endSession();
        return res.status(403).json({
          success: false,
          message: "Not enough credits",
        });
      }

      user.credits -= cost;
      await user.save({ session });

      await CreditTransaction.create(
        [
          {
            user: user._id,
            type: "DEDUCT",
            amount: cost,
            reason,
            balanceAfter: user.credits,
          },
        ],
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      next();
    } catch (error) {
      await session.abortTransaction();
      session.endSession();

      console.error("Premium/Credit middleware error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };
};
