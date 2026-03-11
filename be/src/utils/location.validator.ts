/**
 * Location validation — business rule layer.
 *
 * KnockBot only operates in:
 *   - Xã Thạch Hòa  (Thạch Thất, Hà Nội)
 *   - Xã Tân Xã     (Thạch Thất, Hà Nội)
 *
 * Strategy:
 *   1. If message contains a supported area → always valid.
 *   2. If message explicitly references an out-of-scope city or district → reject.
 *   3. No location mentioned → valid (DB query enforces area constraint).
 */

/** Canonical user-facing reply for out-of-scope requests. */
export const OUT_OF_SCOPE_REPLY =
  "Hiện tại KnockBot chỉ hỗ trợ tìm phòng và tìm bạn ghép tại xã Thạch Hòa và xã Tân Xã (Thạch Thất, Hà Nội). " +
  "Bạn vui lòng tìm kiếm trong khu vực này nhé! 🏠";

/** MongoDB regex for the two supported areas — used in DB queries. */
export const SUPPORTED_AREA_REGEX = "th[aạ]ch\\s*h[oò]a|t[aâ]n\\s*x[aã]|thach\\s*hoa|tan\\s*xa";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Matches "thạch hòa", "thach hoa", "tân xã", "tan xa" variants. */
const IN_SCOPE_RE = /th[aạ]ch\s*h[oò]a|thach\s*hoa|t[aâ]n\s*x[aã]|tan\s*xa/i;

/**
 * Matches explicit mentions of cities / districts that are NOT our area.
 * Deliberately conservative — only match strong signals to avoid false positives.
 */
const OUT_OF_SCOPE_RE =
  /h[oồ]\s*ch[ií]\s*minh|hcm\b|tphcm|s[àa]i\s*g[oò]n|\bsg\b|đ[aà]\s*n[ăẵ]ng|\bcần\s*thơ\b|hải\s*phòng|vũng\s*tàu|bình\s*dương|đồng\s*nai|long\s*an|b[àa]\s*r[ịi]a|nha\s*trang|h[ộộ]i\s*an|hu[ếé]\b|qu[aậ]n\s*\d+|qu[aậ]n\s+b[iì]nh\s+th[aạ]nh|qu[aậ]n\s+th[uủ]\s+đ[uứ]c/i;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function validateLocation(
  message: string,
): { valid: true } | { valid: false; reason: string } {
  // Explicit in-scope mention → always allow
  if (IN_SCOPE_RE.test(message)) return { valid: true };

  // Explicit out-of-scope mention → reject immediately, no LLM, no coin
  if (OUT_OF_SCOPE_RE.test(message)) {
    return { valid: false, reason: OUT_OF_SCOPE_REPLY };
  }

  // No location signal → valid (DB enforces area)
  return { valid: true };
}
