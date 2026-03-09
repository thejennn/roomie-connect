import mongoose from "mongoose";
import {
  UserAIProfile,
  IUserAIPreferences,
  IRoommateMemoryPreferences,
} from "../models/UserAIProfile";
import { Intent } from "./intent.service";

/**
 * Memory Service — Structured per-user AI context store.
 *
 * Design rules:
 * - Only structured fields are stored (location, budget, roommatePreferences).
 * - Raw chat history is NEVER injected into prompts — only structured labels.
 * - Writes are fire-and-forget (upsert) and never block the response pipeline.
 * - Memory is injected into prompts only for GENERAL_QA, not DB-routed intents.
 * - Roommate preferences (smoking, sleepHabit, gender) carry across sessions.
 */

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

/**
 * Load a user's structured AI preferences.
 * Returns null (not throws) if no profile exists yet.
 */
export async function loadMemory(
  userId: string,
): Promise<IUserAIPreferences | null> {
  try {
    const profile = await UserAIProfile.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    })
      .select("preferences")
      .lean();
    return profile?.preferences ?? null;
  } catch {
    return null; // memory failure must never crash the request
  }
}

/**
 * Load only the roommate-specific preferences from memory.
 * Used by the FIND_ROOMMATE pipeline to inject past preferences.
 */
export async function loadRoommateMemory(
  userId: string,
): Promise<IRoommateMemoryPreferences | null> {
  const mem = await loadMemory(userId);
  return mem?.roommatePreferences ?? null;
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

export interface MemoryUpdate {
  location?: string;
  budget?: number;
  genderPreference?: string;
  roommatePreferences?: Partial<IRoommateMemoryPreferences>;
}

/**
 * Upsert the user's AI profile with the latest intent and any parsed preferences.
 * Partial updates — only non-null fields overwrite stored values.
 * Called after the pipeline completes so it never delays the HTTP response.
 */
export async function updateMemory(
  userId: string,
  intent: Intent,
  updates: MemoryUpdate,
): Promise<void> {
  try {
    const set: Record<string, unknown> = {
      lastIntent: intent,
      lastActiveAt: new Date(),
    };

    if (updates.location) set["preferences.location"] = updates.location;
    if (updates.budget) set["preferences.budget"] = updates.budget;
    if (updates.genderPreference)
      set["preferences.genderPreference"] = updates.genderPreference;

    // Roommate sub-preferences — granular upsert
    if (updates.roommatePreferences) {
      const rp = updates.roommatePreferences;
      if (rp.smoking)
        set["preferences.roommatePreferences.smoking"] = rp.smoking;
      if (rp.sleepHabit)
        set["preferences.roommatePreferences.sleepHabit"] = rp.sleepHabit;
      if (rp.gender)
        set["preferences.roommatePreferences.gender"] = rp.gender;
    }

    await UserAIProfile.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      { $set: set },
      { upsert: true, new: true },
    );
  } catch (err) {
    // Log but swallow — memory write failure must not affect the user response
    console.error(`[Memory] Failed to update profile userId=${userId}: ${err}`);
  }
}
