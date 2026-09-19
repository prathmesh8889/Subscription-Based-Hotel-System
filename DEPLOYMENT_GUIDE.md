# 🚀 Complete Deployment Guide

## Overview

This guide covers deploying the RestroFlow SaaS application to production using:
- **Frontend**: Vercel (React SPA)
- **Backend**: Render/Railway (Node.js + PostgreSQL)

---

## 📋 Prerequisites

Before deploying, ensure you have:
- ✅ GitHub account
- ✅ Vercel account (free tier works)
- ✅ Render or Railway account (free tier available)
- ✅ PostgreSQL database (Supabase, Neon, or Render PostgreSQL)
- ✅ Domain name (optional but recommended)

---

## 🗄️ Step 1: Setup PostgreSQL Database

### Option A: Supabase (Recommended for Free Tier)

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for database to be ready (~2 minutes)
4. Go to **Settings** → **Database**
5. Copy the **Connection string** (URI format)

**Connection String Format:**
```
postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
```

### Option B: Neon (Serverless PostgreSQL)

1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string

### Option C: Render PostgreSQL

1. In Render dashboard, click **New** → **PostgreSQL**
2. Configure database settings
3. Copy the **Internal Database URL**

---

## 🔧 Step 2: Deploy Backend

### Option A: Render.com (Recommended)

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for production deployment"
   git push origin main
   ```

2. **Create Web Service on Render**
   - Go to [render.com](https://render.com)
   - Click **New** → **Web Service**
   - Connect your GitHub repository
   - Configure:
     - **Name**: `restroflow-backend`
     - **Region**: Oregon (or closest to you)
     - **Branch**: `main`
     - **Root Directory**: `backend`
     - **Runtime**: `Node`
     - **Build Command**: `npm install && npx prisma generate && npm run build`
     - **Start Command**: `npm start`
     - **Plan**: Starter (Free tier available)

3. **Add Environment Variables**
   
   In Render dashboard, go to **Environment** and add:

   ```env
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=postgresql://user:password@host:5432/dbname
   JWT_SECRET=<generate-64-char-secret>
   JWT_EXPIRES_IN=24h
   BCRYPT_SALT_ROUNDS=10
   CORS_ORIGINS=https://your-frontend.vercel.app
   SUPER_ADMIN_EMAIL=admin@platform.com
   SUPER_ADMIN_PASSWORD=<strong-password>
   QR_SECRET=<generate-32-char-secret>
   QR_TOKEN_EXPIRY_HOURS=4
   ```

   **Generate Secrets:**
   ```bash
   # JWT Secret (64 chars)
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   
   # QR Secret (32 chars)
   node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
   ```

4. **Deploy**
   - Click **Create Web Service**
   - Wait for deployment (~3-5 minutes)
   - Copy the backend URL (e.g., `https://restroflow-backend.onrender.com`)

5. **Run Database Migrations**
   
   In Render shell or locally:
   ```bash
   # Connect to Render shell
   # Or run locally with production DATABASE_URL
   
   npx prisma migrate deploy
   npm run prisma:seed
   ```

### Option B: Railway.app

1. Go to [railway.app](https://railway.app)
2. Create new project
3. Add PostgreSQL database
4. Add Node.js service
5. Connect GitHub repository
6. Set root directory to `backend`
7. Add environment variables (same as Render)
8. Deploy

---

## 🎨 Step 3: Deploy Frontend to Vercel

1. **Go to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Sign in with GitHub

2. **Import Project**
   - Click **Add New** → **Project**
   - Import your GitHub repository
   - Framework Preset: **Vite**
   - Root Directory: `./` (default)

3. **Configure Build Settings**
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Add Environment Variables**
   
   In Vercel dashboard, go to **Settings** → **Environment Variables**:

   ```env
   VITE_API_URL=https://your-backend-url.onrender.com/api
   VITE_SOCKET_URL=https://your-backend-url.onrender.com
   VITE_APP_ENV=production
   ```

5. **Deploy**
   - Click **Deploy**
   - Wait for deployment (~2-3 minutes)
   - Copy the frontend URL (e.g., `https://restroflow.vercel.app`)

6. **Update Backend CORS**
   
   Go back to Render backend settings and update:
   ```env
   CORS_ORIGINS=https://restroflow.vercel.app
   ```
   
   Redeploy backend.

---

## 🧪 Step 4: Post-Deployment Verification

### 1. Test Backend Health

```bash
curl https://your-backend-url.onrender.com/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-01-15T..."
}
```

### 2. Test Database Connection

Check Render logs for:
```
✅ Database connected successfully
🔌 Socket.io initialized
🚀 RestroFlow Backend Server
```

### 3. Test Frontend

1. Open `https://restroflow.vercel.app`
2. Should redirect to `/login`
3. Login with Super Admin credentials:
   - Email: `admin@platform.com`
   - Password: (from environment variable)

### 4. Test Authentication Flow

1. Login as Super Admin
2. Navigate to `/platform/login` (secret route)
3. Verify dashboard loads
4. Check browser console for errors

### 5. Test Multi-Tenancy

1. Create a new hotel via Super Admin dashboard
2. Create owner account for the hotel
3. Login as owner
4. Verify data isolation (owner only sees their hotel's data)

### 6. Test Real-Time Features

1. Login as Kitchen staff
2. Open another browser as Customer
3. Customer places order via QR code
4. Verify order appears in Kitchen dashboard in real-time

---

## 🔒 Step 5: Security Hardening

### 1. Change Default Passwords

Immediately after first login:
```bash
# Login as Super Admin
# Navigate to profile settings
# Change password
```

### 2. Enable IP Whitelisting (Optional)

In backend environment variables:
```env
ADMIN_ALLOWED_IPS=your-office-ip,vpn-ip
```

### 3. Enable 2FA (Optional)

```env
ADMIN_REQUIRE_2FA=true
```

### 4. Setup Monitoring

- **Render**: Enable error tracking in dashboard
- **Vercel**: Enable analytics
- **Database**: Setup backup schedule

### 5. Setup Custom Domain (Optional)

**Vercel:**
1. Go to **Settings** → **Domains**
2. Add your domain
3. Update DNS records as instructed

**Render:**
1. Go to **Settings** → **Custom Domains**
2. Add your domain
3. Update DNS records

---

## 📊 Step 6: Performance Optimization

### Frontend (Vercel)

Already optimized via `vercel.json`:
- ✅ Asset caching (1 year for immutable assets)
- ✅ Image caching (1 week)
- ✅ SPA routing configured
- ✅ Gzip compression enabled

### Backend (Render)

1. **Enable Auto-Scaling** (Paid plans)
2. **Add Redis Cache** (Optional)
3. **Optimize Database Queries**
   - Add indexes for frequently queried fields
   - Use connection pooling

### Database

1. **Enable Auto-Backup**
2. **Monitor Query Performance**
3. **Set up Read Replicas** (for high traffic)

---

## 🐛 Troubleshooting

### Issue: Frontend shows 404 on refresh

**Solution:**
- Verify `vercel.json` exists in root directory
- Check routes configuration
- Redeploy to Vercel

### Issue: Backend CORS errors

**Solution:**
- Update `CORS_ORIGINS` in backend environment
- Include frontend URL exactly (with https://)
- Redeploy backend

### Issue: Database connection failed

**Solution:**
- Verify `DATABASE_URL` is correct
- Check database is running
- Verify network access (IP whitelisting)

### Issue: Socket.io not connecting

**Solution:**
- Verify `VITE_SOCKET_URL` is correct
- Check backend logs for Socket.io initialization
- Verify CORS allows WebSocket connections

### Issue: Login not working

**Solution:**
- Check backend logs for authentication errors
- Verify `JWT_SECRET` is set
- Check database has seeded users
- Verify cookies are being set (check browser DevTools)

---

## 📝 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing locally
- [ ] No console errors in development
- [ ] Environment variables documented
- [ ] Database migrations tested
- [ ] Build process tested (`npm run build`)

### Backend Deployment
- [ ] PostgreSQL database created
- [ ] Backend deployed to Render/Railway
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Seed data loaded
- [ ] Health check endpoint working
- [ ] CORS configured correctly
- [ ] Socket.io initialized

### Frontend Deployment
- [ ] Frontend deployed to Vercel
- [ ] Environment variables configured
- [ ] `vercel.json` configured
- [ ] SPA routing working
- [ ] API URL pointing to backend
- [ ] Socket URL pointing to backend

### Post-Deployment
- [ ] Login working
- [ ] All user roles tested
- [ ] Multi-tenancy verified
- [ ] Real-time features working
- [ ] QR code generation working
- [ ] Billing system working
- [ ] Reports generating correctly
- [ ] Default passwords changed
- [ ] Monitoring enabled
- [ ] Backups configured

---

## 🔄 Continuous Deployment

Both Vercel and Render support automatic deployments:

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Update feature"
   git push origin main
   ```

2. **Automatic Deployment**
   - Vercel automatically rebuilds frontend
   - Render automatically rebuilds backend
   - Zero downtime deployment

3. **Rollback**
   - Both platforms support instant rollback
   - Go to deployments tab
   - Click "Rollback" on previous deployment

---

## 💰 Cost Estimation

### Free Tier (Good for Development/Testing)

**Vercel (Frontend):**
- ✅ 100 GB bandwidth/month
- ✅ Unlimited deployments
- ✅ Free SSL
- ✅ Custom domain support

**Render (Backend):**
- ✅ 750 hours/month (free tier spins down after 15 min inactivity)
- ✅ 512 MB RAM
- ⚠️ Cold start delay (~30 seconds)

**Supabase (Database):**
- ✅ 500 MB database
- ✅ 2 GB bandwidth/month
- ✅ Daily backups

**Total: $0/month** (with limitations)

### Production Tier (~$25-50/month)

**Vercel Pro:**
- $20/month
- 1 TB bandwidth
- No cold starts

**Render Starter:**
- $7/month
- Always on
- 512 MB RAM

**Supabase Pro:**
- $25/month
- 8 GB database
- No bandwidth limits

**Total: ~$52/month**

---

## 📞 Support Resources

### Documentation
- [Vercel Docs](https://vercel.com/docs)
- [Render Docs](https://render.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Prisma Docs](https://www.prisma.io/docs)

### Community
- [Vercel Community](https://github.com/vercel/vercel/discussions)
- [Render Community](https://community.render.com)
- [Prisma Slack](https://pris.ly/prisma-slack)

### Monitoring
- [Vercel Analytics](https://vercel.com/docs/analytics)
- [Render Metrics](https://render.com/docs/metrics)
- [Supabase Dashboard](https://supabase.com/dashboard)

---

## ✅ Final Notes

### Security Reminders
1. ✅ Never commit `.env` files
2. ✅ Use strong, unique passwords
3. ✅ Rotate secrets regularly
4. ✅ Enable 2FA for admin accounts
5. ✅ Monitor access logs
6. ✅ Keep dependencies updated

### Performance Tips
1. ✅ Enable CDN caching (automatic on Vercel)
2. ✅ Optimize images before upload
3. ✅ Use database indexes
4. ✅ Monitor slow queries
5. ✅ Scale horizontally when needed

### Maintenance Tasks
- **Daily**: Check error logs
- **Weekly**: Review analytics
- **Monthly**: Update dependencies
- **Quarterly**: Security audit
- **Annually**: Review architecture

---

**Deployment Status:** Ready for Production  
**Last Updated:** January 2026  
**Version:** 5.0 - Production Deployment
