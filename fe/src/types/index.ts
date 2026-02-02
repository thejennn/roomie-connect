export interface QuizPreferences {
  // Phần 1: Giờ giấc & Thói quen ngủ (5 câu)
  sleepTime: "early" | "late" | "poor_sleep" | "flexible";
  sleepNoise:
    | "very_sensitive"
    | "somewhat_sensitive"
    | "easy_sleep"
    | "very_deep";
  alarmClock: "immediate" | "snooze" | "many_alarms" | "no_alarm";
  nap: "must_nap" | "sometimes_nap" | "rarely_nap" | "never_nap";
  sleepHabits: "snore_grind" | "talk" | "sprawl" | "clean_sleep";
  // Phần 2: Vệ sinh & Ngăn nắp (6 câu)
  roomCleaning: "daily" | "weekly" | "when_messy" | "rarely";
  dishWashing: "immediately" | "end_of_day" | "delayed" | "eat_out";
  trash: "daily" | "full" | "smell" | "anywhere";
  organization:
    | "very_organized"
    | "mostly_organized"
    | "organized_chaos"
    | "very_messy";
  sharedBathroom:
    | "schedule"
    | "self_initiative"
    | "paid_cleaning"
    | "reluctant";
  pets: "have_pet" | "like_pet" | "allergic" | "indifferent";
  // Phần 3: Khách khứa & Riêng tư (5 câu)
  guests: "often" | "sometimes" | "rarely" | "never";
  oppositeGender: "comfortable" | "with_notice" | "visit_only" | "not_allowed";
  studyTime: "morning" | "afternoon" | "evening_night" | "anytime_or_cafe";
  dressing: "formal" | "casual" | "minimal" | "mood";
  speaker: "often" | "sometimes" | "headphones" | "no_media";
  // Phần 4: Tài chính & Sử dụng đồ chung (4 câu)
  utilities: "equal" | "by_usage" | "separate_meter" | "all_in_rent";
  sharedItems: "share_all" | "strictly_separate" | "ask_first" | "share_some";
  rentPayment: "on_time" | "slightly_late" | "forgetful" | "often_late";
  cooking_habit: "cook_daily" | "cook_simple" | "eat_out" | "cook_together";
  // Phần 5: Tính cách & Lối sống (5 câu)
  socialHabit: "extrovert" | "introvert" | "ambivert" | "reserved";
  smoking: "smoke_indoors" | "smoke_outdoors" | "no_smoke_ok" | "hate_smoke";
  ac_fan: "ac_always_cold" | "ac_moderate" | "ac_timer" | "fan_only";
  conflict_style: "direct" | "message" | "silent" | "tell_others";
  alcohol:
    | "often_drink"
    | "sometimes_drink"
    | "never_drink_home"
    | "cant_drink";
  // Phần 6: Câu hỏi mở rộng (5 câu)
  priority: "cleanliness" | "financial" | "personality" | "privacy";
  gender_preference: "male" | "female" | "lgbtq" | "no_preference";
  budget: "under_1.5m" | "1.5_2.5m" | "2.5_4m" | "over_4m";
  location: "near_school" | "flexible_location" | "downtown" | "quiet_area";
  duration: "short_term" | "medium_term" | "long_term" | "very_long_term";
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  age: number;
  university: string;
  major: string;
  year: number;
  bio: string;
  preferences: Partial<QuizPreferences>;
  zaloId?: string;
  verified: boolean;
}

export interface RoomUtilities {
  electricity: number; // VND per kWh
  water: number | string; // VND per m3 or "100k/người"
  internet: number; // VND per month
  cleaning: number | string; // VND per month or "Miễn phí"
  parking: number | string; // VND per month or "Miễn phí"
}

export interface RoomOwner {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  verified: boolean;
  responseRate?: number;
  facebookUrl?: string;
}

export interface Room {
  id: string;
  title: string;
  description: string;
  images: string[];
  price: number;
  deposit: number;
  area: number;
  maxOccupants: number;
  floor: number;
  roomType: "studio" | "shared" | "single" | "apartment";
  address: string;
  district: "Thạch Hòa" | "Tân Xã" | "Bình Yên" | "Thạch Thất";
  amenities?: string[];
  nearbyPlaces?: string[];
  utilities: RoomUtilities;
  owner: RoomOwner;
  status: "available" | "rented" | "pending";
  postedAt: Date;
  updatedAt: Date;
  views: number;
}

export interface MatchResult {
  user: User;
  score: number;
  matchingTraits: string[];
}
