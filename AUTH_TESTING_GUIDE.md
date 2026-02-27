# Authentication Flow - Quick Reference & Testing Guide

## Quick Start

### 1. Start Backend Server
```bash
cd be
npm run dev
# Server runs on http://localhost:5000
```

### 2. Start Frontend
```bash
cd fe
npm run dev
# App runs on http://localhost:5173
```

### 3. Seed Database (Optional - for real users)
```bash
cd be
npm run seed
# Creates sample users, rooms, and data
```

---

## Demo Account Credentials

### Tenant (Người Tìm Trọ)
- **Email**: `tenant@demo.com`
- **Password**: `demo`
- **Redirects to**: `/tenant/ai-chat`

### Landlord (Chủ Trọ)
- **Email**: `landlord@demo.com`
- **Password**: `demo`
- **Redirects to**: `/landlord/dashboard`

### Admin (Quản Trị Viên)
- **Email**: `admin@demo.com`
- **Password**: `demo`
- **Redirects to**: `/admin/dashboard`

---

## Feature Testing Guide

### 1. Testing Login → State Update → Redirect

**Steps:**
1. Go to `/auth/login`
2. Enter `tenant@demo.com` / `demo`
3. Click "Đăng nhập"
4. **Expected**: 
   - Toast shows "Đăng nhập thành công!"
   - Redirected to `/tenant/ai-chat`
   - Navbar shows notification bell + profile + logout
   - User info persists in localStorage

**Verify State:**
- Open DevTools → Application → localStorage
- Should see `auth_token` key with JWT value

---

### 2. Testing Change Password (for Real Users Only)

**Prerequisites:**
- Must have a real user account (use the seeded users or register new)
- Demo accounts cannot change password

**Steps:**
1. Login with real account email/password
2. Go to `/profile`
3. Click "Đổi Mật Khẩu" or navigate to `/auth/change-password`
4. Enter current password
5. Enter new password (6+ chars, must differ from current)
6. Confirm new password
7. Click "Thay Đổi Mật Khẩu"

**Expected Results:**
- ✅ Show "Mật khẩu đã thay đổi thành công!"
- ✅ Redirect to `/profile` after 1.5 seconds
- ✅ Form clears
- ✅ Can login again with NEW password
- ✅ OLD password no longer works

**Error Cases to Test:**
```
❌ Wrong current password
   → Shows "Mật khẩu hiện tại không đúng"

❌ New password same as current
   → Shows "Mật khẩu mới phải khác mật khẩu hiện tại"

❌ Confirm password doesn't match
   → Shows "Mật khẩu không khớp"

❌ Password less than 6 chars
   → Shows "Mật khẩu tối thiểu 6 ký tự"

❌ Demo account
   → Shows "Tài khoản demo không thể thay đổi mật khẩu"
```

---

### 3. Testing Logout

**Steps:**
1. Login to any account
2. In Navbar (desktop), click the logout icon (power button)
   - OR in BottomNav (mobile), click "Thoát"
   - OR go to Profile page and click "Đăng Xuất"
3. **Expected**:
   - Toast shows "Đã đăng xuất thành công"
   - Redirects to `/` (home)
   - Navbar shows "Đăng Nhập" and "Đăng Ký" buttons
   - BottomNav disappears (hides when not authenticated)
   - localStorage `auth_token` is cleared

**Verify State:**
- Open DevTools → Application → localStorage
- `auth_token` key should be gone

---

### 4. Testing Profile Page State

#### Unauthenticated User
1. Logout (if logged in)
2. Go to `/profile`
3. **Expected**:
   - Shows welcome message
   - Shows "Đăng Nhập" and "Đăng Ký" buttons
   - No user info displayed
   - No "Đổi Mật Khẩu" option

#### Authenticated User
1. Login with demo or real account
2. Go to `/profile`
3. **Expected**:
   - Shows actual user name and email
   - Shows user role badge (color-coded)
   - Shows "Chỉnh Sửa Hồ Sơ" button
   - Shows menu items including "Đổi Mật Khẩu"
   - Shows "Đăng Xuất" button

---

### 5. Testing Navigation Updates

#### Navbar Changes
```
LOGGED OUT                          LOGGED IN
├─ Home                            ├─ Home  
├─ Tìm trọ                         ├─ Tìm trọ
└─ Tìm bạn ở ghép        ────→     ├─ Tìm bạn ở ghép
   [Login] [Register]               ├─ Bell Icon (notifications)
                                    ├─ Profile Avatar
                                    └─ Logout Button
```

#### BottomNav Changes
```
LOGGED OUT: Hidden (returns null)
LOGGED IN: Shows all nav items + Logout button
```

---

## API Testing (Using curl or Postman)

### Test Change Password API

**Endpoint**: `POST /api/auth/change-password`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "currentPassword": "demo",
  "newPassword": "newPassword123"
}
```

**Success Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

**Error Response (401):**
```json
{
  "error": "Current password is incorrect"
}
```

---

## Database Query Testing (MongoDB)

### Check User Password Hash

```javascript
// In MongoDB terminal:
db.users.findOne({ email: "tenant@demo.com" })

// Will show:
{
  _id: ObjectId(...),
  email: "tenant@demo.com",
  password: "$2a$10$...", // bcrypt hash
  fullName: "...",
  role: "tenant",
  ...
}
```

### Verify Password Was Updated

```javascript
// Before change password:
// password: "$2a$10$oldHash..."

// After change password:
// password: "$2a$10$newHash..." (different)
```

---

## Browser DevTools Debugging

### Check Authentication Token

```javascript
// In Console:
localStorage.getItem('auth_token')
// Returns JWT token string or null

// Decode JWT (in console):
let token = localStorage.getItem('auth_token');
let payload = JSON.parse(atob(token.split('.')[1]));
console.log(payload);
// Shows: { userId: "...", role: "tenant", iat: ..., exp: ... }
```

### Check AuthContext State

```javascript
// Add this to any component to see auth state:
const { user, role, isAuthenticated, loading } = useAuth();
console.log({ user, role, isAuthenticated, loading });
```

### Monitor API Calls

1. Open DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Login/logout/change password
4. Watch for:
   - `/api/auth/login` → returns token + user
   - `/api/auth/change-password` → requires Authorization header
   - `/api/auth/profile` → checks valid token

---

## Common Issues & Solutions

### Issue: After login, UI doesn't update

**Solution:**
1. Clear localStorage and reload: `localStorage.clear()`
2. Check browser console for errors
3. Verify backend is running on :5000
4. Check `VITE_API_URL` in frontend `.env`

### Issue: Change Password button doesn't appear

**Solution:**
1. Verify you're logged in (not demo account)
2. Check you're on `/profile` page
3. Refresh page: `Ctrl+Shift+R`

### Issue: Demo account can't change password

**Solution:**
- This is by design! Demo accounts have no real credentials
- Use a real user account (create one via register or seed)

### Issue: Logout doesn't clear token

**Solution:**
1. Check browser localStorage is enabled
2. Check console for JavaScript errors
3. Manually clear: `localStorage.removeItem('auth_token')`

### Issue: Can't login after changing password

**Solution:**
1. You're using the OLD password
2. Use the NEW password you set
3. Try using the demo account credentials (they never change)

---

## Security Testing Checklist

- [ ] **Token Security**: JWT token not exposed in HTML/CSS
- [ ] **Password Security**: Passwords hashed with bcrypt before storage
- [ ] **HTTPS**: Use HTTPS in production (not localhost)
- [ ] **CORS**: Backend CORS config matches frontend domain
- [ ] **XSS Protection**: No `dangerouslySetInnerHTML` in auth components
- [ ] **CSRF Protection**: Consider adding CSRF tokens (future enhancement)
- [ ] **Rate Limiting**: Consider adding rate limits on login/password change
- [ ] **Account Lockout**: Consider lockout after N failed login attempts

---

## Performance Testing

### Load Times
- Login page: Should load < 1 second
- Change password: Should be < 500ms
- Logout: Should be instant

### API Response Times
- `/api/auth/login`: < 500ms
- `/api/auth/change-password`: < 500ms
- `/api/auth/profile`: < 200ms

### Network Tab Monitoring
- Should see only necessary API calls
- No duplicate requests
- Token should be included in Authorization header

---

## Next Steps (Future Enhancements)

1. **Add Password Strength Meter** on Change Password page
2. **Implement Email Verification** for password changes
3. **Add Session Management** for multiple devices
4. **Implement 2FA** (Two-Factor Authentication)
5. **Add Account Activity Log** to profile
6. **Add Password History** validation
7. **Implement Automatic Logout** after inactivity
8. **Add API Rate Limiting** to prevent brute force

---

**Last Updated**: February 2026
**Version**: 1.0.0 - Complete Authentication Flow Implementation
