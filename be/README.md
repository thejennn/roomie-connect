# Roomie Connect Backend

Node.js + MongoDB backend API for Roomie Connect.

## Setup

1. **Install dependencies**

   ```bash
   cd be
   npm install
   ```

2. **Configure environment**

   ```bash
   # Copy .env.example to .env and update values
   cp .env.example .env
   ```

3. **Start MongoDB**
   - Local: `mongod --dbpath /your/db/path`
   - Or use MongoDB Atlas connection string in `.env`

4. **Seed the database**

   ```bash
   npm run seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## API Endpoints

| Endpoint               | Method  | Auth     | Description       |
| ---------------------- | ------- | -------- | ----------------- |
| `/api/health`          | GET     | No       | Health check      |
| `/api/auth/register`   | POST    | No       | Register user     |
| `/api/auth/login`      | POST    | No       | Login user        |
| `/api/auth/profile`    | GET/PUT | Yes      | User profile      |
| `/api/rooms`           | GET     | No       | List rooms        |
| `/api/rooms/:id`       | GET     | No       | Get room          |
| `/api/rooms`           | POST    | Landlord | Create room       |
| `/api/roommates`       | GET     | No       | List profiles     |
| `/api/roommates/match` | POST    | Yes      | Find matches      |
| `/api/notifications`   | GET     | Yes      | Get notifications |
| `/api/wallet`          | GET     | Yes      | Get balance       |

## Default Credentials

- **Admin**: admin@roomie.com / admin123
- **Landlords**: colan@roomie.com / password123
- **Tenants**: minhanh@fpt.edu.vn / password123
