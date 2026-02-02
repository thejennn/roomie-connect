import mongoose, { Document, Schema, Types } from "mongoose";

// Room status enum matching Supabase
export type RoomStatus = "pending" | "active" | "rejected" | "expired";

export interface IUtilities {
  electricityPrice?: number;
  waterPrice?: number;
  internetPrice?: number;
  cleaningFee?: number;
  parkingFee?: number;
}

export interface IRoom extends Document {
  title: string;
  description?: string;
  address: string;
  district: string;
  price: number;
  deposit?: number;
  area?: number;
  capacity: number;
  images: string[];
  // Amenities as boolean flags (matching Supabase schema)
  hasAirConditioner?: boolean;
  hasBed?: boolean;
  hasWardrobe?: boolean;
  hasWaterHeater?: boolean;
  hasKitchen?: boolean;
  hasFridge?: boolean;
  hasPrivateWashing?: boolean;
  hasSharedWashing?: boolean;
  hasParking?: boolean;
  hasElevator?: boolean;
  hasSecurityCamera?: boolean;
  hasFireSafety?: boolean;
  hasPetFriendly?: boolean;
  hasDryingArea?: boolean;
  hasSharedOwner?: boolean;
  isFullyFurnished?: boolean;
  // Utilities
  utilities: IUtilities;
  // Owner reference
  landlordId: Types.ObjectId;
  // Status
  status: RoomStatus;
  rejectionReason?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const utilitiesSchema = new Schema<IUtilities>(
  {
    electricityPrice: { type: Number },
    waterPrice: { type: Number },
    internetPrice: { type: Number },
    cleaningFee: { type: Number },
    parkingFee: { type: Number },
  },
  { _id: false },
);

const roomSchema = new Schema<IRoom>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    address: { type: String, required: true },
    district: { type: String, required: true },
    price: { type: Number, required: true },
    deposit: { type: Number },
    area: { type: Number },
    capacity: { type: Number, default: 1 },
    images: [{ type: String }],
    // Amenities
    hasAirConditioner: { type: Boolean, default: false },
    hasBed: { type: Boolean, default: false },
    hasWardrobe: { type: Boolean, default: false },
    hasWaterHeater: { type: Boolean, default: false },
    hasKitchen: { type: Boolean, default: false },
    hasFridge: { type: Boolean, default: false },
    hasPrivateWashing: { type: Boolean, default: false },
    hasSharedWashing: { type: Boolean, default: false },
    hasParking: { type: Boolean, default: false },
    hasElevator: { type: Boolean, default: false },
    hasSecurityCamera: { type: Boolean, default: false },
    hasFireSafety: { type: Boolean, default: false },
    hasPetFriendly: { type: Boolean, default: false },
    hasDryingArea: { type: Boolean, default: false },
    hasSharedOwner: { type: Boolean, default: false },
    isFullyFurnished: { type: Boolean, default: false },
    // Utilities
    utilities: { type: utilitiesSchema, default: () => ({}) },
    // Owner
    landlordId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    // Status
    status: {
      type: String,
      enum: ["pending", "active", "rejected", "expired"],
      default: "pending",
    },
    rejectionReason: { type: String },
    expiresAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

// Indexes for common queries
roomSchema.index({ status: 1 });
roomSchema.index({ district: 1 });
roomSchema.index({ price: 1 });
roomSchema.index({ landlordId: 1 });
roomSchema.index({ createdAt: -1 });

export const Room = mongoose.model<IRoom>("Room", roomSchema);
