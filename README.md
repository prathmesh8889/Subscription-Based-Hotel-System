# 🍽️ RestroFlow SaaS - Multi-Tenant Restaurant Management System

<div align="center">

**Production-Ready Enterprise SaaS Platform for Restaurant Management**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[Features](#-features) • [Architecture](#-architecture) • [Quick Start](#-quick-start) • [Deployment](#-deployment) • [Documentation](#-documentation)

</div>

---

## 📋 Overview

RestroFlow is a **production-ready, enterprise-grade SaaS platform** for restaurant management with multi-tenant architecture, real-time order processing, secure authentication, comprehensive billing with GST calculation, and detailed analytics.

### 🎯 Key Highlights

- ✅ **Multi-Tenant Architecture** - Complete data isolation between hotels
- ✅ **Secure Authentication** - JWT + HttpOnly cookies + bcrypt
- ✅ **Real-Time Features** - Socket.io for live order updates
- ✅ **Role-Based Access** - 4 distinct user roles (Super Admin, Owner, Kitchen, Waiter)
- ✅ **QR Code Ordering** - Secure, time-bound tokens
- ✅ **Billing System** - GST calculation (5%) + professional invoicing
- ✅ **Comprehensive Reports** - Revenue, analytics, insights with charts
- ✅ **Production Ready** - Vercel + Render deployment configured

---

## ✨ Features

### 🏢 Multi-Tenant SaaS
- Complete data isolation between hotels
- Per-hotel subscription management
- Plan limits enforcement (tables, menu items, staff)
- Backend-enforced security

### 🔐 Security
- JWT authentication with HttpOnly cookies
- bcrypt password hashing (10 salt rounds)
- Role-based access control (RBAC)
- Rate limiting on auth endpoints
- Account lockout after failed attempts
- Audit logging for all actions
- CORS, Helmet, XSS, CSRF protection

### 👥 User Roles

| Role | Access | Features |
|------|--------|----------|
| **SUPER_ADMIN** | Platform-wide | Create hotels, manage subscriptions, view all data |
| **OWNER** | Single hotel | Menu, tables, staff, billing, reports |
| **KITCHEN** | Kitchen operations | Live orders, status updates, real-time dashboard |
| **WAITER** | Order management | Process payments, generate invoices, serve orders |

### 📱 Real-Time Features
- Socket.io for instant order updates
- Live kitchen dashboard with Kanban board
- Room-based isolation (hotel:{hotelId})
- Order status tracking (PENDING → PREPARING → READY → SERVED)
- Duplicate order prevention

### 🍽️ QR Code Ordering
- Secure, time-bound tokens (4-hour expiry)
- Hotel-specific menus
- Table auto-selection
- Customer ordering flow
- Real-time kitchen updates

### 💰 Billing & Invoicing
- GST calculation (5% = 2.5% CGST + 2.5% SGST)
- Professional invoice format
- Bill number generation (BILL-YYYYMMDD-XXXXXX)
- Payment processing (Cash/UPI/Card)
- Audit logging

### 📊 Comprehensive Reports
- Revenue analytics with date filtering
- Order statistics and trends
- Top selling items analysis
- Payment method breakdown
- Table utilization metrics
- Interactive charts (Line, Pie, Bar)

---

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- React Router for navigation
- Socket.io-client for real-time
- Recharts for data visualization
- QR code generation (qrcode.react)

**Backend:**
- Node.js with Express
- TypeScript for type safety
- Prisma ORM for database
- Socket.io for real-time
- JWT for authentication
- bcrypt for password hashing
- Zod for input validation

**Database:**
- PostgreSQL
- Multi-tenant schema
- Row-level security
- Audit logging

**Deployment:**
- Vercel (Frontend)
- Render/Railway (Backend)
- Supabase/Neon (Database)

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Vercel)                     │
│  React SPA with Vite + TypeScript + Tailwind CSS        │
└─────────────────────────────────────────────────────────┘
                          ↓
                    HTTPS / WSS
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   BACKEND (Render)                       │
│  Node.js + Express + Socket.io + Prisma ORM             │
└─────────────────────────────────────────────────────────┘
                          ↓
                    TCP (5432)
                          ↓
┌─────────────────────────────────────────────────────────┐
│                DATABASE (PostgreSQL)                     │
│  Multi-tenant schema with audit logging                 │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

```bash
# Clone repository
git clone <repository-url>
cd restroflow-saas

# Install all dependencies
npm run setup

# This will:
# - Install frontend dependencies
# - Install backend dependencies
# - Run database migrations
# - Seed initial data
```

### Development

```bash
# Start both frontend and backend
npm run dev

# Frontend: http://localhost:5173
# Backend: http://localhost:5000
# Socket.io: ws://localhost:5000
```

### Test Credentials

**Super Admin:**
- URL: `http://localhost:5173/platform/login`
- Email: `admin@platform.com`
- Password: `ChangeThisPassword123!`

**Hotel Owner:**
- URL: `http://localhost:5173/login`
- Email: `owner@tajpalace.com`
- Password: `Owner@123`

**Kitchen Staff:**
- Email: `kitchen@tajpalace.com`
- Password: `Kitchen@123`

**Waiter:**
- Email: `waiter@tajpalace.com`
- Password: `Waiter@123`

---

## 🗄️ Database Schema

### Models

1. **User** - User accounts with roles
2. **Hotel** - Tenant hotels with subscriptions
3. **Table** - Restaurant tables with QR tokens
4. **MenuItem** - Menu items with categories
5. **Order** - Customer orders with items
6. **Session** - Active sessions (optional)
7. **AuditLog** - Security audit trail

### Key Relationships

```
Hotel (1) ←→ (N) User
Hotel (1) ←→ (N) Table
Hotel (1) ←→ (N) MenuItem
Hotel (1) ←→ (N) Order
Table (1) ←→ (N) Order
User (1) ←→ (N) Order (created/handled)
```

---

## 🔐 Security Features

### Authentication
- ✅ JWT tokens with 24-hour expiry
- ✅ HttpOnly cookies for session storage
- ✅ bcrypt password hashing
- ✅ Rate limiting on auth endpoints
- ✅ Account lockout after 5 failed attempts

### Multi-Tenancy
- ✅ hotelId on all tenant-scoped models
- ✅ Backend middleware validates hotelId
- ✅ Room-based Socket.io isolation
- ✅ No cross-tenant data leakage

### API Security
- ✅ CORS restricted to frontend domain
- ✅ Helmet security headers
- ✅ Input validation with Zod
- ✅ SQL injection prevention (Prisma)
- ✅ XSS and CSRF protection

---

## 📊 API Endpoints

### Authentication
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/verify` | Verify session |
| POST | `/api/auth/logout` | Logout user |

### Menu
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/menu?hotelId=X` | Get menu items |
| POST | `/api/menu` | Create menu item |
| PUT | `/api/menu/:id` | Update menu item |
| DELETE | `/api/menu/:id` | Delete menu item |

### Billing
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/billing/unpaid` | Get unpaid orders |
| GET | `/api/billing/invoice/:id` | Generate invoice |
| POST | `/api/billing/pay/:id` | Process payment |
| GET | `/api/billing/summary` | Get billing summary |

### Reports
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/reports/revenue` | Revenue report |
| GET | `/api/reports/orders` | Order analytics |
| GET | `/api/reports/top-items` | Top selling items |
| GET | `/api/reports/payments` | Payment breakdown |
| GET | `/api/reports/tables` | Table utilization |

---

## 🚀 Deployment

### Quick Deploy (60 minutes)

#### 1. Database Setup (10 min)
- Create PostgreSQL database (Supabase/Neon/Render)
- Copy connection string

#### 2. Backend Deployment (15 min)
- Push to GitHub
- Deploy to Render/Railway
- Configure environment variables
- Run migrations

#### 3. Frontend Deployment (10 min)
- Deploy to Vercel
- Configure environment variables
- Update backend CORS

#### 4. Verification (15 min)
- Test all features
- Verify security
- Check real-time features

#### 5. Security Hardening (10 min)
- Change default passwords
- Configure IP whitelisting
- Enable monitoring

**See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed instructions.**

---

## 💰 Cost Estimation

### Free Tier (Development)
- **Vercel:** $0 (100 GB bandwidth)
- **Render:** $0 (750 hours, spins down)
- **Supabase:** $0 (500 MB database)
- **Total:** $0/month

### Production Tier
- **Vercel Pro:** $20/month
- **Render Starter:** $7/month
- **Supabase Pro:** $25/month
- **Total:** ~$52/month

---

## 📚 Documentation

### Core Documentation
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Complete deployment instructions
- **[FINAL_VERIFICATION_CHECKLIST.md](FINAL_VERIFICATION_CHECKLIST.md)** - 150+ verification items
- **[PROJECT_COMPLETE.md](PROJECT_COMPLETE.md)** - Project overview

### Phase Documentation
- **[PHASE_1_COMPLETE.md](PHASE_1_COMPLETE.md)** - Prisma Schema & Backend Setup
- **[PHASE_2_COMPLETE.md](PHASE_2_COMPLETE.md)** - Authentication & Session Management
- **[PHASE_3_COMPLETE.md](PHASE_3_COMPLETE.md)** - Real-Time Socket.io Integration
- **[PHASE_4_COMPLETE.md](PHASE_4_COMPLETE.md)** - Billing, Tax & Reporting
- **[PHASE_5_COMPLETE.md](PHASE_5_COMPLETE.md)** - Deployment & Verification

### Configuration Files
- `vercel.json` - Vercel deployment configuration
- `render.yaml` - Render deployment blueprint
- `.env.production` - Frontend production environment
- `backend/.env.production` - Backend production environment

---

## 🧪 Testing

### Run Tests
```bash
# Frontend tests
npm test

# Backend tests
cd backend && npm test

# End-to-end tests
npm run test:e2e
```

### Manual Testing
See [FINAL_VERIFICATION_CHECKLIST.md](FINAL_VERIFICATION_CHECKLIST.md) for 150+ test cases covering:
- Authentication flow
- Multi-tenancy
- Real-time features
- Billing system
- Reports
- Security

---

## 📈 Performance

### Optimizations
- **Frontend:** Asset caching, code splitting, lazy loading
- **Backend:** Connection pooling, query optimization, rate limiting
- **Database:** Indexes, query optimization, connection pooling

### Benchmarks
- Initial load: < 3 seconds
- API response: < 500ms
- Database queries: < 100ms
- Socket.io latency: < 100ms

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - UI library
- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Prisma](https://www.prisma.io/) - ORM
- [Socket.io](https://socket.io/) - Real-time communication
- [Vercel](https://vercel.com/) - Frontend deployment
- [Render](https://render.com/) - Backend deployment

---

## 📞 Support

### Documentation
- [Deployment Guide](DEPLOYMENT_GUIDE.md)
- [Verification Checklist](FINAL_VERIFICATION_CHECKLIST.md)
- [Phase Documentation](PHASE_1_COMPLETE.md) through [PHASE_5_COMPLETE.md](PHASE_5_COMPLETE.md)

### External Resources
- [Vercel Docs](https://vercel.com/docs)
- [Render Docs](https://render.com/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Socket.io Docs](https://socket.io/docs)

---

## 🎉 Project Status

**Status:** ✅ **COMPLETE & PRODUCTION READY**

All 5 phases completed:
- ✅ Phase 1: Prisma Schema & Backend Setup
- ✅ Phase 2: Authentication & Session Management
- ✅ Phase 3: Real-Time Socket.io Integration
- ✅ Phase 4: Billing, Tax & Reporting
- ✅ Phase 5: Deployment & Verification

**Ready for production deployment!** 🚀

---

<div align="center">

**Built with ❤️ for modern restaurant management**

[Report Bug](https://github.com/yourusername/restroflow-saas/issues) • [Request Feature](https://github.com/yourusername/restroflow-saas/issues)

</div>
