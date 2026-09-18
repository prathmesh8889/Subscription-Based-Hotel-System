# Step 1: Prisma Schema - Complete Documentation

## 🎯 Overview

This Prisma schema implements a **production-ready, secure, multi-tenant** database design for the Hotel Management System. It addresses all security concerns including role-based access control (RBAC), data isolation, and audit trails.

---

## 🔐 Security Features Implemented

### 1. **Role-Based Access Control (RBAC)**
```prisma
enum Role {
  SUPER_ADMIN  // Platform administrator - no hotelId
  OWNER        // Hotel owner - manages one hotel
  KITCHEN      // Kitchen staff - belongs to one hotel
  WAITER       // Waiter/Cashier - belongs to one hotel
}
```

**Security Design:**
- `SUPER_ADMIN` has `hotelId = NULL` (platform-level access)
- All other roles MUST have a valid `hotelId`
- Backend middleware validates role + hotelId on every request

### 2. **Multi-Tenant Data Isolation**
Every tenant-scoped model includes `hotelId`:
```prisma
model Table {
  hotelId  String  // CRITICAL: Multi-tenant isolation
  hotel    Hotel   @relation(...)
}
```

**Security Design:**
- Backend middleware validates `hotelId` matches user's JWT
- Prevents horizontal privilege escalation
- Database-level constraints ensure data integrity

### 3. **Password Security**
```prisma
model User {
  password  String  // bcrypt hashed - NEVER store plain text
}
```

**Security Design:**
- Passwords hashed with bcrypt (10-12 salt rounds)
- Never stored in plain text
- Never returned in API responses

### 4. **Audit Trail**
```prisma
model Order {
  createdBy  String  // User who created order
  handledBy  String? // User who handled order
}

model AuditLog {
  userId    String?
  action    String
  resource  String
  metadata  Json?
}
```

**Security Design:**
- Track who created/modified data
- Compliance-ready audit logs
- Forensic analysis capability

### 5. **Cascading Deletes**
```prisma
model Hotel {
  users     User[]      @relation(..., onDelete: Cascade)
  tables    Table[]     @relation(..., onDelete: Cascade)
  menuItems MenuItem[]  @relation(..., onDelete: Cascade)
  orders    Order[]     @relation(..., onDelete: Cascade)
}
```

**Security Design:**
- Deleting a hotel removes all associated data
- Prevents orphaned records
- Maintains data integrity

---

## 📊 Database Models Explained

### **User Model**
Stores all user accounts (Super Admin, Owners, Staff)

**Key Fields:**
- `email` - Unique identifier for login
- `password` - bcrypt hashed password
- `role` - User's role (SUPER_ADMIN, OWNER, KITCHEN, WAITER)
- `hotelId` - NULL for SUPER_ADMIN, required for others
- `isActive` - Soft delete flag (can deactivate without deleting)
- `lastLoginAt` - Track last login for security

**Indexes:**
- `email` - Fast login lookup
- `hotelId` - Fast hotel-scoped queries
- `role` - Role-based filtering
- `[hotelId, role]` - Composite index for common queries

### **Hotel Model (Tenant)**
Each hotel is a separate tenant in the multi-tenant system

**Key Fields:**
- `subscriptionPlan` - Current plan (TRIAL, STARTER, PRO, BUSINESS)
- `subscriptionEnd` - When subscription expires
- `isActive` - Whether hotel is active
- `maxTables`, `maxMenuItems`, `maxStaff` - Plan limits

**Security:**
- Subscription enforcement happens in backend middleware
- Expired subscriptions enter read-only mode
- Plan limits enforced during resource creation

### **Table Model**
Restaurant tables for customer seating

**Key Fields:**
- `tableNumber` - Display number (e.g., "Table 5")
- `qrToken` - Secure token for QR code generation
- `status` - AVAILABLE, OCCUPIED, RESERVED

**Constraints:**
- `@@unique([hotelId, tableNumber])` - No duplicate table numbers per hotel

### **MenuItem Model**
Food/drink items available for ordering

**Key Fields:**
- `price` - Decimal with 2 decimal places (₹199.99)
- `category` - Menu category (Starters, Main Course, etc.)
- `isAvailable` - Toggle availability without deleting
- `prepTimeMinutes` - Estimated preparation time

### **Order Model**
Customer orders with items, status, and payment info

**Key Fields:**
- `items` - JSON array of order items (flexible schema)
- `totalAmount` - Decimal for precise currency handling
- `status` - PENDING → PREPARING → READY → SERVED
- `paymentStatus` - UNPAID, PAID, REFUNDED
- `createdBy` - User who created order (audit trail)
- `handledBy` - Kitchen/waiter who handled order

**Items JSON Structure:**
```json
[
  {
    "menuItemId": "clx123abc",
    "name": "Butter Chicken",
    "price": 320.00,
    "quantity": 2,
    "notes": "Extra spicy"
  }
]
```

### **Session Model (Optional)**
Track active sessions for security

**Use Cases:**
- Invalidate sessions on password change
- Track concurrent sessions
- Force logout from all devices
- Security audit trail

### **AuditLog Model (Optional)**
Track all critical actions for compliance

**Use Cases:**
- Regulatory compliance (SOC 2, GDPR)
- Security incident investigation
- User activity monitoring
- Change tracking

---

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
npm install @prisma/client
npm install -D prisma
```

### 2. Configure Environment Variables
```bash
# Copy example env file
cp .env.example .env

# Edit .env with your database credentials
nano .env
```

**Required Variables:**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/restroflow"
JWT_SECRET="your-super-secret-jwt-key-min-64-chars"
BCRYPT_SALT_ROUNDS=10
```

### 3. Generate Prisma Client
```bash
npx prisma generate
```

### 4. Run Database Migration
```bash
# Create migration
npx prisma migrate dev --name init

# Or apply existing migrations
npx prisma migrate deploy
```

### 5. Seed Database (Optional)
Create `prisma/seed.ts`:
```typescript
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      email: process.env.SUPER_ADMIN_EMAIL || 'admin@platform.com',
      password: await bcrypt.hash(
        process.env.SUPER_ADMIN_PASSWORD || 'ChangeThis123!',
        10
      ),
      name: 'Platform Admin',
      role: 'SUPER_ADMIN',
      hotelId: null,
      isActive: true,
    },
  });

  console.log('Super Admin created:', superAdmin.email);

  // Create Demo Hotel
  const hotel = await prisma.hotel.create({
    data: {
      name: 'Taj Palace Restaurant',
      address: '123 MG Road, Bangalore',
      phone: '+91 98765 43210',
      subscriptionPlan: 'PRO',
      subscriptionStart: new Date(),
      subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isActive: true,
      maxTables: 25,
      maxMenuItems: 150,
      maxStaff: 15,
    },
  });

  console.log('Hotel created:', hotel.name);

  // Create Hotel Owner
  const owner = await prisma.user.create({
    data: {
      email: 'owner@tajpalace.com',
      password: await bcrypt.hash('owner123', 10),
      name: 'Rajesh Kumar',
      role: 'OWNER',
      hotelId: hotel.id,
      isActive: true,
    },
  });

  console.log('Owner created:', owner.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Run seed:
```bash
npx prisma db seed
```

### 6. Verify Database
```bash
# Open Prisma Studio (visual database browser)
npx prisma studio
```

---

## 🔒 Security Best Practices

### 1. **Never Expose Sensitive Fields**
```typescript
// ❌ BAD - Exposes password
const user = await prisma.user.findUnique({ where: { id } });

// ✅ GOOD - Select only safe fields
const user = await prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    email: true,
    name: true,
    role: true,
    hotelId: true,
    isActive: true,
  },
});
```

### 2. **Always Validate hotelId**
```typescript
// Backend middleware MUST validate hotelId
const verifyHotelAccess = async (req, res, next) => {
  const userHotelId = req.user.hotelId;
  const resourceHotelId = req.params.hotelId || req.body.hotelId;
  
  if (userHotelId !== resourceHotelId) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  next();
};
```

### 3. **Use Transactions for Multi-Step Operations**
```typescript
// ✅ GOOD - Atomic operation
await prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ data: orderData });
  await tx.table.update({
    where: { id: tableId },
    data: { status: 'OCCUPIED' },
  });
});
```

### 4. **Implement Soft Deletes**
```typescript
// ✅ GOOD - Soft delete (can be restored)
await prisma.user.update({
  where: { id },
  data: { isActive: false },
});

// ❌ BAD - Hard delete (permanent)
await prisma.user.delete({ where: { id } });
```

### 5. **Rate Limiting**
```typescript
// Prevent brute force attacks
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: 'Too many login attempts, please try again later',
});

app.post('/api/auth/login', authLimiter, authController.login);
```

---

## 📈 Performance Optimization

### Indexes Created
```prisma
@@index([email])                    // Fast login lookup
@@index([hotelId])                  // Fast hotel-scoped queries
@@index([hotelId, status])          // Composite index
@@index([hotelId, createdAt])       // Time-based queries
```

### Query Optimization
```typescript
// ✅ GOOD - Use select to fetch only needed fields
const orders = await prisma.order.findMany({
  where: { hotelId, status: 'PENDING' },
  select: {
    id: true,
    tableNumber: true,
    totalAmount: true,
    createdAt: true,
  },
  orderBy: { createdAt: 'desc' },
  take: 50, // Limit results
});

// ❌ BAD - Fetches all fields
const orders = await prisma.order.findMany({
  where: { hotelId },
});
```

### Pagination
```typescript
// Cursor-based pagination (better than offset for large datasets)
const getOrders = async (cursor?: string, limit = 20) => {
  return await prisma.order.findMany({
    take: limit,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: 'desc' },
  });
};
```

---

## 🧪 Testing the Schema

### Test Multi-Tenancy
```typescript
// Create two hotels
const hotel1 = await prisma.hotel.create({ data: { name: 'Hotel 1' } });
const hotel2 = await prisma.hotel.create({ data: { name: 'Hotel 2' } });

// Create users for each hotel
const user1 = await prisma.user.create({
  data: { email: 'user1@hotel1.com', hotelId: hotel1.id, role: 'OWNER' }
});
const user2 = await prisma.user.create({
  data: { email: 'user2@hotel2.com', hotelId: hotel2.id, role: 'OWNER' }
});

// Verify isolation
const hotel1Tables = await prisma.table.findMany({
  where: { hotelId: hotel1.id }
});
// Should NOT include hotel2's tables ✅
```

### Test Cascading Deletes
```typescript
// Delete hotel
await prisma.hotel.delete({ where: { id: hotel1.id } });

// Verify all related data is deleted
const users = await prisma.user.findMany({ where: { hotelId: hotel1.id } });
const tables = await prisma.table.findMany({ where: { hotelId: hotel1.id } });
// Both should be empty ✅
```

---

## 📝 Next Steps

After completing Step 1 (Schema), proceed to:

**Step 2: Backend Authentication & Security Middleware**
- JWT-based authentication
- bcrypt password hashing
- Role-based authorization middleware
- Hotel access verification middleware

**Step 3: Super Admin Isolation**
- Secret login route (`/platform/login`)
- Hotel creation endpoint
- User creation with automatic hotel assignment

**Step 4: Frontend Refactoring**
- Remove mock data
- Real API integration
- Secure token storage
- Role-based routing

**Step 5: Secret Super Admin Route**
- Configure `/platform/login` route
- Hide from regular users
- Additional security measures

---

## ✅ Checklist

- [x] Prisma schema created with all models
- [x] Role enum defined (SUPER_ADMIN, OWNER, KITCHEN, WAITER)
- [x] Multi-tenant isolation via hotelId
- [x] Proper relationships with cascading deletes
- [x] Indexes for performance
- [x] Audit trail fields (createdBy, handledBy)
- [x] Environment variables documented
- [x] Security best practices documented
- [x] Setup instructions provided
- [x] Testing examples included

---

## 🎓 Key Takeaways

1. **Multi-Tenancy**: Every tenant-scoped model has `hotelId`
2. **RBAC**: Role enum controls access levels
3. **Security**: Passwords hashed, sensitive data protected
4. **Audit Trail**: Track who did what and when
5. **Performance**: Proper indexes and query optimization
6. **Data Integrity**: Cascading deletes and constraints

**Status**: ✅ Step 1 Complete - Ready for Step 2
