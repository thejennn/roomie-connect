import { Router, Response } from "express";
import { Notification } from "../models";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";

const router = Router();

// GET /api/notifications - Get user's notifications
router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;

    const query: Record<string, any> = { userId: req.userId };
    if (unreadOnly === "true") query.isRead = false;

    const skip = (Number(page) - 1) * Number(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Notification.countDocuments(query),
      Notification.countDocuments({ userId: req.userId, isRead: false }),
    ]);

    res.json({
      notifications,
      unreadCount,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ error: "Failed to get notifications" });
  }
});

// PUT /api/notifications/:id/read - Mark as read
router.put(
  "/:id/read",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        { $set: { isRead: true } },
        { new: true },
      );

      if (!notification) {
        res.status(404).json({ error: "Notification not found" });
        return;
      }

      res.json({ message: "Marked as read", notification });
    } catch (error) {
      console.error("Mark read error:", error);
      res.status(500).json({ error: "Failed to mark as read" });
    }
  },
);

// PUT /api/notifications/read-all - Mark all as read
router.put(
  "/read-all",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      await Notification.updateMany(
        { userId: req.userId, isRead: false },
        { $set: { isRead: true } },
      );

      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Mark all read error:", error);
      res.status(500).json({ error: "Failed to mark all as read" });
    }
  },
);

// DELETE /api/notifications/:id - Delete notification
router.delete(
  "/:id",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await Notification.findOneAndDelete({
        _id: req.params.id,
        userId: req.userId,
      });

      if (!result) {
        res.status(404).json({ error: "Notification not found" });
        return;
      }

      res.json({ message: "Notification deleted" });
    } catch (error) {
      console.error("Delete notification error:", error);
      res.status(500).json({ error: "Failed to delete notification" });
    }
  },
);

export default router;
