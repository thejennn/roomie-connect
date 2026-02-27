import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * AI Filter Extraction Service
 *
 * Accepts a Vietnamese sentence from the user, sends it to Gemini,
 * and extracts structured room-search filters as JSON.
 *
 * Extracted filters:
 *  - intent: "search_room" | "general_question"
 *  - max_price: number | null       (VND)
 *  - district: string | null
 *  - amenities: string[]            (boolean field names from Room schema)
 *  - reply: string                  (conversational AI reply in Vietnamese)
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface ExtractedFilters {
  intent: "search_room" | "general_question";
  max_price: number | null;
  district: string | null;
  amenities: string[];
  reply: string;
}

// ---------------------------------------------------------------------------
// Lazy-initialise Gemini client
// ---------------------------------------------------------------------------
let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
      throw new Error("GEMINI_API_KEY is not configured. Set it in .env");
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

const MODEL_NAME = "gemini-2.0-flash";

// ---------------------------------------------------------------------------
// The extraction prompt — maps Vietnamese amenity keywords to Room schema fields
// ---------------------------------------------------------------------------
const EXTRACTION_PROMPT = `Bạn là trợ lý AI cho nền tảng tìm phòng trọ KnockKnock.

Nhiệm vụ: Phân tích câu hỏi tiếng Việt của người dùng và trả về JSON.

Quy tắc ánh xạ tiện ích → field name:
- "máy lạnh", "điều hòa" → "hasAirConditioner"
- "giường" → "hasBed"
- "tủ quần áo", "tủ đồ" → "hasWardrobe"
- "nóng lạnh", "bình nóng lạnh", "máy nước nóng" → "hasWaterHeater"
- "bếp", "nhà bếp" → "hasKitchen"
- "tủ lạnh" → "hasFridge"
- "máy giặt riêng" → "hasPrivateWashing"
- "máy giặt chung" → "hasSharedWashing"
- "chỗ để xe", "bãi đỗ xe" → "hasParking"
- "thang máy" → "hasElevator"
- "camera an ninh" → "hasSecurityCamera"
- "phòng cháy" → "hasFireSafety"
- "thú cưng" → "hasPetFriendly"
- "sân phơi" → "hasDryingArea"
- "đầy đủ nội thất", "full nội thất" → "isFullyFurnished"

Quy tắc giá:
- "triệu" hoặc "tr" → nhân 1.000.000  (ví dụ: "3 triệu" = 3000000)
- "k" → nhân 1.000  (ví dụ: "500k" = 500000)
- Nếu người dùng nói "dưới 3 triệu" → max_price = 3000000

Quy tắc khu vực (district):
- Trả về tên quận/huyện/phường/xã/khu vực được nhắc đến
- Ví dụ: "Hòa Lạc", "Thạch Thất", "Cầu Giấy", "Quận 1"

Trả về JSON **duy nhất**, không thêm text khác:
{
  "intent": "search_room" hoặc "general_question",
  "max_price": number hoặc null,
  "district": string hoặc null,
  "amenities": ["hasAirConditioner", ...] hoặc [],
  "reply": "Câu trả lời thân thiện bằng tiếng Việt cho người dùng"
}

Nếu intent là "general_question", hãy điền "reply" với câu trả lời hữu ích.
Nếu intent là "search_room", hãy điền "reply" mô tả bộ lọc đã hiểu được.`;

// ---------------------------------------------------------------------------
// Public: Extract structured filters from a Vietnamese message
// ---------------------------------------------------------------------------
export async function extractSearchFilters(
  userMessage: string,
): Promise<ExtractedFilters> {
  const ai = getGenAI();
  const model = ai.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: EXTRACTION_PROMPT,
  });

  console.log(`🔍 Extracting filters from: "${userMessage}"`);

  const result = await model.generateContent(userMessage);
  const responseText = result.response.text();
  console.log(`📋 Raw AI response: ${responseText}`);

  // Parse JSON from the response (handle markdown code fences)
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.warn("⚠️ Could not extract JSON from AI response");
    return {
      intent: "general_question",
      max_price: null,
      district: null,
      amenities: [],
      reply: "Xin lỗi, mình chưa hiểu rõ yêu cầu của bạn. Bạn có thể nói rõ hơn không?",
    };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as ExtractedFilters;

    // Validate and sanitize the parsed data
    return {
      intent: parsed.intent === "search_room" ? "search_room" : "general_question",
      max_price: typeof parsed.max_price === "number" && parsed.max_price > 0
        ? parsed.max_price
        : null,
      district: typeof parsed.district === "string" && parsed.district.trim()
        ? parsed.district.trim()
        : null,
      amenities: Array.isArray(parsed.amenities)
        ? parsed.amenities.filter((a) => typeof a === "string")
        : [],
      reply: typeof parsed.reply === "string" && parsed.reply.trim()
        ? parsed.reply.trim()
        : "Đã nhận yêu cầu của bạn.",
    };
  } catch (parseError) {
    console.error("❌ JSON parse error:", parseError);
    return {
      intent: "general_question",
      max_price: null,
      district: null,
      amenities: [],
      reply: "Xin lỗi, mình chưa hiểu rõ yêu cầu của bạn. Bạn có thể thử lại không?",
    };
  }
}
