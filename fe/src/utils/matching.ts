import { QuizPreferences, User, MatchResult } from '@/types';

type PreferenceKey = keyof QuizPreferences;

const PREFERENCE_WEIGHTS: Record<PreferenceKey, number> = {
  sleepTime: 1.5,
  cleanliness: 1.5,
  socialHabit: 1.2,
  smoking: 2.0, // High importance
  pet: 1.0,
  cooking: 0.8,
  noise: 1.3,
  guests: 1.0,
  workSchedule: 0.7,
};

const TRAIT_LABELS: Record<PreferenceKey, Record<string, string>> = {
  sleepTime: {
    early: 'Ngủ sớm',
    normal: 'Giờ giấc bình thường',
    late: 'Cú đêm',
    flexible: 'Linh hoạt giờ giấc',
  },
  cleanliness: {
    very_clean: 'Rất sạch sẽ',
    clean: 'Ngăn nắp',
    moderate: 'Bình thường',
    relaxed: 'Thoải mái',
  },
  socialHabit: {
    introvert: 'Hướng nội',
    ambivert: 'Cân bằng',
    extrovert: 'Hướng ngoại',
  },
  smoking: {
    never: 'Không hút thuốc',
    sometimes: 'Thỉnh thoảng hút',
    often: 'Hay hút thuốc',
  },
  pet: {
    love: 'Yêu thú cưng',
    ok: 'OK với thú cưng',
    no: 'Không nuôi thú cưng',
  },
  cooking: {
    often: 'Hay nấu ăn',
    sometimes: 'Thỉnh thoảng nấu',
    never: 'Không nấu ăn',
  },
  noise: {
    quiet: 'Thích yên tĩnh',
    moderate: 'Ồn vừa phải',
    loud: 'OK với tiếng ồn',
  },
  guests: {
    never: 'Không tiếp khách',
    rarely: 'Ít tiếp khách',
    sometimes: 'Thỉnh thoảng có khách',
    often: 'Hay có khách',
  },
  workSchedule: {
    morning: 'Làm việc sáng',
    afternoon: 'Làm việc chiều',
    evening: 'Làm việc tối',
    flexible: 'Linh hoạt',
  },
};

export function calculateCompatibility(
  userPrefs: QuizPreferences,
  roommatePrefs: QuizPreferences
): { score: number; matchingTraits: string[] } {
  let totalWeight = 0;
  let matchedWeight = 0;
  const matchingTraits: string[] = [];

  const preferenceKeys = Object.keys(PREFERENCE_WEIGHTS) as PreferenceKey[];

  for (const key of preferenceKeys) {
    const weight = PREFERENCE_WEIGHTS[key];
    totalWeight += weight;

    if (userPrefs[key] === roommatePrefs[key]) {
      matchedWeight += weight;
      const label = TRAIT_LABELS[key][roommatePrefs[key]];
      if (label) {
        matchingTraits.push(label);
      }
    } else {
      // Partial matches for similar preferences
      const partialMatch = getPartialMatchScore(key, userPrefs[key], roommatePrefs[key]);
      matchedWeight += weight * partialMatch;
    }
  }

  const score = Math.round((matchedWeight / totalWeight) * 100);
  return { score, matchingTraits: matchingTraits.slice(0, 4) };
}

function getPartialMatchScore(
  key: PreferenceKey,
  value1: string,
  value2: string
): number {
  // Define partial match rules
  const partialMatches: Record<string, Record<string, Record<string, number>>> = {
    sleepTime: {
      early: { normal: 0.5 },
      normal: { early: 0.5, late: 0.5 },
      late: { normal: 0.5 },
      flexible: { early: 0.7, normal: 0.8, late: 0.7 },
    },
    cleanliness: {
      very_clean: { clean: 0.6 },
      clean: { very_clean: 0.6, moderate: 0.4 },
      moderate: { clean: 0.4, relaxed: 0.5 },
      relaxed: { moderate: 0.5 },
    },
    socialHabit: {
      introvert: { ambivert: 0.5 },
      ambivert: { introvert: 0.5, extrovert: 0.5 },
      extrovert: { ambivert: 0.5 },
    },
    noise: {
      quiet: { moderate: 0.3 },
      moderate: { quiet: 0.3, loud: 0.3 },
      loud: { moderate: 0.3 },
    },
    guests: {
      never: { rarely: 0.5 },
      rarely: { never: 0.5, sometimes: 0.5 },
      sometimes: { rarely: 0.5, often: 0.4 },
      often: { sometimes: 0.4 },
    },
    pet: {
      love: { ok: 0.6 },
      ok: { love: 0.6, no: 0.3 },
      no: { ok: 0.3 },
    },
  };

  return partialMatches[key]?.[value1]?.[value2] || 0;
}

export function findMatches(
  userPrefs: QuizPreferences,
  users: User[],
  currentUserId?: string
): MatchResult[] {
  const results: MatchResult[] = [];

  for (const user of users) {
    if (user.id === currentUserId) continue;

    const { score, matchingTraits } = calculateCompatibility(userPrefs, user.preferences);
    results.push({ user, score, matchingTraits });
  }

  // Sort by score descending
  return results.sort((a, b) => b.score - a.score);
}

export function getMatchLevel(score: number): 'high' | 'good' | 'average' | 'low' {
  if (score >= 90) return 'high';
  if (score >= 80) return 'good';
  if (score >= 60) return 'average';
  return 'low';
}


