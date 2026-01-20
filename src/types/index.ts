export interface QuizPreferences {
  sleepTime: 'early' | 'normal' | 'late' | 'flexible';
  cleanliness: 'very_clean' | 'clean' | 'moderate' | 'relaxed';
  socialHabit: 'introvert' | 'ambivert' | 'extrovert';
  smoking: 'never' | 'sometimes' | 'often';
  pet: 'love' | 'ok' | 'no';
  cooking: 'often' | 'sometimes' | 'never';
  noise: 'quiet' | 'moderate' | 'loud';
  guests: 'never' | 'rarely' | 'sometimes' | 'often';
  workSchedule: 'morning' | 'afternoon' | 'evening' | 'flexible';
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
  preferences: QuizPreferences;
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
  roomType: 'studio' | 'shared' | 'single' | 'apartment';
  address: string;
  district: 'Thạch Hòa' | 'Tân Xã' | 'Bình Yên' | 'Thạch Thất';
  amenities: string[];
  nearbyPlaces: string[];
  utilities: RoomUtilities;
  owner: RoomOwner;
  status: 'available' | 'rented' | 'pending';
  postedAt: Date;
  updatedAt: Date;
  views: number;
}

export interface MatchResult {
  user: User;
  score: number;
  matchingTraits: string[];
}


