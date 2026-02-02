import { Router, Response } from "express";
import { User, Room, Wallet, Notification } from "../models";
import {
  authMiddleware,
  adminOnly,
  AuthRequest,
} from "../middleware/auth.middleware";

const router = Router();

// GET /api/admin/stats - Get admin dashboard statistics
router.get(
  "/stats",
  authMiddleware,
  adminOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const [
        totalUsers,
        totalLandlords,
        totalTenants,
        totalRooms,
        activeRooms,
        pendingRooms,
        rejectedRooms,
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: "landlord" }),
        User.countDocuments({ role: "tenant" }),
        Room.countDocuments(),
        Room.countDocuments({ status: "active" }),
        Room.countDocuments({ status: "pending" }),
        Room.countDocuments({ status: "rejected" }),
      ]);

      // Calculate total revenue (sum of all wallet balances)
      const wallets = await Wallet.find();
      const totalRevenue = wallets.reduce((sum, w) => sum + w.balance, 0);

      // Get monthly data (mock for now - in production, you'd query by date ranges)
      const revenueMonthly = [
        { month: "Jan", revenue: 12000000 },
        { month: "Feb", revenue: 15000000 },
        { month: "Mar", revenue: 9000000 },
        { month: "Apr", revenue: 18000000 },
        { month: "May", revenue: 21000000 },
        { month: "Jun", revenue: 15000000 },
      ];

      const userGrowth = [
        { month: "Jan", landlords: 5, tenants: 20 },
        { month: "Feb", landlords: 8, tenants: 30 },
        { month: "Mar", landlords: 4, tenants: 18 },
        { month: "Apr", landlords: 10, tenants: 25 },
        { month: "May", landlords: 12, tenants: 40 },
        { month: "Jun", landlords: 9, tenants: 28 },
      ];

      // Get recent activities
      const recentNotifications = await Notification.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("userId", "fullName");

      const recentActivity = recentNotifications.map((n) => n.message);

      res.json({
        totals: {
          revenue: totalRevenue,
          users: totalUsers,
          newRooms: pendingRooms,
          closeRate: activeRooms / (totalRooms || 1),
        },
        revenueMonthly,
        userGrowth,
        recentActivity,
        stats: {
          landlords: totalLandlords,
          tenants: totalTenants,
          activeRooms,
          pendingRooms,
          rejectedRooms,
        },
      });
    } catch (error) {
      console.error("Get admin stats error:", error);
      res.status(500).json({ error: "Failed to get admin statistics" });
    }
  }
);

// GET /api/admin/rooms - Get all rooms for admin (with filters)
router.get(
  "/rooms",
  authMiddleware,
  adminOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;

      const query: Record<string, any> = {};
      if (status) query.status = status;

      const skip = (Number(page) - 1) * Number(limit);

      const [rooms, total] = await Promise.all([
        Room.find(query)
          .populate("landlordId", "fullName phone email")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        Room.countDocuments(query),
      ]);

      res.json({
        rooms,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error("Get admin rooms error:", error);
      res.status(500).json({ error: "Failed to get rooms" });
    }
  }
);

// PUT /api/admin/rooms/:id/approve - Approve a room
router.put(
  "/rooms/:id/approve",
  authMiddleware,
  adminOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const room = await Room.findByIdAndUpdate(
        req.params.id,
        { status: "active" },
        { new: true }
      ).populate("landlordId", "fullName");

      if (!room) {
        res.status(404).json({ error: "Room not found" });
        return;
      }

      // Create notification for landlord
      await Notification.create({
        userId: room.landlordId,
        title: "Tin đăng đã được duyệt",
        message: `Tin "${room.title}" đã được admin phê duyệt`,
        type: "room_approved",
      });

      res.json({ message: "Room approved", room });
    } catch (error) {
      console.error("Approve room error:", error);
      res.status(500).json({ error: "Failed to approve room" });
    }
  }
);

// PUT /api/admin/rooms/:id/reject - Reject a room
router.put(
  "/rooms/:id/reject",
  authMiddleware,
  adminOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const { reason } = req.body;

      const room = await Room.findByIdAndUpdate(
        req.params.id,
        { status: "rejected", rejectionReason: reason },
        { new: true }
      ).populate("landlordId", "fullName");

      if (!room) {
        res.status(404).json({ error: "Room not found" });
        return;
      }

      // Create notification for landlord
      await Notification.create({
        userId: room.landlordId,
        title: "Tin đăng bị từ chối",
        message: `Tin "${room.title}" bị từ chối: ${reason || "Không rõ lý do"}`,
        type: "room_rejected",
      });

      res.json({ message: "Room rejected", room });
    } catch (error) {
      console.error("Reject room error:", error);
      res.status(500).json({ error: "Failed to reject room" });
    }
  }
);

// GET /api/admin/users - Get all users
router.get(
  "/users",
  authMiddleware,
  adminOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const { role, status, page = 1, limit = 20 } = req.query;

      const query: Record<string, any> = {};
      if (role) query.role = role;
      if (status === "banned") query.isBanned = true;
      if (status === "active") query.isBanned = { $ne: true };

      const skip = (Number(page) - 1) * Number(limit);

      const [users, total] = await Promise.all([
        User.find(query)
          .select("-password")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        User.countDocuments(query),
      ]);

      // Get wallet info for each user
      const usersWithWallets = await Promise.all(
        users.map(async (user) => {
          const wallet = await Wallet.findOne({ userId: user._id });
          return {
            ...user.toObject(),
            wallet: wallet?.balance || 0,
          };
        })
      );

      res.json({
        users: usersWithWallets,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error("Get admin users error:", error);
      res.status(500).json({ error: "Failed to get users" });
    }
  }
);

// PUT /api/admin/users/:id/ban - Ban a user
router.put(
  "/users/:id/ban",
  authMiddleware,
  adminOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { isBanned: true },
        { new: true }
      ).select("-password");

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json({ message: "User banned", user });
    } catch (error) {
      console.error("Ban user error:", error);
      res.status(500).json({ error: "Failed to ban user" });
    }
  }
);

// PUT /api/admin/users/:id/unban - Unban a user
router.put(
  "/users/:id/unban",
  authMiddleware,
  adminOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { isBanned: false },
        { new: true }
      ).select("-password");

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json({ message: "User unbanned", user });
    } catch (error) {
      console.error("Unban user error:", error);
      res.status(500).json({ error: "Failed to unban user" });
    }
  }
);

export default router;
