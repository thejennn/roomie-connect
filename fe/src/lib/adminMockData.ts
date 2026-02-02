export type RoomStatus = 'pending' | 'active' | 'hidden' | 'rejected';

export const mockStats = {
  revenueMonthly: [
    { month: 'Jan', revenue: 12000000 },
    { month: 'Feb', revenue: 15000000 },
    { month: 'Mar', revenue: 9000000 },
    { month: 'Apr', revenue: 18000000 },
    { month: 'May', revenue: 21000000 },
    { month: 'Jun', revenue: 15000000 },
  ],
  userGrowth: [
    { month: 'Jan', landlords: 5, tenants: 20 },
    { month: 'Feb', landlords: 8, tenants: 30 },
    { month: 'Mar', landlords: 4, tenants: 18 },
    { month: 'Apr', landlords: 10, tenants: 25 },
    { month: 'May', landlords: 12, tenants: 40 },
    { month: 'Jun', landlords: 9, tenants: 28 },
  ],
  totals: {
    revenue: 150000000,
    users: 1240,
    newRooms: 18,
    closeRate: 0.42,
  },
  recentActivity: [
    'Nguyễn Văn A vừa nạp 500.000₫',
    'Phòng "Studio Hòa Lạc" vừa được duyệt',
    'Lê Thị B đã báo cáo tin giả',
    'Phùng Thanh Độ đã trở thành chủ trọ',
  ],
};

export type MockRoom = {
  id: string;
  title: string;
  landlord: string;
  price: number;
  postedAt: string;
  thumbnail?: string;
  status: RoomStatus;
  address: string;
};

export const mockPendingRooms: MockRoom[] = [
  {
    id: 'r1',
    title: 'Phòng trọ gần FPT - 20m²',
    landlord: 'Phùng Thanh Độ',
    price: 2500000,
    postedAt: '2026-01-10',
    status: 'pending',
    address: 'Thạch Hòa, Hòa Lạc',
  },
  {
    id: 'r2',
    title: 'Studio mini Hòa Lạc',
    landlord: 'Lê Thị Riêng',
    price: 3500000,
    postedAt: '2026-01-12',
    status: 'pending',
    address: 'Tân Xã, Hòa Lạc',
  },
  {
    id: 'r3',
    title: 'Phòng có gác gần trường',
    landlord: 'Nguyễn Văn C',
    price: 1800000,
    postedAt: '2026-01-14',
    status: 'pending',
    address: 'Bình Yên, Thạch Thất',
  },
  {
    id: 'r4',
    title: 'Căn hộ mini - đầy đủ tiện nghi',
    landlord: 'Trần Thị D',
    price: 4200000,
    postedAt: '2026-01-15',
    status: 'pending',
    address: 'Hạ Bằng, Hòa Lạc',
  },
  {
    id: 'r5',
    title: 'Phòng cho thuê giá rẻ',
    landlord: 'Hoàng Văn E',
    price: 1200000,
    postedAt: '2026-01-16',
    status: 'pending',
    address: 'Hola Park, Hòa Lạc',
  },
];

export type MockUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'landlord' | 'tenant' | 'admin';
  wallet?: number;
  status: 'active' | 'banned';
  avatar?: string;
  address?: string;
};

export const mockUsers: MockUser[] = [
  { id: 'u1', name: 'Phùng Thanh Độ', email: 'phung.do@example.com', phone: '0901234001', role: 'landlord', wallet: 5000000, status: 'active', address: 'Thạch Hòa, Hòa Lạc' },
  { id: 'u2', name: 'Lê Thị Riêng', email: 'le.riêng@example.com', phone: '0901234002', role: 'landlord', wallet: 3000000, status: 'active', address: 'Tân Xã, Hòa Lạc' },
  { id: 'u3', name: 'Nguyễn Văn A', email: 'nguyenvana@example.com', phone: '0901234003', role: 'tenant', status: 'active', address: 'Hạ Bằng' },
  { id: 'u4', name: 'Trần Thị B', email: 'tranb@example.com', phone: '0901234004', role: 'tenant', status: 'active' },
  { id: 'u5', name: 'Hoàng Văn E', email: 'hoang.e@example.com', phone: '0901234005', role: 'landlord', wallet: 1200000, status: 'active' },
  { id: 'u6', name: 'Ngô Minh F', email: 'ngominhf@example.com', phone: '0901234006', role: 'tenant', status: 'banned' },
  { id: 'u7', name: 'Phạm Thị G', email: 'phamg@example.com', phone: '0901234007', role: 'tenant', status: 'active' },
  { id: 'u8', name: 'Lương Văn H', email: 'luongh@example.com', phone: '0901234008', role: 'landlord', wallet: 800000, status: 'active' },
  { id: 'u9', name: 'Đỗ Văn I', email: 'dovani@example.com', phone: '0901234009', role: 'tenant', status: 'active' },
  { id: 'u10', name: 'Bùi Thị K', email: 'buik@example.com', phone: '0901234010', role: 'tenant', status: 'active' },
];