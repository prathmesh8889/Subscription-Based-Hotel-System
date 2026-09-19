# 🚀 Quick Start Guide - Phase 1

## ⚡ Fast Setup (5 Minutes)

### 1. Install Dependencies
```bash
npm run setup
```

### 2. Configure Database
```bash
# Copy environment file
cp backend/.env.example backend/.env

# Edit with your PostgreSQL credentials
nano backend/.env
```

Update this line:
```env
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/restroflow_dev"
```

### 3. Setup Database
```bash
npm run db:setup
```

This will:
- Create database tables
- Seed initial data (Super Admin + Demo Hotel + Staff)

### 4. Start Development
```bash
npm run dev
```

Opens:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

---

## 🔑 Default Login Credentials

### Super Admin
- **URL:** http://localhost:5173/platform/login
- **Email:** `admin@platform.com`
- **Password:** `ChangeThisPassword123!`

### Hotel Owner
- **URL:** http://localhost:5173/login
- **Email:** `owner@tajpalace.com`
- **Password:** `Owner@123`

### Kitchen Staff
- **Email:** `kitchen@tajpalace.com`
- **Password:** `Kitchen@123`

### Waiter
- **Email:** `waiter@tajpalace.com`
- **Password:** `Waiter@123`

---

## 📋 Common Commands

### Development
```bash
npm run dev              # Start both frontend & backend
npm run dev:frontend     # Start frontend only
npm run dev:backend      # Start backend only
```

### Database
```bash
npm run db:setup         # Migrate + seed database
npm run db:migrate       # Run migrations only
npm run db:seed          # Seed database only
npm run db:studio        # Open Prisma Studio (http://localhost:5555)
npm run prisma:generate  # Regenerate Prisma client
```

### Build
```bash
npm run build            # Build both frontend & backend
npm run build:frontend   # Build frontend only
npm run build:backend    # Build backend only
```

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Backend starts without errors
- [ ] Database connection successful
- [ ] Can login as Super Admin
- [ ] Can login as Owner
- [ ] Can login as Kitchen staff
- [ ] Can login as Waiter
- [ ] Prisma Studio shows seeded data

---

## 🐛 Troubleshooting

### "Database connection failed"
```bash
# Check PostgreSQL is running
sudo service postgresql start  # Linux
brew services start postgresql # macOS

# Verify connection string in backend/.env
```

### "Cannot find module '@prisma/client'"
```bash
cd backend
npm install
npx prisma generate
```

### "Port 5000 already in use"
```bash
# Edit backend/.env
PORT=5001
```

### "Migration failed"
```bash
# Reset database
psql -c "DROP DATABASE IF EXISTS restroflow_dev;"
psql -c "CREATE DATABASE restroflow_dev;"
npm run db:setup
```

---

## 📚 Next Steps

Once Phase 1 is verified:
1. Test all login credentials
2. Verify multi-tenant isolation
3. Check Prisma Studio for seeded data
4. Proceed to Phase 2 (Real Authentication)

---

**Status:** ✅ Phase 1 Complete  
**Ready for:** Phase 2 - Real Authentication & RBAC
