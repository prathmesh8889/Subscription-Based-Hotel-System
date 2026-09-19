# 🚀 Render Deployment - Complete Guide

## ✅ Build Status: SUCCESS

Your backend code has been successfully built and is ready for deployment!

---

## ⚠️ Current Issue: Database Not Configured

The server is crashing because `DATABASE_URL` environment variable is not set.

**Error:**
```
❌ Database connection failed: PrismaClientInitializationError: 
Error validating datasource `db`: You must provide a nonempty URL. 
The environment variable `DATABASE_URL` resolved to an empty string.
```

---

## 🔧 Solution: Set Up Database

You have **two options**:

### Option 1: Use Render PostgreSQL (Recommended)

#### Step 1: Create PostgreSQL Database on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `restroflow-db`
   - **Database**: `restroflow`
   - **User**: `restroflow`
   - **Region**: Same as your backend (e.g., Oregon)
   - **Plan**: Free (for testing) or Starter ($7/month)
4. Click **"Create Database"**
5. Wait for database to be ready (~2 minutes)

#### Step 2: Get Connection String

1. In Render dashboard, click on your PostgreSQL database
2. Go to **"Connect"** tab
3. Copy the **"Internal Database URL"**
   - Format: `postgresql://user:password@host:port/database`

#### Step 3: Add to Backend Environment Variables

1. Go to your backend service on Render
2. Click **"Environment"** tab
3. Click **"Add Environment Variable"**
4. Add:
   - **Key**: `DATABASE_URL`
   - **Value**: (paste the Internal Database URL from step 2)
5. Click **"Save Changes"**

#### Step 4: Redeploy Backend

1. Go to **"Manual Deploy"** section
2. Click **"Deploy latest commit"**
3. Wait for deployment (~2-3 minutes)

---

### Option 2: Use Supabase (Alternative)

#### Step 1: Create Supabase Project

1. Go to [Supabase](https://supabase.com)
2. Click **"New Project"**
3. Configure:
   - **Name**: `restroflow`
   - **Database Password**: (save this somewhere!)
   - **Region**: Closest to you
4. Click **"Create new project"**
5. Wait for project to be ready (~2 minutes)

#### Step 2: Get Connection String

1. Go to **"Settings"** → **"Database"**
2. Under **"Connection string"**, select **"URI"**
3. Copy the connection string
   - Format: `postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres`
4. Replace `[PASSWORD]` with your database password

#### Step 3: Add to Render Environment Variables

1. Go to your backend service on Render
2. Click **"Environment"** tab
3. Click **"Add Environment Variable"**
4. Add:
   - **Key**: `DATABASE_URL`
   - **Value**: (paste the connection string from step 2)
5. Click **"Save Changes"**

#### Step 4: Redeploy Backend

1. Go to **"Manual Deploy"** section
2. Click **"Deploy latest commit"**
3. Wait for deployment (~2-3 minutes)

---

## 🗄️ Step 5: Run Database Migrations

After adding `DATABASE_URL`, you need to run migrations:

### Option A: Using Render Shell (Recommended)

1. Go to your backend service on Render
2. Click **"Shell"** tab
3. Run these commands:

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed the database (optional - creates demo data)
npm run prisma:seed
```

### Option B: Using Local Machine

1. Copy `DATABASE_URL` from Render environment variables
2. Add it to your local `backend/.env` file:

```env
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-super-secret-jwt-key-min-64-chars
CORS_ORIGINS=https://subscription-based-hotel-system.vercel.app
SUPER_ADMIN_EMAIL=admin@platform.com
SUPER_ADMIN_PASSWORD=Admin@123
NODE_ENV=production
PORT=5000
```

3. Run migrations locally:

```bash
cd backend
npm install
npx prisma migrate deploy
npm run prisma:seed
```

---

## ✅ Step 6: Verify Deployment

### Test Health Endpoint

```bash
curl https://your-backend.onrender.com/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-01-15T..."
}
```

### Test Login Endpoint

```bash
curl -X POST https://your-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@platform.com","password":"Admin@123"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "email": "admin@platform.com",
      "role": "SUPER_ADMIN",
      "hotelId": null
    }
  }
}
```

---

## 🔗 Step 7: Connect Frontend to Backend

### Update Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your project: `subscription-based-hotel-system`
3. Go to **"Settings"** → **"Environment Variables"**
4. Add/Update these variables:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://your-backend.onrender.com/api` |
| `VITE_SOCKET_URL` | `https://your-backend.onrender.com` |
| `VITE_USE_BACKEND` | `true` |

5. Click **"Save"**

### Redeploy Frontend

1. Go to **"Deployments"** tab
2. Find the latest deployment
3. Click **"⋮"** (three dots) → **"Redeploy"**
4. Wait for deployment (~2 minutes)

---

## 🧪 Step 8: Test Everything

### Test Frontend

1. Visit: `https://subscription-based-hotel-system.vercel.app`
2. Login with:
   - **Email**: `admin@platform.com`
   - **Password**: `Admin@123`
3. You should see the Super Admin dashboard

### Test Features

- ✅ Create a new hotel
- ✅ Create owner account
- ✅ Login as owner
- ✅ Add menu items
- ✅ Create tables
- ✅ Generate QR codes
- ✅ Place orders
- ✅ Process payments
- ✅ View reports

---

## 📊 Complete Environment Variables Checklist

### Backend (Render)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string |
| `JWT_SECRET` | ✅ Yes | Secret key for JWT tokens (64+ chars) |
| `CORS_ORIGINS` | ✅ Yes | Frontend URL (e.g., `https://your-app.vercel.app`) |
| `SUPER_ADMIN_EMAIL` | ✅ Yes | Super admin email |
| `SUPER_ADMIN_PASSWORD` | ✅ Yes | Super admin password |
| `NODE_ENV` | ✅ Yes | `production` |
| `PORT` | ❌ No | Auto-set by Render (default: 5000) |
| `BCRYPT_SALT_ROUNDS` | ❌ No | Default: 10 |
| `JWT_EXPIRES_IN` | ❌ No | Default: 24h |

### Frontend (Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | ✅ Yes | Backend API URL |
| `VITE_SOCKET_URL` | ✅ Yes | Backend Socket.io URL |
| `VITE_USE_BACKEND` | ✅ Yes | `true` to use backend |

---

## 🐛 Troubleshooting

### Issue: "Database connection failed"

**Solution:**
1. Check if `DATABASE_URL` is set in Render environment variables
2. Verify the connection string format is correct
3. Check if database is running (Render dashboard → PostgreSQL → Status)
4. Try redeploying the backend

### Issue: "CORS error" in frontend

**Solution:**
1. Check `CORS_ORIGINS` in backend environment variables
2. Make sure it includes your Vercel URL exactly
3. Redeploy backend after changing CORS

### Issue: "Cannot connect to socket"

**Solution:**
1. Check `VITE_SOCKET_URL` in Vercel environment variables
2. Make sure it matches your backend URL (without `/api`)
3. Redeploy frontend after changing environment variables

### Issue: "Login fails"

**Solution:**
1. Check if database migrations were run
2. Check if seed data was created
3. Verify super admin credentials in environment variables
4. Check backend logs for errors

---

## 📝 Quick Deployment Checklist

- [ ] Create PostgreSQL database (Render or Supabase)
- [ ] Get connection string
- [ ] Add `DATABASE_URL` to Render environment variables
- [ ] Add all other required environment variables
- [ ] Redeploy backend
- [ ] Run database migrations
- [ ] Run seed script (optional)
- [ ] Test health endpoint
- [ ] Update Vercel environment variables
- [ ] Redeploy frontend
- [ ] Test login
- [ ] Test all features

---

## 🎯 Expected Result

After completing all steps:

```
✅ Backend: https://your-backend.onrender.com (running)
✅ Database: Connected and migrated
✅ Frontend: https://subscription-based-hotel-system.vercel.app (connected)
✅ All features: Working
```

---

## 📞 Need Help?

If you encounter any issues:

1. **Check Render Logs**
   - Go to Render dashboard → Your service → Logs
   - Look for error messages

2. **Check Vercel Logs**
   - Go to Vercel dashboard → Your project → Deployments
   - Click on latest deployment → Functions tab

3. **Verify Environment Variables**
   - Make sure all required variables are set
   - Check for typos
   - Redeploy after changes

---

**Status:** ✅ Backend built successfully, ready for database configuration  
**Next Step:** Set up PostgreSQL database and add `DATABASE_URL` to Render
