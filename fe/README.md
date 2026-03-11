# KnockKnock — Frontend

Giao diện web cho ứng dụng **KnockKnock** — nền tảng tìm phòng trọ & bạn ở ghép dành cho sinh viên khu vực Hoà Lạc.

## Tech Stack

- **Build Tool**: Vite
- **Language**: TypeScript
- **UI Framework**: React 18
- **Routing**: React Router DOM v6
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS + tailwindcss-animate
- **Animation**: Framer Motion
- **Form Handling**: React Hook Form + Zod validation
- **State Management**: React Context API + TanStack React Query
- **Charts**: Recharts
- **HTTP Client**: Fetch API (custom apiClient wrapper)
- **Testing**: Vitest + Testing Library
- **Font**: Be Vietnam Pro

## Cách chạy

### 1. Cài đặt dependencies

```bash
cd fe
npm install
```

### 2. Chạy development server

```bash
npm run dev
```

App sẽ chạy tại `http://localhost:5173`.

> **Lưu ý**: Đảm bảo backend đang chạy tại `http://localhost:5000` để các tính năng API hoạt động.

### 3. Build production

```bash
npm run build
npm run preview
```

### 4. Chạy test

```bash
npm run test
```

## Cấu trúc thư mục

```
fe/src/
├── main.tsx               # Entry point
├── App.tsx                # Root component + routing
├── index.css              # Global styles + CSS variables
├── components/
│   ├── Layout.tsx         # Main layout wrapper
│   ├── Navbar.tsx         # Navigation bar
│   ├── BottomNav.tsx      # Mobile bottom navigation
│   ├── RoomCard.tsx       # Room listing card
│   ├── RoomFilters.tsx    # Room search filters
│   ├── layouts/           # Role-specific layouts
│   └── ui/                # shadcn/ui components
├── contexts/
│   └── AuthContext.tsx    # Authentication state
├── hooks/                 # Custom React hooks
├── lib/
│   ├── api.ts             # API client
│   ├── utils.ts           # Utility functions
│   └── format.ts          # Formatting helpers
├── pages/
│   ├── Landing.tsx        # Trang chủ
│   ├── FindRoom.tsx       # Tìm phòng
│   ├── Profile.tsx        # Hồ sơ cá nhân
│   ├── EditProfile.tsx    # Chỉnh sửa hồ sơ
│   ├── auth/              # Đăng nhập / Đăng ký
│   ├── tenant/            # Trang tenant (AI Chat, Dashboard)
│   ├── landlord/          # Trang chủ trọ
│   └── admin/             # Trang quản trị
├── types/                 # TypeScript type definitions
└── utils/                 # Utility functions
```

## Tính năng chính

- **Tìm phòng trọ**: Tìm kiếm & lọc phòng theo giá, khu vực, tiện ích
- **AI Chat (KnockBot)**: Trợ lý AI tìm phòng & bạn ở ghép thông minh
- **KnockCoin**: Hệ thống xu để sử dụng tính năng AI
- **Tìm bạn ở ghép**: Quiz tính cách & AI matching
- **Dashboard Landlord**: Quản lý phòng, ví, đăng tin cho thuê
- **Dashboard Admin**: Quản lý người dùng, thống kê hệ thống
