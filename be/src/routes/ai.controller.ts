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
// POST /api/ai/chat â€” Main AI Pipeline (State Machine)
//
// Flow:
//  1. Validate input           â†’ VALIDATION (exit)
//  2. Token balance guard      â†’ 402
//  3. Classify intent          â†’ UNKNOWN â†’ CLARIFICATION (exit)
//  4. Route by intent:
//     â”€ FIND_ROOM:
//        a. Resolve location   â†’ OUT_OF_SCOPE (exit)
//        b. Parse budget
//        c. Extract filters
//        d. Query DB           â†’ DB_SUCCESS | DB_EMPTY
//     â”€ FIND_ROOMMATE:
//        a. Check criteria     â†’ CLARIFICATION (exit)
//        b. Resolve location   â†’ OUT_OF_SCOPE (exit)
//        c. Extract criteria (+ merge memory)
//        d. Query DB           â†’ DB_SUCCESS | DB_EMPTY
//     â”€ GENERAL_QA / SMALL_TALK:
//        a. Load memory
//        b. Call LLM           â†’ LLM_SUCCESS
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

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // STEP 1: Input validation â€” fail-fast
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    if (!message || typeof message !== "string" || !message.trim()) {
      sendEarlyExit(res, {
        reply:
          "Báº¡n cĂ³ thá»ƒ nháº­p ná»™i dung cáº§n há»— trá»£ khĂ´ng? " +
          "VĂ­ dá»¥: 'TĂ¬m phĂ²ng á»Ÿ Tháº¡ch HĂ²a dÆ°á»›i 3 triá»‡u' hoáº·c 'TĂ¬m báº¡n ghĂ©p phĂ²ng khu vá»±c TĂ¢n XĂ£'.",
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
        reply: "Tin nháº¯n khĂ´ng há»£p lá»‡. Báº¡n vui lĂ²ng nháº­p láº¡i ná»™i dung cáº§n há»— trá»£ nhĂ©!",
        responseType: ResponseType.VALIDATION,
        userId, message: "", detectedIntent: "UNKNOWN",
        startTime,
      });
      return;
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // STEP 2: Token balance guard
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }
    if (!user.aiTokens || user.aiTokens.tokens <= 0) {
      res.status(402).json({
        success: false,
        error: "Báº¡n Ä‘Ă£ háº¿t KnockCoin. Vui lĂ²ng náº¡p thĂªm Ä‘á»ƒ tiáº¿p tá»¥c.",
      });
      return;
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // STEP 3: Intent classification (Tier 1 rules â†’ Tier 2 mini-LLM)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    detectedIntent = await classifyIntent(sanitized);

    if (detectedIntent === "UNKNOWN") {
      sendEarlyExit(res, {
        reply:
          "Xin lá»—i, mĂ¬nh chÆ°a hiá»ƒu rĂµ yĂªu cáº§u cá»§a báº¡n. " +
          "Báº¡n cĂ³ thá»ƒ mĂ´ táº£ rĂµ hÆ¡n khĂ´ng? VĂ­ dá»¥: 'TĂ¬m phĂ²ng á»Ÿ Tháº¡ch HĂ²a dÆ°á»›i 3 triá»‡u' " +
          "hoáº·c 'TĂ¬m báº¡n ghĂ©p phĂ²ng khu vá»±c TĂ¢n XĂ£'.",
        responseType: ResponseType.CLARIFICATION,
        userId, message: sanitized, detectedIntent,
        tokensRemaining: user.aiTokens.tokens,
        startTime,
      });
      return;
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // STEP 4: Route by intent
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    let reply = "";
    let rooms: IRoom[] = [];
    let roommates: IRoommateProfile[] = [];
    const memoryUpdates: MemoryUpdate = {};

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ FIND_ROOM â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
          "Ráº¥t tiáº¿c, mĂ¬nh khĂ´ng tĂ¬m tháº¥y phĂ²ng nĂ o phĂ¹ há»£p táº¡i " +
          locResult.wards.join(" vĂ  ") +
          " vá»›i yĂªu cáº§u cá»§a báº¡n. Báº¡n thá»­ Ä‘iá»u chá»‰nh ngĂ¢n sĂ¡ch hoáº·c tiĂªu chĂ­ nhĂ©!";
      } else {
        responseType = ResponseType.DB_SUCCESS;
        hasResults = true;
        llmUsed = true;
        reply = await callLocalLLM(buildRoomPrompt(rooms, sanitized));
      }

      // Memory updates for FIND_ROOM
      if (locResult.wards.length === 1) memoryUpdates.location = locResult.wards[0];
      if (filters.maxPrice) memoryUpdates.budget = filters.maxPrice;

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ FIND_ROOMMATE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
          "Ráº¥t tiáº¿c, mĂ¬nh chÆ°a tĂ¬m tháº¥y ai phĂ¹ há»£p táº¡i " +
          locResult.wards.join(" vĂ  ") +
          ". Báº¡n thá»­ Ä‘iá»u chá»‰nh khu vá»±c, ngĂ¢n sĂ¡ch hoáº·c yĂªu cáº§u lá»‘i sá»‘ng nhĂ©!";
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

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ SMALL_TALK â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    } else if (detectedIntent === "SMALL_TALK") {
      // ZERO memory injection â€” prevents context contamination
      // (e.g. "phĂ²ng ngá»§ sá»›m" when user just says "xin chĂ o")
      llmUsed = true;
      reply = await callLocalLLM(buildSmallTalkPrompt(sanitized));
      responseType = reply ? ResponseType.LLM_SUCCESS : ResponseType.SYSTEM_ERROR;
      hasResults = !!reply;

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ GENERAL_QA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // STEP 5: Safeguard â€” empty reply (LLM path failed silently)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    if (!reply) {
      responseType = ResponseType.SYSTEM_ERROR;
      console.error(`[KnockBot] Empty reply â€” userId=${userId} intent=${detectedIntent}`);
      emitLog({
        userId, message: sanitized, detectedIntent,
        llmUsed, hasResults: false, knockCoinCharged: false,
        responseType, success: false, durationMs: Date.now() - startTime,
      });
      res.status(500).json({ success: false, error: "AI khĂ´ng tráº£ lá»i Ä‘Æ°á»£c. Vui lĂ²ng thá»­ láº¡i." });
      return;
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // STEP 6: KnockCoin charge decision (based solely on responseType)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    const charge = shouldChargeToken(responseType);

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // STEP 7: Deduct coin (only after full pipeline success)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    if (charge) {
      user.aiTokens.tokens = Math.max(0, user.aiTokens.tokens - 1);
      await user.save();
      knockCoinCharged = true;
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // STEP 8: Persist AiUsage
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
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

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // STEP 9: Update structured memory (fire-and-forget)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    updateMemory(userId, detectedIntent, memoryUpdates).catch(() => {});

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // STEP 10: Structured log + HTTP response
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
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
    // SYSTEM_ERROR - genuine exception (DB crash, network, unexpected throw)
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[KnockBot] SYSTEM_ERROR userId=${userId}: ${msg}`);

    emitLog({
      userId, message: sanitized, detectedIntent,
      llmUsed, hasResults, knockCoinCharged: false,
      responseType: ResponseType.SYSTEM_ERROR, success: false,
      durationMs: Date.now() - startTime,
    });

    if (msg.includes("ECONNREFUSED") || msg.includes("ENOTFOUND")) {
      res.status(503).json({ success: false, error: "Dá»‹ch vá»¥ AI Ä‘ang offline. Vui lĂ²ng thá»­ láº¡i sau." });
      return;
    }
    if (msg.includes("Missing GEMINI_API_KEY")) {
      res.status(503).json({ success: false, error: "Server chua cau hinh GEMINI_API_KEY (Gemini)." });
      return;
    }
    if (msg.toLowerCase().includes("reported as leaked")) {
      res.status(503).json({ success: false, error: "Gemini API key bi danh dau la leaked. Hay tao key moi va cap nhat env." });
      return;
    }
    if (msg.includes("HTTP") || msg.includes("empty response") || msg.includes("invalid JSON")) {
      res.status(502).json({ success: false, error: "AI khĂ´ng tráº£ lá»i Ä‘Æ°á»£c. Vui lĂ²ng thá»­ láº¡i." });
      return;
    }
    res.status(500).json({ success: false, error: "ÄĂ£ xáº£y ra lá»—i khi xá»­ lĂ½ yĂªu cáº§u. Vui lĂ²ng thá»­ láº¡i." });
  }
}
