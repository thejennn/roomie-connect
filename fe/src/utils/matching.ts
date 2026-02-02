import { QuizPreferences, User, MatchResult } from "@/types";

type PreferenceKey = keyof QuizPreferences;

// Define weights for important preferences (Total ~10-12 points base)
const PREFERENCE_WEIGHTS: Partial<Record<PreferenceKey, number>> = {
  // Sleep & Schedule (High importance)
  sleepTime: 1.5,
  sleepNoise: 1.0,
  studyTime: 1.0, // formerly workSchedule

  // Cleanliness & Living Habits (High)
  roomCleaning: 1.5, // formerly cleanliness
  trash: 0.8,
  organization: 0.8,

  // Social & Privacy
  socialHabit: 1.2,
  guests: 1.0,

  // Lifestyle (Critical)
  smoking: 2.0,
  pets: 1.0,
  cooking_habit: 0.8,

  // Financial
  rentPayment: 1.0,
};

const TRAIT_LABELS: Partial<Record<PreferenceKey, Record<string, string>>> = {
  sleepTime: {
    early: "Ngủ sớm",
    late: "Cú đêm",
    poor_sleep: "Khó ngủ",
    flexible: "Linh hoạt giờ giấc",
  },
  roomCleaning: {
    daily: "Dọn dẹp hàng ngày",
    weekly: "Dọn hàng tuần",
    when_messy: "Bừa mới dọn",
    rarely: "Ít khi dọn",
  },
  socialHabit: {
    introvert: "Hướng nội",
    ambivert: "Cân bằng",
    extrovert: "Hướng ngoại",
    reserved: "Kín tiếng",
  },
  smoking: {
    hate_smoke: "Ghét thuốc lá",
    no_smoke_ok: "Không hút (OK)",
    smoke_outdoors: "Hút ngoài trời",
    smoke_indoors: "Hút trong nhà",
  },
  pets: {
    have_pet: "Có thú cưng",
    like_pet: "Yêu thú cưng",
    indifferent: "Không quan tâm",
    allergic: "Dị ứng lông",
  },
  cooking_habit: {
    cook_daily: "Nấu ăn hàng ngày",
    cook_together: "Thích nấu chung",
    cook_simple: "Nấu đơn giản",
    eat_out: "Hay ăn ngoài",
  },
  sleepNoise: {
    very_sensitive: "Rất nhạy cảm",
    somewhat_sensitive: "Hơi nhạy cảm",
    easy_sleep: "Dễ ngủ",
    very_deep: "Ngủ say như chết",
  },
  guests: {
    never: "Không tiếp khách",
    rarely: "Ít tiếp khách",
    sometimes: "Thỉnh thoảng",
    often: "Hay có khách",
  },
  studyTime: {
    morning: "Học buổi sáng",
    afternoon: "Học chiều",
    evening_night: "Học tối/đêm",
    anytime_or_cafe: "Linh hoạt/Cafe",
  },
};

export function calculateCompatibility(
  userPrefs: Partial<QuizPreferences>,
  roommatePrefs: Partial<QuizPreferences>,
): { score: number; matchingTraits: string[] } {
  let totalWeight = 0;
  let matchedWeight = 0;
  const matchingTraits: string[] = [];

  const preferenceKeys = Object.keys(PREFERENCE_WEIGHTS) as PreferenceKey[];

  for (const key of preferenceKeys) {
    const weight = PREFERENCE_WEIGHTS[key] || 0;

    // Skip if preference is missing in either profile
    // This prevents undefined === undefined from matching
    if (!userPrefs?.[key] || !roommatePrefs?.[key]) {
      // We include it in totalWeight so missing data lowers the score
      totalWeight += weight;
      continue;
    }

    totalWeight += weight;

    if (userPrefs[key] === roommatePrefs[key]) {
      matchedWeight += weight;
      const label = TRAIT_LABELS[key]?.[roommatePrefs[key] as string];
      if (label) {
        matchingTraits.push(label);
      }
    } else {
      // Partial matches for similar preferences
      const partialMatch = getPartialMatchScore(
        key,
        userPrefs[key] as string,
        roommatePrefs[key] as string,
      );
      matchedWeight += weight * partialMatch;
    }
  }

  // Avoid division by zero
  if (totalWeight === 0) return { score: 0, matchingTraits: [] };

  const score = Math.round((matchedWeight / totalWeight) * 100);
  return { score, matchingTraits: matchingTraits.slice(0, 4) };
}

function getPartialMatchScore(
  key: PreferenceKey,
  value1: string,
  value2: string,
): number {
  // Define partial match rules
  // Nested map: key -> val1 -> val2 -> score
  const partialMatches: Record<
    string,
    Record<string, Record<string, number>>
  > = {
    sleepTime: {
      early: { flexible: 0.6 },
      late: { flexible: 0.6, poor_sleep: 0.3 },
      flexible: { early: 0.6, late: 0.6, poor_sleep: 0.4 },
      poor_sleep: { late: 0.3, flexible: 0.4 },
    },
    roomCleaning: {
      daily: { weekly: 0.5 },
      weekly: { daily: 0.5, when_messy: 0.4 },
      when_messy: { weekly: 0.4, rarely: 0.5 },
      rarely: { when_messy: 0.5 },
    },
    socialHabit: {
      introvert: { ambivert: 0.6, reserved: 0.8 },
      ambivert: { introvert: 0.6, extrovert: 0.6, reserved: 0.5 },
      extrovert: { ambivert: 0.6 },
      reserved: { introvert: 0.8, ambivert: 0.5 },
    },
    sleepNoise: {
      very_sensitive: { somewhat_sensitive: 0.5 },
      somewhat_sensitive: { very_sensitive: 0.5, easy_sleep: 0.3 },
      easy_sleep: { somewhat_sensitive: 0.3, very_deep: 0.7 },
      very_deep: { easy_sleep: 0.7 },
    },
    guests: {
      never: { rarely: 0.6 },
      rarely: { never: 0.6, sometimes: 0.4 },
      sometimes: { rarely: 0.4, often: 0.5 },
      often: { sometimes: 0.5 },
    },
    pets: {
      have_pet: { like_pet: 1.0 }, // Perfect match if one has and one likes
      like_pet: { have_pet: 1.0, indifferent: 0.5 },
      indifferent: { like_pet: 0.5, allergic: 0.2 },
      allergic: { indifferent: 0.2, like_pet: 0.0, have_pet: 0.0 }, // Hard no
    },
    smoking: {
      hate_smoke: { no_smoke_ok: 0.8, smoke_outdoors: 0.2, smoke_indoors: 0.0 },
      no_smoke_ok: { hate_smoke: 0.8, smoke_outdoors: 0.5 },
      smoke_outdoors: { no_smoke_ok: 0.5, smoke_indoors: 0.5 },
      smoke_indoors: { smoke_outdoors: 0.5 },
    },
  };

  return partialMatches[key]?.[value1]?.[value2] || 0;
}

export function findMatches(
  userPrefs: Partial<QuizPreferences>,
  users: User[],
  currentUserId?: string,
): MatchResult[] {
  const results: MatchResult[] = [];

  for (const user of users) {
    if (user.id === currentUserId) continue;
    // Ensure preferences object exists
    if (!user.preferences) continue;

    const { score, matchingTraits } = calculateCompatibility(
      userPrefs,
      user.preferences,
    );
    results.push({ user, score, matchingTraits });
  }

  // Sort by score descending
  return results.sort((a, b) => b.score - a.score);
}

export function getMatchLevel(
  score: number,
): "high" | "good" | "average" | "low" {
  if (score >= 90) return "high";
  if (score >= 80) return "good";
  if (score >= 60) return "average";
  return "low";
}
