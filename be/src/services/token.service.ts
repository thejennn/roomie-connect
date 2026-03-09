import { ResponseType, CHARGEABLE_TYPES } from "./response.types";

/**
 * KnockCoin Charging Decision Service
 *
 * Single rule: charge ONLY when responseType ∈ { DB_SUCCESS, LLM_SUCCESS }.
 * Every other responseType is always free.
 *
 * The decision is made AFTER the pipeline determines the responseType,
 * never before.  This ensures transparent, predictable billing.
 */

/**
 * Determines whether to deduct a KnockCoin for this AI interaction.
 * Pure function — no side effects.
 *
 * @param responseType — the finalised pipeline outcome.
 */
export function shouldChargeToken(responseType: ResponseType): boolean {
  return CHARGEABLE_TYPES.has(responseType);
}
