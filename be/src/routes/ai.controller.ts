import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { User } from "../models/User";
import { AiUsage } from "../models/AiUsage";
import { IRoom } from "../models/Room";
import { IRoommateProfile } from "../models/RoommateProfile";
import {
  extractRoomFilters,
  queryRooms,
  queryRoommates,
  callLocalLLM,
} from "../services/ai.service";
import {
  buildRoomPrompt,
  buildRoommatePrompt,
  buildSmallTalkPrompt,
  buildGeneralQAPrompt,
} from "../services/prompt.factory";
import { classifyIntent, Intent } from "../services/intent.service";
import { resolveSupportedLocations, ALL_WARDS_REGEX } from "../services/location.resolver";
import { loadMemory, loadRoommateMemory, updateMemory, MemoryUpdate } from "../services/memory.service";
import { shouldChargeToken } from "../services/token.service";
import { ResponseType } from "../services/response.types";
import {
  hasSufficientCriteria,
  extractRoommateCriteria,
  CLARIFICATION_REPLY,
} from "../services/roommate.extractor";

// ---------------------------------------------------------------------------
// Structured log
// ---------------------------------------------------------------------------
interface AIChatLog {
  userId: string;
  message: string;
  detectedIntent: Intent;
  llmUsed: boolean;
  hasResults: boolean;
  knockCoinCharged: boolean;
  responseType: ResponseType;
  success: boolean;
  durationMs: number;
}

function emitLog(log: AIChatLog): void {
  console.log(`[KnockBot] ${JSON.stringify(log)}`);
}

// ---------------------------------------------------------------------------
// Helper: send a terminal response (VALIDATION / OUT_OF_SCOPE / CLARIFICATION)
// ---------------------------------------------------------------------------
function sendEarlyExit(
  res: Response,
  opts: {
    reply: string;
    responseType: ResponseType;
    userId: string;
    message: string;
    detectedIntent: Intent;
    tokensRemaining?: number;
    startTime: number;
  },
): void {
  emitLog({
    userId: opts.userId,
    message: opts.message,
    detectedIntent: opts.detectedIntent,
    llmUsed: false,
    hasResults: false,
    knockCoinCharged: false,
    responseType: opts.responseType,
    success: true,
    durationMs: Date.now() - opts.startTime,
  });
  res.json({
    success: true,
    data: opts.reply,
    rooms: [],
    roommates: [],
    responseType: opts.responseType,
    tokensRemaining: opts.tokensRemaining,
  });
}

// ---------------------------------------------------------------------------
// POST /api/ai/chat — Main AI Pipeline (State Machine)
//
// Flow:
//  1. Validate input           → VALIDATION (exit)
//  2. Token balance guard      → 402
//  3. Classify intent          → UNKNOWN → CLARIFICATION (exit)
//  4. Route by intent:
//     ─ FIND_ROOM:
//        a. Resolve location   → OUT_OF_SCOPE (exit)
//        b. Parse budget
//        c. Extract filters
//        d. Query DB           → DB_SUCCESS | DB_EMPTY
//     ─ FIND_ROOMMATE:
//        a. Check criteria     → CLARIFICATION (exit)
//        b. Resolve location   → OUT_OF_SCOPE (exit)
//        c. Extract criteria (+ merge memory)
//        d. Query DB           → DB_SUCCESS | DB_EMPTY
//     ─ GENERAL_QA / SMALL_TALK:
//        a. Load memory
//        b. Call LLM           → LLM_SUCCESS
//  5. Optional LLM for natural language
//  6. Determine responseType
//  7. shouldChargeToken(responseType)
//  8. Deduct coin if charged
//  9. Persist AiUsage
// 10. Update memory (fire-and-forget)
// 11. Respond
// ---------------------------------------------------------------------------
export async function handleChat(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  const startTime = Date.now();
  const userId = req.userId!;

  // Pipeline state
  let detectedIntent: Intent = "UNKNOWN";
  let llmUsed = false;
  let hasResults = false;
  let knockCoinCharged = false;
  let responseType: ResponseType = ResponseType.SYSTEM_ERROR; // safe default
  let sanitized = "";

  try {
    const { message } = req.body ?? {};

    // ══════════════════════════════════════════════════════════════════════
    // STEP 1: Input validation — fail-fast
    // ══════════════════════════════════════════════════════════════════════
    if (!message || typeof message !== "string" || !message.trim()) {
      sendEarlyExit(res, {
        reply:
          "Bạn có thể nhập nội dung cần hỗ trợ không? " +
          "Ví dụ: 'Tìm phòng ở Thạch Hòa dưới 3 triệu' hoặc 'Tìm bạn ghép phòng khu vực Tân Xã'.",
        responseType: ResponseType.VALIDATION,
        userId, message: "", detectedIntent: "UNKNOWN",
        startTime,
      });
      return;
    }

    // Strip HTML/script tags (prompt-injection / log-injection prevention)
    sanitized = message.replace(/<[^>]*>/g, "").trim().slice(0, 2000);
    if (!sanitized) {
      sendEarlyExit(res, {
        reply: "Tin nhắn không hợp lệ. Bạn vui lòng nhập lại nội dung cần hỗ trợ nhé!",
        responseType: ResponseType.VALIDATION,
        userId, message: "", detectedIntent: "UNKNOWN",
        startTime,
      });
      return;
    }

    // ══════════════════════════════════════════════════════════════════════
    // STEP 2: Token balance guard
    // ══════════════════════════════════════════════════════════════════════
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }
    if (!user.aiTokens || user.aiTokens.tokens <= 0) {
      res.status(402).json({
        success: false,
        error: "Bạn đã hết KnockCoin. Vui lòng nạp thêm để tiếp tục.",
      });
      return;
    }

    // ══════════════════════════════════════════════════════════════════════
    // STEP 3: Intent classification (Tier 1 rules → Tier 2 mini-LLM)
    // ══════════════════════════════════════════════════════════════════════
    detectedIntent = await classifyIntent(sanitized);

    if (detectedIntent === "UNKNOWN") {
      sendEarlyExit(res, {
        reply:
          "Xin lỗi, mình chưa hiểu rõ yêu cầu của bạn. " +
          "Bạn có thể mô tả rõ hơn không? Ví dụ: 'Tìm phòng ở Thạch Hòa dưới 3 triệu' " +
          "hoặc 'Tìm bạn ghép phòng khu vực Tân Xã'.",
        responseType: ResponseType.CLARIFICATION,
        userId, message: sanitized, detectedIntent,
        tokensRemaining: user.aiTokens.tokens,
        startTime,
      });
      return;
    }

    // ══════════════════════════════════════════════════════════════════════
    // STEP 4: Route by intent
    // ══════════════════════════════════════════════════════════════════════
    let reply = "";
    let rooms: IRoom[] = [];
    let roommates: IRoommateProfile[] = [];
    const memoryUpdates: MemoryUpdate = {};

    // ────────────────────────── FIND_ROOM ──────────────────────────────
    if (detectedIntent === "FIND_ROOM") {
      // 4a. Resolve location
      const locResult = resolveSupportedLocations(sanitized);
      if (!locResult.supported) {
        sendEarlyExit(res, {
          reply: locResult.reason,
          responseType: ResponseType.OUT_OF_SCOPE,
          userId, message: sanitized, detectedIntent,
          tokensRemaining: user.aiTokens.tokens,
          startTime,
        });
        return;
      }

      // 4b-c. Extract filters (budget parsed inside, location regex injected)
      const filters = extractRoomFilters(sanitized, locResult.regexFilter);

      // 4d. Query DB
      rooms = await queryRooms(filters);

      if (rooms.length === 0) {
        responseType = ResponseType.DB_EMPTY;
        reply =
          "Rất tiếc, mình không tìm thấy phòng nào phù hợp tại " +
          locResult.wards.join(" và ") +
          " với yêu cầu của bạn. Bạn thử điều chỉnh ngân sách hoặc tiêu chí nhé!";
      } else {
        responseType = ResponseType.DB_SUCCESS;
        hasResults = true;
        llmUsed = true;
        reply = await callLocalLLM(buildRoomPrompt(rooms, sanitized));
      }

      // Memory updates for FIND_ROOM
      if (locResult.wards.length === 1) memoryUpdates.location = locResult.wards[0];
      if (filters.maxPrice) memoryUpdates.budget = filters.maxPrice;

    // ────────────────────────── FIND_ROOMMATE ─────────────────────────
    } else if (detectedIntent === "FIND_ROOMMATE") {
      // 4a. Check if user provided sufficient criteria
      if (!hasSufficientCriteria(sanitized)) {
        sendEarlyExit(res, {
          reply: CLARIFICATION_REPLY,
          responseType: ResponseType.CLARIFICATION,
          userId, message: sanitized, detectedIntent,
          tokensRemaining: user.aiTokens.tokens,
          startTime,
        });
        return;
      }

      // 4b. Resolve location
      const locResult = resolveSupportedLocations(sanitized);
      if (!locResult.supported) {
        sendEarlyExit(res, {
          reply: locResult.reason,
          responseType: ResponseType.OUT_OF_SCOPE,
          userId, message: sanitized, detectedIntent,
          tokensRemaining: user.aiTokens.tokens,
          startTime,
        });
        return;
      }

      // 4c. Extract criteria + merge stored memory
      const storedPrefs = await loadRoommateMemory(userId);
      const criteria = extractRoommateCriteria(sanitized, storedPrefs);

      // 4d. Query DB
      roommates = await queryRoommates(criteria);

      if (roommates.length === 0) {
        responseType = ResponseType.DB_EMPTY;
        reply =
          "Rất tiếc, mình chưa tìm thấy ai phù hợp tại " +
          locResult.wards.join(" và ") +
          ". Bạn thử điều chỉnh khu vực, ngân sách hoặc yêu cầu lối sống nhé!";
      } else {
        responseType = ResponseType.DB_SUCCESS;
        hasResults = true;
        llmUsed = true;
        reply = await callLocalLLM(buildRoommatePrompt(roommates, sanitized));
      }

      // Memory updates for FIND_ROOMMATE
      if (criteria.district) memoryUpdates.location = criteria.district;
      if (criteria.maxBudget) memoryUpdates.budget = criteria.maxBudget;
      if (criteria.genderPreference) memoryUpdates.genderPreference = criteria.genderPreference;
      memoryUpdates.roommatePreferences = {};
      if (criteria.smoking) {
        memoryUpdates.roommatePreferences.smoking =
          criteria.smoking.includes("no_smoke_ok") ? "no" : "yes";
      }
      if (criteria.sleepTime) {
        memoryUpdates.roommatePreferences.sleepHabit = criteria.sleepTime;
      }
      if (criteria.genderPreference) {
        memoryUpdates.roommatePreferences.gender = criteria.genderPreference;
      }

    // ────────────────────────── SMALL_TALK ──────────────────────────
    } else if (detectedIntent === "SMALL_TALK") {
      // ZERO memory injection — prevents context contamination
      // (e.g. "phòng ngủ sớm" when user just says "xin chào")
      llmUsed = true;
      reply = await callLocalLLM(buildSmallTalkPrompt(sanitized));
      responseType = reply ? ResponseType.LLM_SUCCESS : ResponseType.SYSTEM_ERROR;
      hasResults = !!reply;

    // ────────────────────────── GENERAL_QA ─────────────────────────
    } else {
      // Minimal memory: location + budget ONLY (no roommate preferences)
      const memory = await loadMemory(userId);
      const scopedMemory = memory
        ? { location: memory.location, budget: memory.budget }
        : null;
      llmUsed = true;
      reply = await callLocalLLM(buildGeneralQAPrompt(sanitized, scopedMemory));
      responseType = reply ? ResponseType.LLM_SUCCESS : ResponseType.SYSTEM_ERROR;
      hasResults = !!reply;
    }

    // ══════════════════════════════════════════════════════════════════════
    // STEP 5: Safeguard — empty reply (LLM path failed silently)
    // ══════════════════════════════════════════════════════════════════════
    if (!reply) {
      responseType = ResponseType.SYSTEM_ERROR;
      console.error(`[KnockBot] Empty reply — userId=${userId} intent=${detectedIntent}`);
      emitLog({
        userId, message: sanitized, detectedIntent,
        llmUsed, hasResults: false, knockCoinCharged: false,
        responseType, success: false, durationMs: Date.now() - startTime,
      });
      res.status(500).json({ success: false, error: "AI không trả lời được. Vui lòng thử lại." });
      return;
    }

    // ══════════════════════════════════════════════════════════════════════
    // STEP 6: KnockCoin charge decision (based solely on responseType)
    // ══════════════════════════════════════════════════════════════════════
    const charge = shouldChargeToken(responseType);

    // ══════════════════════════════════════════════════════════════════════
    // STEP 7: Deduct coin (only after full pipeline success)
    // ══════════════════════════════════════════════════════════════════════
    if (charge) {
      user.aiTokens.tokens = Math.max(0, user.aiTokens.tokens - 1);
      await user.save();
      knockCoinCharged = true;
    }

    // ══════════════════════════════════════════════════════════════════════
    // STEP 8: Persist AiUsage
    // ══════════════════════════════════════════════════════════════════════
    await AiUsage.create({
      userId,
      prompt: sanitized,
      response: reply,
      tokensUsed: charge ? 1 : 0,
      intent: detectedIntent,
      llmUsed,
      responseType,
      roomResults: rooms.length > 0 ? rooms : undefined,
      roommateResults: roommates.length > 0 ? roommates : undefined,
    });

    // ══════════════════════════════════════════════════════════════════════
    // STEP 9: Update structured memory (fire-and-forget)
    // ══════════════════════════════════════════════════════════════════════
    updateMemory(userId, detectedIntent, memoryUpdates).catch(() => {});

    // ══════════════════════════════════════════════════════════════════════
    // STEP 10: Structured log + HTTP response
    // ══════════════════════════════════════════════════════════════════════
    emitLog({
      userId, message: sanitized, detectedIntent,
      llmUsed, hasResults, knockCoinCharged,
      responseType, success: true, durationMs: Date.now() - startTime,
    });

    res.json({
      success: true,
      data: reply,
      rooms,
      roommates,
      responseType,
      tokensRemaining: user.aiTokens.tokens,
    });

  } catch (error: unknown) {
    // ══════════════════════════════════════════════════════════════════════
    // SYSTEM_ERROR — genuine exception (DB crash, network, unexpected throw)
    // ══════════════════════════════════════════════════════════════════════
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[KnockBot] SYSTEM_ERROR userId=${userId}: ${msg}`);

    emitLog({
      userId, message: sanitized, detectedIntent,
      llmUsed, hasResults, knockCoinCharged: false,
      responseType: ResponseType.SYSTEM_ERROR, success: false,
      durationMs: Date.now() - startTime,
    });

    if (msg.includes("ECONNREFUSED") || msg.includes("ENOTFOUND")) {
      res.status(503).json({ success: false, error: "Dịch vụ AI đang offline. Vui lòng thử lại sau." });
      return;
    }
    if (msg.includes("HTTP") || msg.includes("empty response") || msg.includes("invalid JSON")) {
      res.status(502).json({ success: false, error: "AI không trả lời được. Vui lòng thử lại." });
      return;
    }
    res.status(500).json({ success: false, error: "Đã xảy ra lỗi khi xử lý yêu cầu. Vui lòng thử lại." });
  }
}
