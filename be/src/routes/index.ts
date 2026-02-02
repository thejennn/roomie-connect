import { Router } from "express";
import authRoutes from "./auth.routes";
import roomsRoutes from "./rooms.routes";
import roommatesRoutes from "./roommates.routes";
import notificationsRoutes from "./notifications.routes";
import walletRoutes from "./wallet.routes";
import chatRoutes from "./chat.routes";

const router = Router();

// Health check
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "roomie-connect-api",
  });
});

// Mount routes
router.use("/auth", authRoutes);
router.use("/rooms", roomsRoutes);
router.use("/roommates", roommatesRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/wallet", walletRoutes);
router.use("/chat", chatRoutes);

export default router;
