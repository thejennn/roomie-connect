import http from "http";
import { Room, IRoom } from "../models/Room";
import { RoommateProfile, IRoommateProfile } from "../models/RoommateProfile";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Structured filters extracted from user message via regex + keyword matching */
export interface SearchFilters {
  max_price: number | null;
  district: string | null;
  max_area: number | null;       // m² upper bound
  amenities: string[];           // boolean Room field names
}

// ---------------------------------------------------------------------------
// Intent Detection — regex-based, no LLM round-trip needed
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Intent Detection — regex + keyword matching (zero LLM cost)
// ---------------------------------------------------------------------------

/**
 * Vietnamese price formats: "3 triệu", "3tr", "3.5tr", "500k", raw 7+ digit numbers.
 * We treat any mentioned price as a MAX budget ("dưới / không quá").
 */
const PRICE_PATTERNS: { regex: RegExp; multiplier: number }[] = [
  { regex: /(\d+(?:[.,]\d+)?)\s*(?:tri\u1EC7u|tr)\b/i, multiplier: 1_000_000 },
  { regex: /(\d+(?:[.,]\d+)?)\s*k\b/i,                  multiplier: 1_000 },
  { regex: /(\d{7,})/,                                   multiplier: 1 },
];

/**
 * Area filter: "30m2", "30 m²", "dưới 30m"
 * Treated as an upper bound on room area.
 */
const AREA_REGEX = /(\d+)\s*m(?:2|²|\s)/i;

/**
 * District / location: "quận 7", "Q.7", "quận Bình Thạnh", "huyện Nhà Bè"
 * Captures up to 3 words after the district keyword.
 */
const DISTRICT_REGEX =
  /(?:qu\u1EADn|q\.?|huy\u1EC7n|th\u1ECB\s*x\u00E3|tx\.?)\s*(\d+|[a-zA-Z\u00C0-\u1EF9]+(?:\s[a-zA-Z\u00C0-\u1EF9]+){0,2})/i;

/**
 * Bare location: "ở hòa lạc", "tại thạch hòa", "khu vực tân xã"
 * Captures place names not prefixed by quận/huyện.
 */
const LOCATION_REGEX =
  /(?:\u1EDF|t\u1EA1i|khu(?:\s*v\u1EF1c)?)\s+([a-zA-Z\u00C0-\u1EF9]+(?:\s[a-zA-Z\u00C0-\u1EF9]+){0,3})/i;

/**
 * Keyword triggers that signal a room-search intent even without price/district.
 * Checked AFTER price+district extraction as a fallback signal.
 */
const SEARCH_KEYWORDS =
  /t\u00ecm ph\u00f2ng|\bph\u00f2ng tr\u1ecd\b|thu\u00ea ph\u00f2ng|c\u00f3 ph\u00f2ng|\bph\u00f2ng cho thu\u00ea|danh s\u00e1ch ph\u00f2ng/i;

/**
 * Amenity keyword → Mongoose boolean field name mapping.
 * Keeps all domain knowledge in one place.
 */
const AMENITY_MAP: { pattern: RegExp; field: string }[] = [
  { pattern: /m\u00e1y l\u1ea1nh|\u0111i\u1ec1u h\u00f2a/i,          field: "hasAirConditioner" },
  { pattern: /gi\u01b0\u1eddng/i,                                  field: "hasBed" },
  { pattern: /t\u1ee7 qu\u1ea7n|t\u1ee7 \u0111\u1ed3/i,             field: "hasWardrobe" },
  { pattern: /n\u00f3ng l\u1ea1nh|b\u00ecnh n\u01b0\u1edbc n\u00f3ng|m\u00e1y n\u01b0\u1edbc n\u00f3ng/i, field: "hasWaterHeater" },
  { pattern: /b\u1ebfp|nh\u00e0 b\u1ebfp/i,                          field: "hasKitchen" },
  { pattern: /t\u1ee7 l\u1ea1nh/i,                                  field: "hasFridge" },
  { pattern: /m\u00e1y gi\u1eb7t ri\u00eang/i,                        field: "hasPrivateWashing" },
  { pattern: /m\u00e1y gi\u1eb7t chung/i,                            field: "hasSharedWashing" },
  { pattern: /ch\u1ed7 \u0111\u1ec3 xe|b\u00e3i \u0111\u1ed7 xe|g\u1eedi xe/i, field: "hasParking" },
  { pattern: /thang m\u00e1y/i,                                     field: "hasElevator" },
  { pattern: /camera/i,                                             field: "hasSecurityCamera" },
  { pattern: /ph\u00f2ng ch\u00e1y|ch\u1eefa ch\u00e1y/i,             field: "hasFireSafety" },
  { pattern: /th\u00fa c\u01b0ng|pet/i,                              field: "hasPetFriendly" },
  { pattern: /s\u00e2n ph\u01a1i/i,                                  field: "hasDryingArea" },
  { pattern: /n\u1ed9i th\u1ea5t|full n\u1ed9i th\u1ea5t|\u0111\u1ea7y \u0111\u1ee7 n\u1ed9i th\u1ea5t/i, field: "isFullyFurnished" },
];

/**
 * Parse a Vietnamese user message and extract room-search filters.
 *
 * Design decision: use regex here instead of a first LLM call.
 * Reason: avoids a round-trip to the model just to extract structured data,
 * reduces latency, and is fully deterministic (no hallucination risk).
 *
 * Returns null when the message is clearly NOT a room-search query.
 */
export function detectSearchIntent(message: string): SearchFilters | null {
  let max_price: number | null = null;
  let district: string | null = null;
  let max_area: number | null = null;
  const amenities: string[] = [];

  // --- Price ---
  for (const { regex, multiplier } of PRICE_PATTERNS) {
    const m = message.match(regex);
    if (m) {
      max_price = parseFloat(m[1].replace(",", ".")) * multiplier;
      break;
    }
  }

  // --- District / Location ---
  const dm = message.match(DISTRICT_REGEX);
  if (dm) district = dm[1].trim();
  if (!district) {
    const lm = message.match(LOCATION_REGEX);
    if (lm) district = lm[1].trim();
  }

  // --- Area ---
  const am = message.match(AREA_REGEX);
  if (am) max_area = parseInt(am[1], 10);

  // --- Amenities ---
  for (const { pattern, field } of AMENITY_MAP) {
    if (pattern.test(message)) amenities.push(field);
  }

  // At least one numeric filter OR explicit search keyword required
  const hasNumericFilter = max_price !== null || district !== null || max_area !== null;
  const hasKeyword = SEARCH_KEYWORDS.test(message);

  if (!hasNumericFilter && !hasKeyword && amenities.length === 0) return null;

  return { max_price, district, max_area, amenities };
}

// ---------------------------------------------------------------------------
// MongoDB Query
// ---------------------------------------------------------------------------

/**
 * Query active rooms from MongoDB using the extracted filters.
 * Hard cap of 5 results keeps the LLM prompt small and focused.
 *
 * Design decision: DB query lives HERE, not inside the LLM prompt.
 * The LLM must never be asked to query the database — it has no DB access
 * and would hallucinate results. We query first, then inject real data.
 */
export async function queryRooms(
  filters: SearchFilters,
  limit = 5,
): Promise<IRoom[]> {
  const query: Record<string, unknown> = { status: "active" };

  if (filters.max_price !== null) {
    query.price = { $lte: filters.max_price };
  }
  if (filters.district !== null) {
    // Search both district and address fields so bare names like "hòa lạc"
    // match rooms whose address contains that place name.
    query.$or = [
      { district: { $regex: filters.district, $options: "i" } },
      { address: { $regex: filters.district, $options: "i" } },
    ];
  }
  if (filters.max_area !== null) {
    query.area = { $lte: filters.max_area };
  }
  // Each amenity is a boolean field; require all of them to be true
  for (const field of filters.amenities) {
    query[field] = true;
  }

  return Room.find(query)
    // include images so the frontend can render thumbnails in room cards
    .select("title price address district area capacity images")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean<IRoom[]>();
}

// ---------------------------------------------------------------------------
// Prompt Building
// ---------------------------------------------------------------------------

/**
 * Build a grounded prompt that injects ONLY real database results.
 *
 * Anti-hallucination strategy:
 * 1. Explicitly tell the model the data came from the database.
 * 2. Forbid inventing new rooms.
 * 3. If no rooms were found, we NEVER reach this function (controller
 *    returns a static message instead — no LLM call at all).
 */
export function buildRoomPrompt(rooms: IRoom[], userMessage: string): string {
  const roomList = rooms
    .map((r, i) => {
      const price = `${(r.price / 1_000_000).toFixed(1)} triệu/tháng`;
      const area  = r.area ? `${r.area}m²` : "diện tích chưa có";
      return `${i + 1}. ${r.title} | ${price} | ${area} | ${r.address}, ${r.district}`;
    })
    .join("\n");

  return [
    "Bạn là trợ lý AI của nền tảng KnockKnock.",
    "Dưới đây là kết quả TỪ CƠ SỞ DỮ LIỆU THẬT (MongoDB).",
    "QUY TẮC BẮT BUỘC:",
    "- CHỈ được dùng thông tin trong danh sách này.",
    "- KHÔNG ĐƯỢC bịa ra bất kỳ phòng nào khác.",
    "- KHÔNG ĐƯỢC thêm tên thành phố, quận, khu vực nào ngoài thông tin có sẵn trong địa chỉ của từng phòng.",
    "- Khi nhắc đến địa chỉ, CHỈ dùng đúng địa chỉ ghi trong danh sách, không suy đoán thêm.",
    "- Nếu thông tin không có trong danh sách, nói rõ là không có.",
    "",
    `[Kết quả — ${rooms.length} phòng phù hợp]`,
    roomList,
    "",
    `Yêu cầu người dùng: "${userMessage}"`,
    "",
    "Hãy tóm tắt danh sách trên bằng tiếng Việt, thân thiện, ngắn gọn.",
  ].join("\n");
}

/**
 * General-purpose prompt for non-room-search questions.
 */
export function buildGeneralPrompt(userMessage: string): string {
  return [
    "Bạn là trợ lý AI tên KnockBot của nền tảng thuê phòng trọ KnockKnock.",
    "Trả lời bằng tiếng Việt, thân thiện, ngắn gọn.",
    "Nếu người dùng hỏi về phòng cụ thể, nhắc họ mô tả rõ khu vực hoặc ngân sách.",
    "Nếu người dùng hỏi về bạn cùng phòng, nhắc họ mô tả khu vực, ngân sách hoặc yêu cầu lối sống.",
    "",
    `Người dùng: "${userMessage}"`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Roommate Intent Detection
// ---------------------------------------------------------------------------

/** Keywords that signal the user is looking for a roommate (not a room). */
const ROOMMATE_KEYWORDS =
  /bạn cùng phòng|bạn phòng\b|roommate|ghép phòng|tìm người ở cùng|người ở cùng|cần người ở chung|tìm người ghép|ghép trọ|tìm bạn chung phòng/i;

export interface RoommateFilters {
  district: string | null;
  maxBudget: number | null;
  // Each array field uses MongoDB $in — matches any of the listed enum values
  smoking: string[] | null;
  pets: string[] | null;
  genderPreference: string | null;
  sleepTime: string | null;
  socialHabit: string | null;
  cookingHabit: string[] | null;
  guests: string[] | null;
  alcohol: string[] | null;
  roomCleaning: string | null;
}

/**
 * Map a Vietnamese natural-language roommate request to structured DB filters.
 *
 * Strategy: regex-only (no LLM round-trip) — deterministic and zero latency.
 * Each preference field maps directly to the enum values stored in
 * RoommateProfile.preferences (IQuizPreferences).
 */
export function detectRoommateIntent(message: string): RoommateFilters | null {
  if (!ROOMMATE_KEYWORDS.test(message)) return null;

  // ---- Location & budget ----
  let district: string | null = null;
  let maxBudget: number | null = null;

  const dm = message.match(DISTRICT_REGEX);
  if (dm) district = dm[1].trim();
  if (!district) {
    const lm = message.match(LOCATION_REGEX);
    if (lm) district = lm[1].trim();
  }
  for (const { regex, multiplier } of PRICE_PATTERNS) {
    const m = message.match(regex);
    if (m) { maxBudget = parseFloat(m[1].replace(",", ".")) * multiplier; break; }
  }

  // ---- Smoking ----
  // "không hút thuốc" / "no smoke" / "kỵ khói thuốc" → find non-smokers
  // "hút thuốc" / "có hút thuốc" → find smokers
  let smoking: string[] | null = null;
  if (/không hút thuốc|no smoke|ghét thuốc|kỵ khói thuốc|không chịu được khói thuốc/i.test(message)) {
    smoking = ["no_smoke_ok", "hate_smoke"];
  } else if (/\bhút thuốc\b|có hút thuốc/i.test(message)) {
    smoking = ["smoke_indoors", "smoke_outdoors"];
  }

  // ---- Pets ----
  // "nuôi mèo/chó/thú cưng" / "có thú cưng" → find pet owners
  // "thích thú cưng" → find pet-friendly profiles
  // "không thú cưng" / "dị ứng" → find pet-free profiles
  let pets: string[] | null = null;
  if (/nuôi mèo|nuôi chó|nuôi thú cưng|có thú cưng|muốn nuôi thú/i.test(message)) {
    pets = ["have_pet", "like_pet"];
  } else if (/thích thú cưng|yêu động vật|ok với thú cưng/i.test(message)) {
    pets = ["like_pet", "have_pet", "indifferent"];
  } else if (/không thú cưng|không nuôi thú|kỵ thú cưng|dị ứng thú cưng/i.test(message)) {
    pets = ["allergic"];
  }

  // ---- Sleep schedule ----
  // "ngủ sớm" / "dậy sớm" → early | "thức khuya" / "ngủ muộn" → late
  let sleepTime: string | null = null;
  if (/ngủ sớm|đi ngủ sớm|dậy sớm|thức dậy sớm/i.test(message)) {
    sleepTime = "early";
  } else if (/ngủ muộn|thức khuya|dậy muộn|đêm khuya/i.test(message)) {
    sleepTime = "late";
  } else if (/linh hoạt giờ ngủ|giờ ngủ linh hoạt/i.test(message)) {
    sleepTime = "flexible";
  }

  // ---- Social personality ----
  let socialHabit: string | null = null;
  if (/hướng ngoại|thích giao lưu|năng động|thích gặp gỡ|vui vẻ năng động/i.test(message)) {
    socialHabit = "extrovert";
  } else if (/hướng nội|ít nói|thích ở nhà|thích yên tĩnh|không thích ồn ào/i.test(message)) {
    socialHabit = "introvert";
  }

  // ---- Cooking habits ----
  let cookingHabit: string[] | null = null;
  if (/thích nấu ăn|nấu ăn hàng ngày|hay nấu|thường nấu|nấu chung/i.test(message)) {
    cookingHabit = ["cook_daily", "cook_together"];
  } else if (/ăn ngoài|không nấu|lười nấu|hay ăn ngoài/i.test(message)) {
    cookingHabit = ["eat_out"];
  }

  // ---- Guests ----
  let guests: string[] | null = null;
  if (/không muốn có khách|ít khách|không có khách|ghét có khách/i.test(message)) {
    guests = ["rarely", "never"];
  } else if (/thường có khách|hay có khách|nhiều khách/i.test(message)) {
    guests = ["often", "sometimes"];
  }

  // ---- Alcohol ----
  let alcohol: string[] | null = null;
  if (/không uống rượu|không nhậu|không uống bia|tránh rượu bia/i.test(message)) {
    alcohol = ["never_drink_home"];
  } else if (/thỉnh thoảng uống|thỉnh thoảng nhậu|uống vừa phải/i.test(message)) {
    alcohol = ["sometimes_drink", "never_drink_home"];
  }

  // ---- Room cleanliness ----
  let roomCleaning: string | null = null;
  if (/sạch sẽ gọn gàng|dọn hàng ngày|thích sạch sẽ|rất gọn gàng|ngăn nắp/i.test(message)) {
    roomCleaning = "daily";
  } else if (/dọn hàng tuần/i.test(message)) {
    roomCleaning = "weekly";
  }

  // ---- Gender preference ----
  let genderPreference: string | null = null;
  if (/\bnam\b/i.test(message) && !/nữ/i.test(message)) genderPreference = "male";
  if (/\bnữ\b/i.test(message)) genderPreference = "female";
  if (/không quan trọng giới tính|bất kể giới tính/i.test(message)) genderPreference = "no_preference";

  return {
    district, maxBudget,
    smoking, pets, genderPreference,
    sleepTime, socialHabit, cookingHabit,
    guests, alcohol, roomCleaning,
  };
}

export async function queryRoommates(
  filters: RoommateFilters,
  limit = 5,
): Promise<IRoommateProfile[]> {
  const query: Record<string, unknown> = { isPublic: true };

  if (filters.district) {
    query.preferredDistrict = { $regex: filters.district, $options: "i" };
  }
  if (filters.maxBudget) {
    query.budgetMin = { $lte: filters.maxBudget };
  }

  // Preference filters — use $in so multiple acceptable enum values can match
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

/** Human-readable Vietnamese labels for quiz preference enum values. */
const PREF_LABELS: Record<string, string> = {
  // sleepTime
  early: "ngủ sớm", late: "thức khuya", poor_sleep: "ngủ không ngon", flexible: "giờ ngủ linh hoạt",
  // smoking
  smoke_indoors: "hút thuốc trong nhà", smoke_outdoors: "hút thuốc ngoài trời",
  no_smoke_ok: "không hút thuốc", hate_smoke: "ghét khói thuốc",
  // pets
  have_pet: "đang nuôi thú cưng", like_pet: "thích thú cưng",
  allergic: "dị ứng thú cưng", indifferent: "không quan tâm thú cưng",
  // socialHabit
  extrovert: "hướng ngoại", introvert: "hướng nội",
  ambivert: "vừa hướng ngoại vừa nội tâm", reserved: "trầm tính",
  // cookingHabit
  cook_daily: "nấu ăn hàng ngày", cook_simple: "nấu đơn giản",
  eat_out: "hay ăn ngoài", cook_together: "thích nấu chung",
  // guests
  often: "thường có khách", sometimes: "thỉnh thoảng có khách",
  rarely: "ít khi có khách", never: "không có khách",
  // alcohol
  often_drink: "hay uống rượu", sometimes_drink: "thỉnh thoảng uống",
  never_drink_home: "không uống tại nhà", cant_drink: "không uống được rượu",
  // roomCleaning
  daily: "dọn phòng hàng ngày", weekly: "dọn hàng tuần",
  when_messy: "dọn khi bừa",
  // genderPreference
  male: "tìm bạn nam", female: "tìm bạn nữ",
  lgbtq: "LGBTQ+ friendly", no_preference: "không quan trọng giới tính",
};

function labelPref(value: string | undefined): string {
  if (!value) return "";
  return PREF_LABELS[value] ?? value;
}

export function buildRoommatePrompt(profiles: IRoommateProfile[], userMessage: string): string {
  const list = profiles
    .map((p, i) => {
      const user = p.userId as unknown as Record<string, unknown>;
      const name = (user?.fullName as string) ?? "Ẩn danh";
      const budget =
        p.budgetMin && p.budgetMax
          ? `${(p.budgetMin / 1_000_000).toFixed(1)}–${(p.budgetMax / 1_000_000).toFixed(1)} triệu/tháng`
          : p.budgetMax
          ? `dưới ${(p.budgetMax / 1_000_000).toFixed(1)} triệu/tháng`
          : "chưa xác định";
      const districts = p.preferredDistrict?.join(", ") || "không giới hạn";

      // Build a concise preference summary from stored quiz answers
      const prefs = p.preferences ?? {};
      const prefTags = [
        labelPref(prefs.sleepTime),
        labelPref(prefs.smoking),
        labelPref(prefs.pets),
        labelPref(prefs.socialHabit),
        labelPref(prefs.cookingHabit),
        labelPref(prefs.guests),
        labelPref(prefs.alcohol),
        labelPref(prefs.roomCleaning),
        labelPref(prefs.genderPreference),
      ].filter(Boolean).join(" · ");

      const bio = p.bio ? ` | "${p.bio}"` : "";
      const prefLine = prefTags ? ` | ${prefTags}` : "";
      return `${i + 1}. ${name} | Ngân sách: ${budget} | Khu vực: ${districts}${prefLine}${bio}`;
    })
    .join("\n");

  return [
    "Bạn là trợ lý AI của nền tảng KnockKnock.",
    "Dưới đây là danh sách người đang tìm bạn cùng phòng (từ cơ sở dữ liệu thật).",
    "QUY TẮC BẮT BUỘC:",
    "- CHỈ được dùng thông tin trong danh sách.",
    "- KHÔNG ĐƯỢC bịa thêm người nào.",
    "- Giới thiệu ngắn gọn từng người, nêu bật đặc điểm phù hợp với yêu cầu.",
    "",
    `[Kết quả — ${profiles.length} người phù hợp]`,
    list,
    "",
    `Yêu cầu người dùng: "${userMessage}"`,
    "",
    "Hãy giới thiệu những người phù hợp bằng tiếng Việt, thân thiện, ngắn gọn. Với mỗi người, hãy nêu rõ vì sao họ phù hợp với yêu cầu.",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Local LLM Call (Ollama)
// ---------------------------------------------------------------------------

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2:1.5b";

/**
 * Call the local Ollama LLM via HTTP and return the generated text.
 * Uses Node built-in http — zero extra dependencies.
 *
 * Safeguards:
 * - Non-200 HTTP status → explicit error with status code + body snippet.
 * - Malformed JSON → explicit parse error.
 * - Missing or empty `response` field → explicit error (prevents saving undefined
 *   to Mongoose and avoids downstream validation failures).
 * - Returned value is always a non-empty string or the promise rejects.
 */
export function callLocalLLM(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = new URL("/api/generate", OLLAMA_BASE_URL);
    const payload = JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: false });

    console.log(`[LLM] Sending request to ${OLLAMA_BASE_URL} model=${OLLAMA_MODEL}`);

    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: "POST",
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

          // Safeguard A1: reject on non-200 HTTP status
          if (res.statusCode !== 200) {
            console.error(`[LLM] Non-200 status ${res.statusCode}: ${body.slice(0, 200)}`);
            reject(new Error(`Ollama returned HTTP ${res.statusCode}`));
            return;
          }

          // Safeguard A2: reject on unparseable JSON
          let data: { response?: unknown };
          try {
            data = JSON.parse(body) as { response?: unknown };
          } catch {
            console.error(`[LLM] Failed to parse JSON response: ${body.slice(0, 200)}`);
            reject(new Error("Ollama returned invalid JSON"));
            return;
          }

          // Safeguard A3: ensure response field is a non-empty string
          const text = typeof data.response === "string" ? data.response.trim() : "";
          if (!text) {
            console.error(`[LLM] response field missing or empty in: ${body.slice(0, 200)}`);
            reject(new Error("Ollama returned an empty response field"));
            return;
          }

          console.log(`[LLM] Response received (${text.length} chars)`);
          resolve(text);
        });
      },
    );

    req.on("error", (err) => {
      console.error(`[LLM] Connection error: ${(err as Error).message}`);
      reject(err);
    });
    req.write(payload);
    req.end();
  });
}
