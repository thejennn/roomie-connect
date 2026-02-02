import { Room, RoomOwner, RoomUtilities } from "@/types";

export function mapApiRoomToUiRoom(apiRoom: any): Room {
  const owner: RoomOwner = {
    id: apiRoom.landlordId?._id || apiRoom.landlordId || "",
    name: apiRoom.landlordId?.fullName || "Unknown",
    phone: apiRoom.landlordId?.phone || "",
    avatar: apiRoom.landlordId?.avatarUrl || "",
    verified: apiRoom.landlordId?.isVerified || false,
    // Add other fields if necessary
  };

  const utilities: RoomUtilities = {
    electricity: apiRoom.utilities?.electricityPrice || 0,
    water: apiRoom.utilities?.waterPrice || 0,
    internet: apiRoom.utilities?.internetPrice || 0,
    cleaning: apiRoom.utilities?.cleaningFee || 0,
    parking: apiRoom.utilities?.parkingFee || 0,
  };

  const amenities: string[] = [];
  if (apiRoom.hasAirConditioner) amenities.push("Điều hòa", "air-conditioner");
  if (apiRoom.hasBed) amenities.push("Giường", "bed");
  if (apiRoom.hasWardrobe) amenities.push("Tủ quần áo", "wardrobe");
  if (apiRoom.hasWaterHeater) amenities.push("Nóng lạnh", "water-heater");
  if (apiRoom.hasKitchen) amenities.push("Bếp", "kitchen");
  if (apiRoom.hasFridge) amenities.push("Tủ lạnh", "fridge");
  if (apiRoom.hasPrivateWashing) amenities.push("Máy giặt riêng");
  if (apiRoom.hasSharedWashing)
    amenities.push("Máy giặt chung", "washing-machine");
  if (apiRoom.hasParking) amenities.push("Chỗ để xe", "parking");
  if (apiRoom.hasElevator) amenities.push("Thang máy", "elevator");
  if (apiRoom.hasSecurityCamera) amenities.push("Camera", "security");
  if (apiRoom.hasFireSafety) amenities.push("PCCC", "fire-ext");
  if (apiRoom.hasPetFriendly) amenities.push("Thú cưng", "pet", "pets");
  if (apiRoom.hasDryingArea) amenities.push("Sân phơi", "drying-area");
  if (apiRoom.hasSharedOwner) amenities.push("Chung chủ");
  if (apiRoom.isFullyFurnished) amenities.push("Full nội thất");

  return {
    id: apiRoom._id,
    title: apiRoom.title,
    description: apiRoom.description || "",
    images: apiRoom.images || [],
    price: apiRoom.price,
    deposit: apiRoom.deposit || 0,
    area: apiRoom.area || 0,
    maxOccupants: apiRoom.capacity || 1,
    floor: 1, // Default, as backend doesn't seem to have floor in interface shown
    roomType: apiRoom.capacity === 1 ? "single" : "shared", // Simple inference
    address: apiRoom.address,
    district: apiRoom.district,
    amenities: amenities,
    nearbyPlaces: [], // Backend doesn't seem to return this
    utilities: utilities,
    owner: owner,
    status: apiRoom.status,
    postedAt: apiRoom.createdAt ? new Date(apiRoom.createdAt) : new Date(),
    updatedAt: apiRoom.updatedAt ? new Date(apiRoom.updatedAt) : new Date(),
    views: 0,
  };
}
