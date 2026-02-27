import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";
import { User } from "../models/User";
import { Room } from "../models/Room";
import { AiUsage } from "../models/AiUsage";
import { extractSearchFilters, ExtractedFilters } from "../services/ai.service";

/**
 * AI Chat Routes
 *
 * POST /api/ai/chat          — Smart search: extract filters → query rooms → reply
 * GET  /api/ai/history       — Retrieve the user's AI chat history
 * GET  /api/ai/tokens        — Get the user's remaining AI token balance
 *
 * All routes require JWT authentication.
 */

const router = Router();

// ---------------------------------------------------------------------------
// Helper: Build a dynamic MongoDB filter from extracted AI filters
// ---------------------------------------------------------------------------
function buildRoomQuery(filters: ExtractedFilters): Record<string, any> {
  const query: Record<string, any> = { status: "active" };

  // Price filter: rooms cheaper than or equal to max_price
  if (filters.max_price) {
    query.price = { $lte: filters.max_price };
  }

  // District filter: case-insensitive partial match
  if (filters.district) {
    query.district = { $regex: filters.district, $options: "i" };
  }

  // Amenities filter: each amenity is a boolean field on Room
  if (filters.amenities && filters.amenities.length > 0) {
    for (const amenity of filters.amenities) {
      // Only add valid amenity field names to prevent injection
      const validFields = [
        "hasAirConditioner", "hasBed", "hasWardrobe", "hasWaterHeater",
        "hasKitchen", "hasFridge", "hasPrivateWashing", "hasSharedWashing",
        "hasParking", "hasElevator", "hasSecurityCamera", "hasFireSafety",
        "hasPetFriendly", "hasDryingArea", "hasSharedOwner", "isFullyFurnished",
      ];
      if (validFields.includes(amenity)) {
        query[amenity] = true;
      }
    }
  }

  return query;
}

// ---------------------------------------------------------------------------
// POST /api/ai/chat — Smart AI search with filter extraction
// ---------------------------------------------------------------------------
router.post("/chat", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { message } = req.body;

    // --- Input validation ---
    if (!message || typeof message !== "string" || !message.trim()) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    // Sanitize input — strip HTML tags to prevent injection
    const sanitizedMessage = message
      .replace(/<[^>]*>/g, "")
      .trim()
      .slice(0, 2000);

    // --- Check AI token balance ---
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (!user.aiTokens || user.aiTokens.tokens <= 0) {
      res.status(402).json({
        error: "AI usage requires payment. You have no AI tokens remaining.",
        tokensRemaining: 0,
      });
      return;
    }

    // --- Step 1: Extract filters from user message via AI ---
    const filters = await extractSearchFilters(sanitizedMessage);
    console.log("🔍 Extracted filters:", JSON.stringify(filters));

    // --- Step 2: Query rooms if intent is search_room ---
    let rooms: any[] = [];
    if (filters.intent === "search_room") {
      const query = buildRoomQuery(filters);
      console.log("📦 MongoDB query:", JSON.stringify(query));

      rooms = await Room.find(query)
        .populate("landlordId", "fullName phone avatarUrl isVerified")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      console.log(`✅ Found ${rooms.length} matching rooms`);
    }

    // --- Deduct 1 AI token ---
    user.aiTokens.tokens = Math.max(0, user.aiTokens.tokens - 1);
    await user.save();

    // --- Log usage to database ---
    await AiUsage.create({
      userId,
      prompt: sanitizedMessage,
      response: filters.reply,
      tokensUsed: 1,
    });

    // --- Build response ---
    let reply = filters.reply;

    // Enhance reply with room count if rooms were found
    if (filters.intent === "search_room") {
      if (rooms.length > 0) {
        reply += `\n\nTìm thấy **${rooms.length} phòng** phù hợp với yêu cầu của bạn:`;
      } else {
        reply += "\n\nRất tiếc, mình không tìm thấy phòng nào phù hợp. Bạn thử điều chỉnh yêu cầu nhé!";
      }
    }

    // --- Return structured response ---
    res.json({
      reply,
      filters: {
        intent: filters.intent,
        max_price: filters.max_price,
        district: filters.district,
        amenities: filters.amenities,
      },
      results: rooms,
      tokensRemaining: user.aiTokens.tokens,
    });
  } catch (error: any) {
    console.error("AI Chat error:", error?.message || error);

    // --- Graceful fallback for different error types ---
    if (error.message?.includes("API key") || error.message?.includes("API_KEY")) {
      res.status(500).json({
        error: "AI service configuration error. Please contact support.",
        reply: "Xin lỗi, hệ thống AI đang gặp sự cố. Vui lòng liên hệ quản trị viên.",
        results: [],
      });
      return;
    }

    if (error.message?.includes("429") || error.message?.includes("quota")) {
      res.status(429).json({
        error: "AI đang quá tải. Vui lòng thử lại sau vài phút.",
        reply: "AI đang quá tải. Vui lòng thử lại sau vài phút.",
        results: [],
      });
      return;
    }

    // Fallback message
    res.status(500).json({
      error: "Xin lỗi, mình chưa hiểu rõ yêu cầu của bạn.",
      reply: "Xin lỗi, mình chưa hiểu rõ yêu cầu của bạn. Vui lòng thử lại.",
      results: [],
    });
  }
});

// ---------------------------------------------------------------------------
// GET /api/ai/history — Retrieve the user's AI chat history
// ---------------------------------------------------------------------------
router.get("/history", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    const history = await AiUsage.find({ userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await AiUsage.countDocuments({ userId });

    res.json({
      history,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("AI history error:", error);
    res.status(500).json({ error: "Failed to retrieve chat history" });
  }
});

// ---------------------------------------------------------------------------
// GET /api/ai/tokens — Get the user's remaining AI token balance
// ---------------------------------------------------------------------------
router.get("/tokens", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const user = await User.findById(userId).select("aiTokens");

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      tokens: user.aiTokens?.tokens ?? 0,
      maxTokens: user.aiTokens?.maxTokens ?? 100,
    });
  } catch (error) {
    console.error("AI tokens error:", error);
    res.status(500).json({ error: "Failed to retrieve token balance" });
  }
});

export default router;
