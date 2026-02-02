import { Router, Response } from "express";
import { ChatMessage, User } from "../models";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";

const router = Router();

// GET /api/chat - Get user's chat history
router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 50 } = req.query;

    const messages = await ChatMessage.find({ userId: req.userId })
      .sort({ createdAt: 1 })
      .limit(Number(limit));

    res.json({ messages });
  } catch (error) {
    console.error("Get chat error:", error);
    res.status(500).json({ error: "Failed to get chat history" });
  }
});

// POST /api/chat - Add message to chat
router.post("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { role, content } = req.body;

    if (!role || !content) {
      res.status(400).json({ error: "Role and content are required" });
      return;
    }

    if (!["user", "assistant", "system"].includes(role)) {
      res.status(400).json({ error: "Invalid role" });
      return;
    }

    const message = new ChatMessage({
      userId: req.userId,
      role,
      content,
    });

    await message.save();

    // Deduct token if user message (simplified token system)
    if (role === "user") {
      await User.findByIdAndUpdate(req.userId, {
        $inc: { "aiTokens.tokens": -1 },
      });
    }

    res.status(201).json({ message });
  } catch (error) {
    console.error("Add message error:", error);
    res.status(500).json({ error: "Failed to add message" });
  }
});

// DELETE /api/chat - Clear chat history
router.delete("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await ChatMessage.deleteMany({ userId: req.userId });

    res.json({ message: "Chat history cleared" });
  } catch (error) {
    console.error("Clear chat error:", error);
    res.status(500).json({ error: "Failed to clear chat history" });
  }
});

export default router;
