/**
 * Budget Parser — Vietnamese price string → VND integer.
 *
 * Supported formats:
 *   "dưới 3 triệu"  → 3_000_000
 *   "3tr"            → 3_000_000
 *   "3000k"          → 3_000_000
 *   "2.5 triệu"     → 2_500_000
 *   "2,5tr"          → 2_500_000
 *   "500k"           → 500_000
 *   "3500000"        → 3_500_000
 *
 * Rules:
 * - Always treated as MAX budget ("dưới" / "không quá").
 * - Decimal comma and dot are interchangeable.
 * - Returns null if no price is found.
 */

interface PricePattern {
  regex: RegExp;
  multiplier: number;
}

/**
 * Ordered from most specific to least specific.
 * "triệu/tr" checked BEFORE "k" to avoid partial matches on "trọ" etc.
 */
const PRICE_PATTERNS: PricePattern[] = [
  // "3 triệu", "2.5 triệu", "2,5triệu"
  { regex: /(\d+(?:[.,]\d+)?)\s*(?:triệu|tr)\b/i, multiplier: 1_000_000 },
  // "3000k", "500k"
  { regex: /(\d+(?:[.,]\d+)?)\s*k\b/i, multiplier: 1_000 },
  // Raw 7+ digit numbers: "3000000", "2500000"
  { regex: /(\d{7,})/, multiplier: 1 },
];

/**
 * Parse a Vietnamese price mention into VND.
 *
 * @returns Price in VND (integer) or null if no price found.
 */
export function parseBudget(message: string): number | null {
  for (const { regex, multiplier } of PRICE_PATTERNS) {
    const m = message.match(regex);
    if (m) {
      const value = parseFloat(m[1].replace(",", "."));
      if (isNaN(value) || value <= 0) continue;
      return Math.round(value * multiplier);
    }
  }
  return null;
}
