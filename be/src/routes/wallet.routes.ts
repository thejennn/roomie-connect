import { Router, Response } from "express";
import { Wallet } from "../models";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";

const router = Router();

// GET /api/wallet - Get user's wallet
router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    let wallet = await Wallet.findOne({ userId: req.userId });

    if (!wallet) {
      wallet = new Wallet({ userId: req.userId, balance: 0, transactions: [] });
      await wallet.save();
    }

    res.json({
      balance: wallet.balance,
      recentTransactions: wallet.transactions.slice(-10).reverse(),
    });
  } catch (error) {
    console.error("Get wallet error:", error);
    res.status(500).json({ error: "Failed to get wallet" });
  }
});

// GET /api/wallet/transactions - Get all transactions
router.get(
  "/transactions",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const wallet = await Wallet.findOne({ userId: req.userId });

      if (!wallet) {
        res.json({
          transactions: [],
          pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
        });
        return;
      }

      const total = wallet.transactions.length;
      const skip = (Number(page) - 1) * Number(limit);
      const transactions = wallet.transactions
        .slice()
        .reverse()
        .slice(skip, skip + Number(limit));

      res.json({
        transactions,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error("Get transactions error:", error);
      res.status(500).json({ error: "Failed to get transactions" });
    }
  },
);

// POST /api/wallet/topup - Add funds (simplified, no real payment)
router.post(
  "/topup",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        res.status(400).json({ error: "Invalid amount" });
        return;
      }

      const wallet = await Wallet.findOneAndUpdate(
        { userId: req.userId },
        {
          $inc: { balance: amount },
          $push: {
            transactions: {
              type: "topup",
              amount,
              description: `Nạp ${amount.toLocaleString("vi-VN")}đ vào ví`,
              createdAt: new Date(),
            },
          },
        },
        { new: true, upsert: true },
      );

      res.json({
        message: "Top-up successful",
        balance: wallet.balance,
      });
    } catch (error) {
      console.error("Top-up error:", error);
      res.status(500).json({ error: "Failed to top-up" });
    }
  },
);

export default router;
