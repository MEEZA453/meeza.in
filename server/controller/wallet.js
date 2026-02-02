import WalletTransaction from "../models/wallet.js";
import User from "../models/user.js";

/**
 * GET wallet summary (balance)
 */
export const getWalletBalance = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select("balance");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({
      success: true,
      balance: user.balance || 0,
    });
  } catch (err) {
    console.error("getWalletBalance error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch wallet balance" });
  }
};

/**
 * GET wallet transactions
 */
export const getWalletTransactions = async (req, res) => {
  try {
    const userId = req.user.id;

    const { page = 1, limit = 20 } = req.query;

    const transactions = await WalletTransaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await WalletTransaction.countDocuments({ user: userId });

    return res.json({
      success: true,
      transactions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
      },
    });
  } catch (err) {
    console.error("getWalletTransactions error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch wallet transactions" });
  }
};
