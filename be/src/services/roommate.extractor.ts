/**
 * Roommate Criteria Extractor — Parses preferences + detects clarification need.
 *
 * Two-phase flow:
 *  1. `hasSufficientCriteria(message)` — does the message contain ANY
 *     specific preference (smoking, sleep, gender, budget, location…)?
 *     If false → pipeline returns CLARIFICATION without querying DB.
 *
 *  2. `extractRoommateCriteria(message, memory?)` — full extraction of every
 *     recognised preference. Memory is merged so past preferences carry over.
 */

import { parseBudget } from "./budget.parser";
import { normalizeVietnamese } from "./location.resolver";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RoommateCriteria {
  /** District / ward (normalised). */
  district: string | null;
  /** Max budget in VND. */
  maxBudget: number | null;
  /** Smoking preference enum values for $in query. */
  smoking: string[] | null;
  /** Pet preference enum values. */
  pets: string[] | null;
  /** Gender preference label. */
  genderPreference: string | null;
  /** Sleep schedule. */
  sleepTime: string | null;
  /** Social personality. */
  socialHabit: string | null;
  /** Cooking habit enum values. */
  cookingHabit: string[] | null;
  /** Guest frequency enum values. */
  guests: string[] | null;
  /** Alcohol enum values. */
  alcohol: string[] | null;
  /** Room cleanliness level. */
  roomCleaning: string | null;
}

/** Memory-stored roommate preferences that can be injected. */
export interface StoredRoommatePreferences {
  smoking?: string;
  sleepHabit?: string;
  gender?: string;
  location?: string;
  budget?: number;
}

// ---------------------------------------------------------------------------
// Clarification detection
// ---------------------------------------------------------------------------

/**
 * Specific-criteria signal patterns — if ANY of these match, the user
 * has provided at least one actionable filter.
 */
const CRITERIA_SIGNALS: RegExp[] = [
  // Smoking
  /hút\s*thuốc|không\s*hút|no\s*smok|ghét\s*khói|kỵ\s*khói/i,
  // Sleep
  /ngủ\s*sớm|thức\s*khuya|ngủ\s*muộn|dậy\s*sớm|giờ\s*ngủ/i,
  // Gender
  /\bnam\b|\bnữ\b|giới\s*tính/i,
  // Pets
  /thú\s*cưng|nuôi\s*mèo|nuôi\s*chó|pet|dị\s*ứng\s*thú/i,
  // Social
  /hướng\s*ngoại|hướng\s*nội|ít\s*nói|năng\s*động/i,
  // Cooking
  /nấu\s*ăn|ăn\s*ngoài|bếp/i,
  // Cleanliness
  /sạch\s*sẽ|gọn\s*gàng|ngăn\s*nắp|dọn\s*phòng/i,
  // Budget (Vietnamese price patterns)
  /\d+\s*(?:triệu|tr|k)\b|\d{7,}/i,
  // Location
  /th[aạ]ch\s*h[oò]a|t[aâ]n\s*x[aã]|hòa\s*lạc|thạch\s*thất/i,
  // Alcohol
  /rượu|bia|nhậu|uống/i,
  // Guests
  /khách|có\s*khách/i,
];

/**
 * Check whether a FIND_ROOMMATE message provides enough criteria to query.
 *
 * Returns false when the message is a bare request like:
 *   "Tìm bạn ở ghép", "Tìm roommate", "Tìm bạn cùng phòng"
 * without any specific preferences.
 */
export function hasSufficientCriteria(message: string): boolean {
  return CRITERIA_SIGNALS.some((re) => re.test(message));
}

/** Clarification prompt sent when criteria are missing. */
export const CLARIFICATION_REPLY =
  "Bạn muốn tìm roommate với tiêu chí như thế nào? " +
  "(ví dụ: ngủ sớm, thức khuya, hút thuốc hay không, giới tính, ngân sách, khu vực…) " +
  "Bạn cung cấp càng chi tiết, KnockBot tìm càng chính xác nhé! 🤝";

// ---------------------------------------------------------------------------
// Full criteria extraction
// ---------------------------------------------------------------------------

/** District extraction patterns. */
const DISTRICT_RE =
  /(?:quận|q\.?|huyện|thị\s*xã|tx\.?)\s*(\d+|[a-zA-Z\u00C0-\u1EF9]+(?:\s[a-zA-Z\u00C0-\u1EF9]+){0,2})/i;
const LOCATION_RE =
  /(?:ở|tại|khu(?:\s*vực)?)\s+([a-zA-Z\u00C0-\u1EF9]+(?:\s[a-zA-Z\u00C0-\u1EF9]+){0,3})/i;

/**
 * Extract all recognised roommate criteria from a user message.
 * Optionally merges with stored memory preferences so past context carries over.
 */
export function extractRoommateCriteria(
  message: string,
  memory?: StoredRoommatePreferences | null,
): RoommateCriteria {
  // ── District ──
  let district: string | null = null;
  const dm = message.match(DISTRICT_RE);
  if (dm) district = dm[1].trim();
  if (!district) {
    const lm = message.match(LOCATION_RE);
    if (lm) district = lm[1].trim();
  }

  // ── Budget ──
  const maxBudget = parseBudget(message);

  // ── Smoking ──
  let smoking: string[] | null = null;
  if (/không\s*hút\s*thuốc|no\s*smok|ghét\s*thuốc|kỵ\s*khói\s*thuốc|không\s*chịu\s*được\s*khói/i.test(message)) {
    smoking = ["no_smoke_ok", "hate_smoke"];
  } else if (/\bhút\s*thuốc\b|có\s*hút\s*thuốc/i.test(message)) {
    smoking = ["smoke_indoors", "smoke_outdoors"];
  }

  // ── Pets ──
  let pets: string[] | null = null;
  if (/nuôi\s*mèo|nuôi\s*chó|nuôi\s*thú\s*cưng|có\s*thú\s*cưng|muốn\s*nuôi\s*thú/i.test(message)) {
    pets = ["have_pet", "like_pet"];
  } else if (/thích\s*thú\s*cưng|yêu\s*động\s*vật|ok\s*với\s*thú\s*cưng/i.test(message)) {
    pets = ["like_pet", "have_pet", "indifferent"];
  } else if (/không\s*thú\s*cưng|không\s*nuôi\s*thú|kỵ\s*thú\s*cưng|dị\s*ứng\s*thú\s*cưng/i.test(message)) {
    pets = ["allergic"];
  }

  // ── Sleep ──
  let sleepTime: string | null = null;
  if (/ngủ\s*sớm|đi\s*ngủ\s*sớm|dậy\s*sớm|thức\s*dậy\s*sớm/i.test(message)) {
    sleepTime = "early";
  } else if (/ngủ\s*muộn|thức\s*khuya|dậy\s*muộn|đêm\s*khuya/i.test(message)) {
    sleepTime = "late";
  } else if (/linh\s*hoạt\s*giờ\s*ngủ|giờ\s*ngủ\s*linh\s*hoạt/i.test(message)) {
    sleepTime = "flexible";
  }

  // ── Social ──
  let socialHabit: string | null = null;
  if (/hướng\s*ngoại|thích\s*giao\s*lưu|năng\s*động|thích\s*gặp\s*gỡ/i.test(message)) {
    socialHabit = "extrovert";
  } else if (/hướng\s*nội|ít\s*nói|thích\s*ở\s*nhà|thích\s*yên\s*tĩnh|không\s*thích\s*ồn/i.test(message)) {
    socialHabit = "introvert";
  }

  // ── Cooking ──
  let cookingHabit: string[] | null = null;
  if (/thích\s*nấu\s*ăn|nấu\s*ăn\s*hàng\s*ngày|hay\s*nấu|thường\s*nấu|nấu\s*chung/i.test(message)) {
    cookingHabit = ["cook_daily", "cook_together"];
  } else if (/ăn\s*ngoài|không\s*nấu|lười\s*nấu|hay\s*ăn\s*ngoài/i.test(message)) {
    cookingHabit = ["eat_out"];
  }

  // ── Guests ──
  let guests: string[] | null = null;
  if (/không\s*muốn\s*có\s*khách|ít\s*khách|không\s*có\s*khách|ghét\s*có\s*khách/i.test(message)) {
    guests = ["rarely", "never"];
  } else if (/thường\s*có\s*khách|hay\s*có\s*khách|nhiều\s*khách/i.test(message)) {
    guests = ["often", "sometimes"];
  }

  // ── Alcohol ──
  let alcohol: string[] | null = null;
  if (/không\s*uống\s*rượu|không\s*nhậu|không\s*uống\s*bia|tránh\s*rượu/i.test(message)) {
    alcohol = ["never_drink_home"];
  } else if (/thỉnh\s*thoảng\s*uống|thỉnh\s*thoảng\s*nhậu|uống\s*vừa\s*phải/i.test(message)) {
    alcohol = ["sometimes_drink", "never_drink_home"];
  }

  // ── Room cleanliness ──
  let roomCleaning: string | null = null;
  if (/sạch\s*sẽ\s*gọn\s*gàng|dọn\s*hàng\s*ngày|thích\s*sạch\s*sẽ|rất\s*gọn\s*gàng|ngăn\s*nắp/i.test(message)) {
    roomCleaning = "daily";
  } else if (/dọn\s*hàng\s*tuần/i.test(message)) {
    roomCleaning = "weekly";
  }

  // ── Gender ──
  let genderPreference: string | null = null;
  if (/\bnam\b/i.test(message) && !/nữ/i.test(message)) genderPreference = "male";
  if (/\bnữ\b/i.test(message)) genderPreference = "female";
  if (/không\s*quan\s*trọng\s*giới\s*tính|bất\s*kể\s*giới\s*tính/i.test(message)) genderPreference = "no_preference";

  // ── Merge with stored memory ──
  if (memory) {
    if (!smoking && memory.smoking) {
      const memSmoke = memory.smoking;
      if (memSmoke === "no") smoking = ["no_smoke_ok", "hate_smoke"];
      else if (memSmoke === "yes") smoking = ["smoke_indoors", "smoke_outdoors"];
    }
    if (!sleepTime && memory.sleepHabit) {
      sleepTime = memory.sleepHabit;
    }
    if (!genderPreference && memory.gender) {
      genderPreference = memory.gender;
    }
    if (!district && memory.location) {
      district = memory.location;
    }
    if (!maxBudget && memory.budget) {
      // use memory budget only as a fallback
    }
  }

  return {
    district,
    maxBudget: maxBudget ?? (memory?.budget ?? null),
    smoking,
    pets,
    genderPreference,
    sleepTime,
    socialHabit,
    cookingHabit,
    guests,
    alcohol,
    roomCleaning,
  };
}
