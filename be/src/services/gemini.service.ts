import { GoogleGenerativeAI } from "@google/generative-ai";
import { User, IUser } from "../models/User";
import { Room } from "../models/Room";

/**
 * Gemini AI Service
 * 
 * Handles all interactions with Google Gemini 1.5 API.
 * Builds contextual system prompts using user profile + available rooms.
 */

// ---------------------------------------------------------------------------
// Lazy-initialise the Gemini client (ensures dotenv is loaded first)
// ---------------------------------------------------------------------------
let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
      throw new Error("GEMINI_API_KEY is not configured. Set it in .env");
    }
    console.log("🤖 Initialising Gemini AI client...");
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

// Use gemini-2.0-flash for fast, cost-effective responses
const MODEL_NAME = "gemini-2.0-flash";

// ---------------------------------------------------------------------------
// System prompt — gives Gemini context about the KnockKnock platform
// ---------------------------------------------------------------------------
const BASE_SYSTEM_PROMPT = `You are KnockBot, an AI assistant for the rental housing platform KnockKnock (also called Roomie Connect).
Your main job is to help **tenants** (people looking for rooms) with the following:

1. **Room recommendations** — suggest suitable rooms based on budget, location, amenities, and preferences.
2. **Roommate suggestions** — help find compatible roommates based on lifestyle, schedule, and habits.
3. **Compatibility insights** — provide a compatibility percentage when comparing two user profiles.
4. **General housing Q&A** — answer questions about renting, moving, deposits, contracts, etc.

Guidelines:
- Always respond in **Vietnamese** unless the user writes in English.
- Keep answers structured, clear, and helpful.
- When recommending rooms, present them as a numbered list with price, area, address, and key amenities.
- If you receive room data in the context, use it to make concrete suggestions.
- If you don't have enough information, ask the user follow-up questions.
- Never invent room listings — only recommend from the provided room data.
- Be friendly and supportive; many users are students looking for affordable housing.
`;

// ---------------------------------------------------------------------------
// Build a user-context block so Gemini can personalise answers
// ---------------------------------------------------------------------------
function buildUserContext(user: IUser): string {
  const parts: string[] = ["[User Profile]"];
  if (user.fullName) parts.push(`Name: ${user.fullName}`);
  if (user.university) parts.push(`University: ${user.university}`);
  if (user.workplace) parts.push(`Workplace: ${user.workplace}`);
  if (user.role) parts.push(`Role: ${user.role}`);
  return parts.join("\n");
}

// ---------------------------------------------------------------------------
// Fetch active rooms and build a compact summary for the context window
// ---------------------------------------------------------------------------
async function buildRoomContext(): Promise<string> {
  try {
    const rooms = await Room.find({ status: "active" })
      .select("title price address district area amenities roomType maxOccupants utilities")
      .limit(30) // keep context manageable
      .lean();

    if (!rooms.length) return "[Available Rooms]\nNo rooms currently available.";

    const lines = rooms.map((r: any, i: number) => {
      const priceStr = `${(r.price / 1_000_000).toFixed(1)}tr/tháng`;
      const amenities = (r.amenities || []).join(", ");
      return `${i + 1}. ${r.title} — ${priceStr} | ${r.area}m² | ${r.address} | Tiện ích: ${amenities || "N/A"}`;
    });

    return `[Available Rooms — ${rooms.length} phòng]\n${lines.join("\n")}`;
  } catch {
    return "[Available Rooms]\nCould not load room data.";
  }
}

// ---------------------------------------------------------------------------
// Public: send a message to Gemini and get a reply
// ---------------------------------------------------------------------------
export interface GeminiResponse {
  reply: string;
  recommendations?: any[];
  compatibilityScore?: number;
}

export async function chatWithGemini(
  userId: string,
  userMessage: string,
): Promise<GeminiResponse> {
  // 1. Load user profile
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  // 2. Build contextual prompt
  const userCtx = buildUserContext(user);
  const roomCtx = await buildRoomContext();

  const systemInstruction = `${BASE_SYSTEM_PROMPT}\n\n${userCtx}\n\n${roomCtx}`;

  // 3. Call Gemini
  const ai = getGenAI();
  const model = ai.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction,
  });

  console.log(`🤖 Sending message to Gemini for user ${userId}...`);
  const result = await model.generateContent(userMessage);
  const response = result.response;
  const reply = response.text();
  console.log(`✅ Gemini responded (${reply.length} chars)`);

  // 4. Try to extract structured data from the reply (best-effort)
  const structured = extractStructuredData(reply);

  return {
    reply,
    recommendations: structured.recommendations,
    compatibilityScore: structured.compatibilityScore,
  };
}

// ---------------------------------------------------------------------------
// Helper: try to extract structured data from Gemini's text reply
// ---------------------------------------------------------------------------
function extractStructuredData(text: string): {
  recommendations?: any[];
  compatibilityScore?: number;
} {
  const result: { recommendations?: any[]; compatibilityScore?: number } = {};

  // Extract compatibility percentage if present (e.g. "85%", "tương thích: 90%")
  const compatMatch = text.match(/(\d{1,3})\s*%/);
  if (compatMatch) {
    const score = parseInt(compatMatch[1], 10);
    if (score >= 0 && score <= 100) {
      result.compatibilityScore = score;
    }
  }

  return result;
}
