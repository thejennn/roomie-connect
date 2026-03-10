import mongoose, { Document, Schema } from "mongoose";

/**
 * Structured memory about a user's AI interaction history.
 * Injected selectively into prompts — never the full chat log.
 */
export interface IRoommateMemoryPreferences {
  smoking?: string;    // "no" | "yes"
  sleepHabit?: string; // "early" | "late" | "flexible"
  gender?: string;     // "male" | "female" | "no_preference"
}

export interface IUserAIPreferences {
  location?: string;    // Last known preferred area (e.g. "Thạch Hòa")
  budget?: number;      // Last known max budget in VND
  genderPreference?: string; // Roommate gender preference (legacy compat)
  roommatePreferences?: IRoommateMemoryPreferences;
}

export interface IUserAIProfile extends Document {
  userId: mongoose.Types.ObjectId;
  preferences: IUserAIPreferences;
  lastIntent: string;   // Last classified intent (e.g. "FIND_ROOM")
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userAIProfileSchema = new Schema<IUserAIProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    preferences: {
      location: { type: String },
      budget: { type: Number },
      genderPreference: { type: String },
      roommatePreferences: {
        smoking: { type: String },
        sleepHabit: { type: String },
        gender: { type: String },
      },
    },
    lastIntent: { type: String, default: "UNKNOWN" },
    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const UserAIProfile = mongoose.model<IUserAIProfile>(
  "UserAIProfile",
  userAIProfileSchema,
);
