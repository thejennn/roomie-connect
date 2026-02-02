import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { User, Room, RoommateProfile, Wallet, Notification } from "../models";

dotenv.config();

// Mock data migrated from frontend
const OWNERS_DATA = [
  {
    email: "colan@roomie.com",
    password: "password123",
    fullName: "Cô Lan",
    phone: "0912345678",
    avatarUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    isVerified: true,
    role: "landlord" as const,
  },
  {
    email: "chuhung@roomie.com",
    password: "password123",
    fullName: "Chú Hùng",
    phone: "0987654321",
    avatarUrl:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    isVerified: true,
    role: "landlord" as const,
  },
  {
    email: "emtrang@roomie.com",
    password: "password123",
    fullName: "Em Trang",
    phone: "0909123456",
    avatarUrl:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    isVerified: true,
    role: "landlord" as const,
  },
  {
    email: "bacminh@roomie.com",
    password: "password123",
    fullName: "Bác Minh",
    phone: "0901234567",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    isVerified: false,
    role: "landlord" as const,
  },
  {
    email: "cohuong@roomie.com",
    password: "password123",
    fullName: "Cô Hương",
    phone: "0934567890",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    isVerified: true,
    role: "landlord" as const,
  },
];

const USERS_DATA = [
  {
    email: "minhanh@fpt.edu.vn",
    password: "password123",
    fullName: "Minh Anh",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
    university: "FPT University",
    isVerified: true,
    role: "tenant" as const,
    preferences: {
      sleepTime: "late",
      socialHabit: "introvert",
      smoking: "hate_smoke",
      roomCleaning: "daily",
    },
  },
  {
    email: "hoanglong@vnu.edu.vn",
    password: "password123",
    fullName: "Hoàng Long",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    university: "ĐHQG Hà Nội",
    isVerified: true,
    role: "tenant" as const,
    preferences: {
      sleepTime: "early",
      socialHabit: "extrovert",
      smoking: "hate_smoke",
      roomCleaning: "weekly",
      pets: "like_pet",
    },
  },
  {
    email: "thuha@fpt.edu.vn",
    password: "password123",
    fullName: "Thu Hà",
    avatarUrl:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
    university: "FPT University",
    isVerified: false,
    role: "tenant" as const,
    preferences: {
      sleepTime: "flexible",
      socialHabit: "ambivert",
      smoking: "hate_smoke",
      roomCleaning: "weekly",
    },
  },
  {
    email: "ducanh@vnu.edu.vn",
    password: "password123",
    fullName: "Đức Anh",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
    university: "ĐHQG Hà Nội",
    isVerified: true,
    role: "tenant" as const,
    preferences: {
      sleepTime: "early",
      socialHabit: "introvert",
      smoking: "hate_smoke",
      roomCleaning: "daily",
      guests: "never",
    },
  },
  {
    email: "khanhlinh@fpt.edu.vn",
    password: "password123",
    fullName: "Khánh Linh",
    avatarUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face",
    university: "FPT University",
    isVerified: true,
    role: "tenant" as const,
    preferences: {
      sleepTime: "late",
      socialHabit: "extrovert",
      smoking: "no_smoke_ok",
      roomCleaning: "when_messy",
      guests: "often",
    },
  },
];

const ROOMS_DATA = [
  {
    title: "Studio khép kín full nội thất gần FPT University",
    description:
      "Phòng studio cao cấp, thiết kế hiện đại, phù hợp cho sinh viên và người đi làm.",
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
    ],
    price: 3500000,
    deposit: 3500000,
    area: 25,
    capacity: 2,
    address: "Số 15, Ngõ 42, Thôn Phú Vinh, Thạch Hòa",
    district: "Thạch Hòa",
    hasAirConditioner: true,
    hasBed: true,
    hasWardrobe: true,
    hasWaterHeater: true,
    hasParking: true,
    status: "active" as const,
    ownerIndex: 0,
  },
  {
    title: "Phòng ghép 2 người, full đồ gần Hola Park",
    description: "Phòng ở ghép lý tưởng cho sinh viên, giá cực kỳ tiết kiệm.",
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop",
    ],
    price: 2000000,
    deposit: 2000000,
    area: 20,
    capacity: 2,
    address: "Số 8, Đường đôi Tân Xã, Thôn 4",
    district: "Tân Xã",
    hasAirConditioner: true,
    hasFridge: true,
    hasSharedWashing: true,
    status: "active" as const,
    ownerIndex: 1,
  },
  {
    title: "Căn hộ mini view đẹp, ban công thoáng mát",
    description: "Căn hộ mini cao cấp với view tuyệt đẹp, ban công rộng rãi.",
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
    ],
    price: 4000000,
    deposit: 8000000,
    area: 30,
    capacity: 2,
    address: "Số 22, Đường Láng Hòa Lạc, Km 29",
    district: "Thạch Hòa",
    hasAirConditioner: true,
    hasKitchen: true,
    hasWaterHeater: true,
    status: "active" as const,
    ownerIndex: 2,
  },
  {
    title: "KTX mini cho sinh viên, giá siêu rẻ",
    description: "Ký túc xá mini dành cho sinh viên muốn tiết kiệm chi phí.",
    images: [
      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=600&fit=crop",
    ],
    price: 1500000,
    deposit: 1500000,
    area: 15,
    capacity: 4,
    address: "Số 5, Ngõ 15, Thôn 3, Hòa Lạc",
    district: "Thạch Thất",
    hasBed: true,
    status: "active" as const,
    ownerIndex: 3,
  },
  {
    title: "Căn hộ studio cao cấp, full tiện nghi Thạch Hòa",
    description:
      "Căn hộ studio đẳng cấp dành cho người có yêu cầu cao về chất lượng sống.",
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
    ],
    price: 5500000,
    deposit: 11000000,
    area: 35,
    capacity: 2,
    address: "Tòa nhà Golden, 100 Đại lộ Thăng Long",
    district: "Thạch Hòa",
    hasAirConditioner: true,
    hasPrivateWashing: true,
    hasElevator: true,
    hasSecurityCamera: true,
    isFullyFurnished: true,
    status: "active" as const,
    ownerIndex: 0,
  },
  {
    title: "Phòng trọ gia đình, an ninh tốt Tân Xã",
    description: "Phòng trọ trong khu dân cư yên tĩnh, an ninh đảm bảo.",
    images: [
      "https://images.unsplash.com/photo-1630699144867-37acec97df5a?w=800&h=600&fit=crop",
    ],
    price: 2800000,
    deposit: 2800000,
    area: 22,
    capacity: 2,
    address: "Số 45, Khu dân cư Tân Xã, Thôn 2",
    district: "Tân Xã",
    hasAirConditioner: true,
    hasKitchen: true,
    hasDryingArea: true,
    status: "active" as const,
    ownerIndex: 4,
  },
  {
    title: "Phòng đơn giá rẻ cho sinh viên Bình Yên",
    description:
      "Phòng nhỏ gọn, giá cả phải chăng cho sinh viên ngân sách hạn chế.",
    images: [
      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=600&fit=crop",
    ],
    price: 1800000,
    deposit: 1800000,
    area: 14,
    capacity: 1,
    address: "Số 12, Ngõ 8, Thôn Bình Yên",
    district: "Bình Yên",
    status: "active" as const,
    ownerIndex: 3,
  },
  {
    title: "Penthouse mini view toàn cảnh Hòa Lạc",
    description: "Phòng tầng thượng với view panorama tuyệt đẹp.",
    images: [
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
    ],
    price: 6000000,
    deposit: 12000000,
    area: 40,
    capacity: 2,
    address: "Penthouse, Tòa A, Hòa Lạc Residence",
    district: "Thạch Hòa",
    hasAirConditioner: true,
    hasKitchen: true,
    hasElevator: true,
    status: "active" as const,
    ownerIndex: 0,
  },
];

async function seed() {
  try {
    const MONGODB_URI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/roomie-connect";

    console.log("🌱 Starting seed process...");
    console.log(`📡 Connecting to MongoDB: ${MONGODB_URI}`);

    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    console.log("🗑️  Clearing existing data...");
    await Promise.all([
      User.deleteMany({}),
      Room.deleteMany({}),
      RoommateProfile.deleteMany({}),
      Wallet.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    // Create admin user
    console.log("👤 Creating admin user...");
    const adminPassword = await bcrypt.hash("admin123", 10);
    const admin = await User.create({
      email: "admin@roomie.com",
      password: adminPassword,
      fullName: "Admin",
      role: "admin",
      isVerified: true,
    });

    // Create owners (landlords)
    console.log("🏠 Creating landlord users...");
    const owners = [];
    for (const ownerData of OWNERS_DATA) {
      const hashedPassword = await bcrypt.hash(ownerData.password, 10);
      const owner = await User.create({
        ...ownerData,
        password: hashedPassword,
      });
      owners.push(owner);
    }

    // Create tenant users with roommate profiles
    console.log("👥 Creating tenant users...");
    for (const userData of USERS_DATA) {
      const { preferences, ...userFields } = userData;
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const user = await User.create({
        ...userFields,
        password: hashedPassword,
      });

      // Create roommate profile
      await RoommateProfile.create({
        userId: user._id,
        bio: `Sinh viên ${userData.university}`,
        university: userData.university,
        isPublic: true,
        preferences,
      });

      // Create wallet
      await Wallet.create({
        userId: user._id,
        balance: Math.floor(Math.random() * 500000),
        transactions: [],
      });
    }

    // Create rooms
    console.log("🏡 Creating rooms...");
    for (const roomData of ROOMS_DATA) {
      const { ownerIndex, ...roomFields } = roomData;
      await Room.create({
        ...roomFields,
        landlordId: owners[ownerIndex]._id,
      });
    }

    // Create some notifications for users
    console.log("🔔 Creating sample notifications...");
    const users = await User.find({ role: "tenant" }).limit(3);
    for (const user of users) {
      await Notification.create({
        userId: user._id,
        title: "Chào mừng đến Roomie Connect!",
        message:
          "Cảm ơn bạn đã đăng ký. Hãy hoàn thành quiz để tìm bạn ở phù hợp nhất!",
        type: "welcome",
        isRead: false,
      });
    }

    // Summary
    const stats = {
      users: await User.countDocuments(),
      rooms: await Room.countDocuments(),
      profiles: await RoommateProfile.countDocuments(),
      wallets: await Wallet.countDocuments(),
      notifications: await Notification.countDocuments(),
    };

    console.log(`
✅ Seed completed successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Created:
   • ${stats.users} users (1 admin, ${OWNERS_DATA.length} landlords, ${USERS_DATA.length} tenants)
   • ${stats.rooms} rooms
   • ${stats.profiles} roommate profiles
   • ${stats.wallets} wallets
   • ${stats.notifications} notifications
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 Admin login: admin@roomie.com / admin123
    `);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();
