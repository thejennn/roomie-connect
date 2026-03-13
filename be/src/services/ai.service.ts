import http from "http";
import https from "https";
import { Room, IRoom } from "../models/Room";
import { RoommateProfile, IRoommateProfile } from "../models/RoommateProfile";
import { parseBudget } from "./budget.parser";
import type { RoommateCriteria } from "./roommate.extractor";

// ---------------------------------------------------------------------------
// Re-export prompt builders from PromptFactory for backward compatibility
// ---------------------------------------------------------------------------
export {
  buildRoomPrompt,
  buildRoommatePrompt,
  buildSmallTalkPrompt,
  buildGeneralQAPrompt,
} from "./prompt.factory";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Structured filters for FIND_ROOM queries. */
export interface RoomSearchFilters {
  maxPrice: number | null;
  maxArea: number | null;
  amenities: string[];
  /** MongoDB regex fragment for location scope (from location resolver). */
  locationRegex: string;
}

// ---------------------------------------------------------------------------
// Room Filter Extraction â€” regex + keyword matching (zero LLM cost)
// ---------------------------------------------------------------------------

/**
 * Area filter: "30m2", "30 mÂ²", "dÆ°á»›i 30m"
 * Treated as an upper bound on room area.
 */
const AREA_REGEX = /(\d+)\s*m(?:2|Â²|\s)/i;

/**
 * Amenity keyword â†’ Mongoose boolean field name mapping.
 */
const AMENITY_MAP: { pattern: RegExp; field: string }[] = [
  { pattern: /mĂ¡y láº¡nh|Ä‘iá»u hĂ²a/i, field: "hasAirConditioner" },
  { pattern: /giÆ°á»ng/i, field: "hasBed" },
  { pattern: /tá»§ quáº§n|tá»§ Ä‘á»“/i, field: "hasWardrobe" },
  { pattern: /nĂ³ng láº¡nh|bĂ¬nh nÆ°á»›c nĂ³ng|mĂ¡y nÆ°á»›c nĂ³ng/i, field: "hasWaterHeater" },
  { pattern: /báº¿p|nhĂ  báº¿p/i, field: "hasKitchen" },
  { pattern: /tá»§ láº¡nh/i, field: "hasFridge" },
  { pattern: /mĂ¡y giáº·t riĂªng/i, field: "hasPrivateWashing" },
  { pattern: /mĂ¡y giáº·t chung/i, field: "hasSharedWashing" },
  { pattern: /chá»— Ä‘á»ƒ xe|bĂ£i Ä‘á»— xe|gá»­i xe/i, field: "hasParking" },
  { pattern: /thang mĂ¡y/i, field: "hasElevator" },
  { pattern: /camera/i, field: "hasSecurityCamera" },
  { pattern: /phĂ²ng chĂ¡y|chá»¯a chĂ¡y/i, field: "hasFireSafety" },
  { pattern: /thĂº cÆ°ng|pet/i, field: "hasPetFriendly" },
  { pattern: /sĂ¢n phÆ¡i/i, field: "hasDryingArea" },
  { pattern: /ná»™i tháº¥t|full ná»™i tháº¥t|Ä‘áº§y Ä‘á»§ ná»™i tháº¥t/i, field: "isFullyFurnished" },
];

/**
 * Extract structured room-search filters from a Vietnamese user message.
 * Location is NOT extracted here â€” handled by location.resolver.ts.
 * Budget is delegated to budget.parser.ts.
 *
 * @param message â€” sanitised user message.
 * @param locationRegex â€” pre-resolved MongoDB regex from location resolver.
 */
export function extractRoomFilters(
  message: string,
  locationRegex: string,
): RoomSearchFilters {
  const maxPrice = parseBudget(message);

  let maxArea: number | null = null;
  const am = message.match(AREA_REGEX);
  if (am) maxArea = parseInt(am[1], 10);

  const amenities: string[] = [];
  for (const { pattern, field } of AMENITY_MAP) {
    if (pattern.test(message)) amenities.push(field);
  }

  return { maxPrice, maxArea, amenities, locationRegex };
}

// ---------------------------------------------------------------------------
// MongoDB Query
// ---------------------------------------------------------------------------

/**
 * Query active rooms from MongoDB using the extracted filters.
 * Hard cap of 5 results keeps the LLM prompt small and focused.
 *
 * Location scoping is determined by the pre-resolved locationRegex
 * from the location resolver â€” no inline location logic here.
 */
export async function queryRooms(
  filters: RoomSearchFilters,
  limit = 5,
): Promise<IRoom[]> {
  const query: Record<string, unknown> = { status: "active" };

  if (filters.maxPrice !== null) {
    query.price = { $lte: filters.maxPrice };
  }
  if (filters.maxArea !== null) {
    query.area = { $lte: filters.maxArea };
  }
  for (const field of filters.amenities) {
    query[field] = true;
  }

  // Location scope â€” always enforced via resolved regex
  query.$and = [
    {
      $or: [
        { address: { $regex: filters.locationRegex, $options: "i" } },
        { district: { $regex: filters.locationRegex, $options: "i" } },
      ],
    },
  ];

  return Room.find(query)
    .select("title price address district area capacity images")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean<IRoom[]>();
}

// ---------------------------------------------------------------------------
// Roommate DB Query
// ---------------------------------------------------------------------------

// Roommate filter extraction is now in roommate.extractor.ts.
// Re-export the type for backward compatibility.
export type { RoommateCriteria as RoommateFilters } from "./roommate.extractor";

/**
 * Query roommate profiles from MongoDB using extracted criteria.
 */
export async function queryRoommates(
  filters: RoommateCriteria,
  limit = 5,
): Promise<IRoommateProfile[]> {
  const query: Record<string, unknown> = { isPublic: true };

  if (filters.district) {
    query.preferredDistrict = { $regex: filters.district, $options: "i" };
  }
  if (filters.maxBudget) {
    query.budgetMin = { $lte: filters.maxBudget };
  }

  // Preference filters â€” use $in so multiple acceptable enum values can match
  if (filters.smoking?.length) {
    query["preferences.smoking"] = { $in: filters.smoking };
  }
  if (filters.pets?.length) {
    query["preferences.pets"] = { $in: filters.pets };
  }
  if (filters.genderPreference) {
    query["preferences.genderPreference"] = filters.genderPreference;
  }
  if (filters.sleepTime) {
    query["preferences.sleepTime"] = filters.sleepTime;
  }
  if (filters.socialHabit) {
    query["preferences.socialHabit"] = filters.socialHabit;
  }
  if (filters.cookingHabit?.length) {
    query["preferences.cookingHabit"] = { $in: filters.cookingHabit };
  }
  if (filters.guests?.length) {
    query["preferences.guests"] = { $in: filters.guests };
  }
  if (filters.alcohol?.length) {
    query["preferences.alcohol"] = { $in: filters.alcohol };
  }
  if (filters.roomCleaning) {
    query["preferences.roomCleaning"] = filters.roomCleaning;
  }

  return RoommateProfile.find(query)
    .select("userId bio budgetMin budgetMax preferredDistrict university lookingFor preferences")
    .populate("userId", "fullName avatarUrl")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean<IRoommateProfile[]>();
}

// ---------------------------------------------------------------------------
// LLM Call (Gemini or Ollama)
// ---------------------------------------------------------------------------

type AIProvider = "gemini" | "ollama";

function getAIProvider(): AIProvider {
  const raw = (process.env.AI_PROVIDER || "gemini").toLowerCase().trim();
  return raw === "ollama" ? "ollama" : "gemini";
}

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:7b-instruct";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function callOllamaLLM(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = new URL("/api/generate", OLLAMA_BASE_URL);
    const payload = JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      options: {
        temperature: 0.4,
        top_p: 0.9,
        num_predict: 400,
      },
    });

    console.log(
      `[LLM] provider=ollama base=${OLLAMA_BASE_URL} model=${OLLAMA_MODEL}`,
    );

    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: "POST",
        timeout: 8000,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString();

          if (res.statusCode !== 200) {
            console.error(
              `[LLM] Ollama non-200 status ${res.statusCode}: ${body.slice(0, 200)}`,
            );
            reject(new Error(`Ollama returned HTTP ${res.statusCode}`));
            return;
          }

          let data: { response?: unknown };
          try {
            data = JSON.parse(body) as { response?: unknown };
          } catch {
            console.error(`[LLM] Ollama invalid JSON: ${body.slice(0, 200)}`);
            reject(new Error("Ollama returned invalid JSON"));
            return;
          }

          const text = typeof data.response === "string" ? data.response.trim() : "";
          if (!text) {
            console.error(
              `[LLM] Ollama empty response field: ${body.slice(0, 200)}`,
            );
            reject(new Error("Ollama returned an empty response field"));
            return;
          }

          resolve(text);
        });
      },
    );

    req.on("error", (err) => {
      console.error(`[LLM] Ollama connection error: ${(err as Error).message}`);
      reject(err);
    });
    req.write(payload);
    req.end();
  });
}

function callGeminiLLM(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!GEMINI_API_KEY) {
      reject(new Error("Missing GEMINI_API_KEY"));
      return;
    }

    const url = new URL(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        GEMINI_MODEL,
      )}:generateContent`,
    );
    url.searchParams.set("key", GEMINI_API_KEY);

    const payload = JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        topP: 0.9,
        maxOutputTokens: 400,
      },
    });

    console.log(`[LLM] provider=gemini model=${GEMINI_MODEL}`);

    const req = https.request(
      {
        hostname: url.hostname,
        port: 443,
        path: `${url.pathname}${url.search}`,
        method: "POST",
        timeout: 12000,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString();

          if (res.statusCode !== 200) {
            console.error(
              `[LLM] Gemini non-200 status ${res.statusCode}: ${body.slice(0, 200)}`,
            );
            reject(new Error(`Gemini returned HTTP ${res.statusCode}`));
            return;
          }

          let data: any;
          try {
            data = JSON.parse(body);
          } catch {
            console.error(`[LLM] Gemini invalid JSON: ${body.slice(0, 200)}`);
            reject(new Error("Gemini returned invalid JSON"));
            return;
          }

          const text =
            data?.candidates?.[0]?.content?.parts?.[0]?.text &&
            typeof data.candidates[0].content.parts[0].text === "string"
              ? (data.candidates[0].content.parts[0].text as string).trim()
              : "";

          if (!text) {
            console.error(`[LLM] Gemini empty response: ${body.slice(0, 200)}`);
            reject(new Error("Gemini returned an empty response field"));
            return;
          }

          resolve(text);
        });
      },
    );

    req.on("error", (err) => {
      console.error(`[LLM] Gemini connection error: ${(err as Error).message}`);
      reject(err);
    });
    req.write(payload);
    req.end();
  });
}

// Backward-compat: keep the export name used by the rest of the backend.
export function callLocalLLM(prompt: string): Promise<string> {
  const provider = getAIProvider();
  return provider === "ollama" ? callOllamaLLM(prompt) : callGeminiLLM(prompt);
}

