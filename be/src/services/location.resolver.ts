/**
 * Location Resolver — Manages the Hòa Lạc location hierarchy.
 *
 * Supported area hierarchy:
 *
 *   Hòa Lạc (parent / alias)
 *   ├── Thạch Hòa
 *   └── Tân Xã
 *
 * Rules:
 * - "Hòa Lạc" → query BOTH Thạch Hòa and Tân Xã.
 * - "Thạch Hòa" → query Thạch Hòa only.
 * - "Tân Xã" → query Tân Xã only.
 * - Any other explicit location → OUT_OF_SCOPE (no coin charge).
 * - No location mentioned → query both (default scope).
 */

// ---------------------------------------------------------------------------
// Vietnamese normalisation
// ---------------------------------------------------------------------------

/**
 * Normalise Vietnamese text by stripping diacritics and lowering case.
 * Used for fuzzy location matching so "Thạch Hòa" ≈ "thach hoa".
 */
export function normalizeVietnamese(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  // strip combining diacritical marks
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

// ---------------------------------------------------------------------------
// Location extraction
// ---------------------------------------------------------------------------

/** Location extraction result. */
export interface ExtractedLocation {
  /** Raw matched text (may contain diacritics). */
  raw: string;
  /** Normalised (no diacritics, lowercase). */
  normalised: string;
}

/**
 * Patterns to extract a location from a user message.
 * Ordered: most specific first.
 */
const LOCATION_EXTRACT_PATTERNS: RegExp[] = [
  // "ở Hòa Lạc", "tại Thạch Hòa", "khu vực Tân Xã"
  /(?:ở|tại|khu(?:\s*vực)?|gần|quanh|vùng)\s+([a-zA-Z\u00C0-\u1EF9]+(?:\s+[a-zA-Z\u00C0-\u1EF9]+){0,4})/i,
  // "quận ...", "huyện ...", "thị xã ..."
  /(?:quận|q\.?|huyện|thị\s*xã|tx\.?|phường|xã)\s+(\d+|[a-zA-Z\u00C0-\u1EF9]+(?:\s+[a-zA-Z\u00C0-\u1EF9]+){0,3})/i,
];

/**
 * Extract a location mention from the user message.
 * Returns null if no location is found.
 */
export function extractLocation(message: string): ExtractedLocation | null {
  for (const pattern of LOCATION_EXTRACT_PATTERNS) {
    const m = message.match(pattern);
    if (m && m[1]) {
      const raw = m[1].trim();
      return { raw, normalised: normalizeVietnamese(raw) };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Supported location resolution
// ---------------------------------------------------------------------------

/** Canonical ward/commune names that KnockBot supports. */
const SUPPORTED_WARDS = ["Thạch Hòa", "Tân Xã"] as const;
export type SupportedWard = (typeof SUPPORTED_WARDS)[number];

/** MongoDB-compatible regex fragment for each ward. */
const WARD_REGEX: Record<SupportedWard, string> = {
  "Thạch Hòa": "th[aạ]ch\\s*h[oò]a|thach\\s*hoa",
  "Tân Xã": "t[aâ]n\\s*x[aã]|tan\\s*xa",
};

/** Combined regex for ALL supported wards (default scope). */
export const ALL_WARDS_REGEX = Object.values(WARD_REGEX).join("|");

/** Parent/alias terms that map to ALL supported wards. */
const PARENT_ALIASES_NORMALISED = [
  "hoa lac",     // Hòa Lạc
  "hoalac",
  "thach that",  // Thạch Thất (huyện)
  "thachhat",
];

/** Known out-of-scope cities/districts — fast rejection list. */
const OUT_OF_SCOPE_RE =
  /h[oồ]\s*ch[ií]\s*minh|hcm\b|tphcm|s[àa]i\s*g[oò]n|\bsg\b|đ[aà]\s*n[ăẵ]ng|\bcần\s*thơ\b|hải\s*phòng|vũng\s*tàu|bình\s*dương|đồng\s*nai|long\s*an|b[àa]\s*r[ịi]a|nha\s*trang|h[ộộ]i\s*an|hu[ếé]\b|qu[aậ]n\s*\d+|qu[aậ]n\s+b[iì]nh\s+th[aạ]nh|qu[aậ]n\s+th[uủ]\s+đ[uứ]c|ba\s*v[ìi]|s[oơ]n\s*t[aâ]y|h[àa]\s*đ[oô]ng|c[âầ]u\s*gi[aấ]y|t[aâ]y\s*h[oồ]|ho[àa]ng\s*mai|thanh\s*xu[aâ]n|đ[oố]ng\s*đa|hai\s*b[àa]\s*tr[uư]ng|long\s*bi[eê]n/i;

export type LocationResolution =
  | { supported: true; wards: SupportedWard[]; regexFilter: string }
  | { supported: false; reason: string };

/**
 * Resolve a user message into concrete supported wards.
 *
 * Decision tree:
 * 1. Check for explicit supported ward mention → return that ward.
 * 2. Check for parent alias (Hòa Lạc) → return ALL wards.
 * 3. Check for explicit out-of-scope location → reject.
 * 4. No location at all → return ALL wards (default scope).
 */
export function resolveSupportedLocations(message: string): LocationResolution {
  const norm = normalizeVietnamese(message);

  // ── 1. Explicit ward mention ──
  if (/th[a]ch\s*h[o]a|thach\s*hoa/.test(norm)) {
    return {
      supported: true,
      wards: ["Thạch Hòa"],
      regexFilter: WARD_REGEX["Thạch Hòa"],
    };
  }
  if (/t[a]n\s*x[a]|tan\s*xa/.test(norm)) {
    return {
      supported: true,
      wards: ["Tân Xã"],
      regexFilter: WARD_REGEX["Tân Xã"],
    };
  }

  // ── 2. Parent alias (Hòa Lạc / Thạch Thất) → both wards ──
  for (const alias of PARENT_ALIASES_NORMALISED) {
    if (norm.includes(alias)) {
      return {
        supported: true,
        wards: [...SUPPORTED_WARDS],
        regexFilter: ALL_WARDS_REGEX,
      };
    }
  }

  // ── 3. Explicit out-of-scope ──
  if (OUT_OF_SCOPE_RE.test(message)) {
    return {
      supported: false,
      reason:
        "Hiện tại KnockBot chỉ hỗ trợ tìm phòng và tìm bạn ghép tại khu vực Hòa Lạc " +
        "(xã Thạch Hòa và xã Tân Xã, Thạch Thất, Hà Nội). " +
        "Bạn vui lòng tìm kiếm trong khu vực này nhé! 🏠",
    };
  }

  // ── 4. No location → default to all supported wards ──
  return {
    supported: true,
    wards: [...SUPPORTED_WARDS],
    regexFilter: ALL_WARDS_REGEX,
  };
}
