# Tài Liệu: Bộ Lọc Phòng Trọ Ngang

## Tổng Quan
Bộ lọc phòng trọ được thiết kế với giao diện ngang, gồm 2 phần chính:

1. **Thanh Chip Lọc Nhanh**: Các bộ lọc cơ bản (Gần FPT U, Gần ĐHQG, có điều hoà, v.v)
2. **Bộ Lọc Nâng Cao**: 6 hạng mục lọc chính với các tuỳ chọn chi tiết

---

## Cấu Trúc File

### 1. `/src/components/RoomFilters.tsx`
Component chính để hiển thị bộ lọc nâng cao.

**State:**
```typescript
interface RoomFiltersState {
  areas: string[];              // Khu vực (thach-hoa, tan-xa)
  priceRange: [number, number]; // Mức giá (min, max)
  sizes: string[];              // Diện tích (under-20, 20-40, over-40)
  roomTypes: string[];          // Kiểu phòng (studio, duplex, bed-1, bed-2, bed-3)
  regulations: string[];        // Quy định (shared-owner, pets)
  amenities: string[];          // Tiện ích (smart-lock, parking, v.v)
  furniture: string[];          // Nội thất (wardrobe, bed, desk, v.v)
}
```

**Props:**
- `filters`: Trạng thái hiện tại của các bộ lọc
- `onFiltersChange`: Callback khi thay đổi bộ lọc
- `onClear`: Callback để xoá tất cả bộ lọc

### 2. `/src/constants/filterOptions.ts`
Chứa tất cả các tuỳ chọn lọc:

```typescript
export const FILTER_OPTIONS = {
  areas: [
    { id: 'thach-hoa', label: 'Thạch Hòa' },
    { id: 'tan-xa', label: 'Tân Xã' },
  ],
  sizes: [
    { id: 'under-20', label: 'Dưới 20 m²' },
    { id: '20-40', label: '20-40 m²' },
    { id: 'over-40', label: 'Trên 40 m²' },
  ],
  // ... v.v
}
```

### 3. `/src/pages/FindRoom.tsx`
Trang chính để hiển thị và sử dụng bộ lọc.

---

## Các Bộ Lọc Chi Tiết

### 1. **Khu Vực**
- Thạch Hòa
- Tân Xã

### 2. **Mức Giá**
- Slider từ 1 triệu đến 6 triệu VNĐ
- Hiển thị giá trị đã chọn

### 3. **Diện Tích**
- Dưới 20 m²
- 20-40 m²
- Trên 40 m²

### 4. **Kiểu Phòng**
- Studio
- Duplex
- 1 Phòng Ngủ
- 2 Phòng Ngủ
- 3 Phòng Ngủ

### 5. **Quy Định**
- Chung Chủ
- Nuôi Thú Cưng

### 6. **Tiện Ích**
- Khoá Cổng Thông Minh
- Chỗ Để Xe
- Bình Chữa Cháy
- Máy Giặt Chung
- Thang Máy
- Khu Phơi Quần Áo Chung
- Khu Sạc Xe Điện

### 7. **Nội Thất**
- Tủ Quần Áo
- Giường
- Giá Giày Dép
- Bàn Học
- Bếp Ga

---

## Giao Diện & Tương Tác

### Thanh Chip Ngang
```
[Gần FPT U] [Gần ĐHQG] [Gần Hola Park] [Có điều hoà] [WC khép kín] [Chính chủ]
```

### Bộ Lọc Nâng Cao (Khi nhấn nút Filter)
```
┌─────────────────────────────────────┐
│ Bộ Lọc Tìm Kiếm    [Xoá Tất Cả]    │
├─────────────────────────────────────┤
│ Mức Giá: 1 - 6 triệu               │
│ [──────────────────────────]         │
├─────────────────────────────────────┤
│ ▼ Khu Vực (0 được chọn)             │
│   ☐ Thạch Hòa                       │
│   ☐ Tân Xã                         │
├─────────────────────────────────────┤
│ ▼ Diện Tích (0 được chọn)           │
│   ☐ Dưới 20 m²                      │
│   ☐ 20-40 m²                        │
│   ☐ Trên 40 m²                      │
├─────────────────────────────────────┤
│ ▼ Kiểu Phòng (0 được chọn)          │
│   ☐ Studio                          │
│   ☐ Duplex                          │
│   ... và các tuỳ chọn khác          │
└─────────────────────────────────────┘
```

### Hiển Thị Bộ Lọc Hoạt Động
```
ĐANG LỌC:
[Thạch Hòa ✕] [Studio ✕] [Giường ✕]
```

---

## Cách Sử Dụng

### Import Component:
```tsx
import { RoomFilters, type RoomFiltersState } from '@/components/RoomFilters';
import { FILTER_OPTIONS } from '@/constants/filterOptions';

const DEFAULT_FILTERS: RoomFiltersState = {
  areas: [],
  priceRange: [1000000, 6000000],
  sizes: [],
  roomTypes: [],
  regulations: [],
  amenities: [],
  furniture: [],
};
```

### Sử Dụng trong Component:
```tsx
const [roomFilters, setRoomFilters] = useState<RoomFiltersState>(DEFAULT_FILTERS);

<RoomFilters
  filters={roomFilters}
  onFiltersChange={setRoomFilters}
  onClear={() => setRoomFilters(DEFAULT_FILTERS)}
/>
```

### Logic Lọc:
Dựa trên `roomFilters` state, lọc phòng:
```typescript
- Khu vực: So sánh `room.district` với `filters.areas`
- Giá: So sánh `room.price` với `filters.priceRange`
- Diện tích: So sánh `room.area` với `filters.sizes`
- Kiểu phòng: So sánh `room.roomType` với `filters.roomTypes`
- Quy định: Kiểm tra `room.owner.verified` hoặc amenities có "pet"
- Tiện ích: Kiểm tra `room.amenities` array
- Nội thất: Kiểm tra `room.amenities` array
```

---

## Styling & Thư Viện

- **UI Components**: shadcn/ui (Button, Slider, etc.)
- **Animation**: Framer Motion (AnimatePresence, motion.div)
- **Icons**: Lucide React (ChevronDown, X)
- **Utilities**: `cn()` từ `@/lib/utils` để kết hợp className

---

## Mở Rộng Trong Tương Lai

Để thêm bộ lọc mới:

1. Thêm vào `FILTER_OPTIONS` trong `/src/constants/filterOptions.ts`
2. Thêm vào `RoomFiltersState` interface
3. Thêm logic lọc trong `filteredRooms.useMemo()` ở FindRoom.tsx
4. (Optional) Thêm `FilterCategory` component nếu cần

---

## Ghi Chú

- Tất cả các giá trị ID trong filter tuân theo convention: kebab-case
- Component hỗ trợ multiple selection (chọn nhiều tuỳ chọn trong 1 category)
- Slider giá hỗ trợ range selection
- Các bộ lọc hoạt động independently (có thể kết hợp bất kỳ filter nào)
