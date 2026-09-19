// ============================================================
// PRISMA SCHEMA - Database Design for Multi-Tenant SaaS
// File: prisma/schema.prisma
// ============================================================
// 
// CRITICAL ARCHITECTURAL RULE:
// Every table related to hotel operations has a `hotel_id` column.
// This ensures strict data isolation between tenants.
// ============================================================

/*
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================
// ENUMS
// ============================================================

enum UserRole {
  SUPER_ADMIN
  OWNER
  KITCHEN
  WAITER
}

enum PlanType {
  TRIAL
  STARTER
  PRO
  BUSINESS
}

enum OrderStatus {
  PENDING
  PREPARING
  READY
  SERVED
}

enum PaymentStatus {
  UNPAID
  PAID
}

enum PaymentMethod {
  CASH
  UPI
  CARD
}

enum TableStatus {
  AVAILABLE
  OCCUPIED
  RESERVED
}

// ============================================================
// USERS - Authentication & Authorization
// ============================================================

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  password_hash String    // bcrypt hashed
  name          String
  role          UserRole
  hotel_id      String?   // NULL for SUPER_ADMIN
  hotel         Hotel?    @relation(fields: [hotel_id], references: [id])
  is_active     Boolean   @default(true)
  created_at    DateTime  @default(now())
  updated_at    DateTime  @updatedAt

  @@index([hotel_id])
  @@index([email])
}

// ============================================================
// HOTELS - Tenants (Each hotel is a separate tenant)
// ============================================================

model Hotel {
  id                      String    @id @default(uuid())
  name                    String
  owner_id                String    @unique
  plan_type               PlanType  @default(TRIAL)
  subscription_start_date DateTime
  subscription_end_date   DateTime
  is_active               Boolean   @default(true)
  max_tables              Int       @default(5)
  max_menu_items          Int       @default(20)
  max_staff               Int       @default(3)
  address                 String?
  phone                   String?
  created_at              DateTime  @default(now())
  updated_at              DateTime  @updatedAt

  // Relations
  users       User[]
  tables      Table[]
  menuItems   MenuItem[]
  orders      Order[]

  @@index([is_active])
  @@index([plan_type])
}

// ============================================================
// TABLES - Restaurant Tables (hotel_id enforced)
// ============================================================

model Table {
  id            String      @id @default(uuid())
  hotel_id      String      // CRITICAL: Multi-tenancy key
  hotel         Hotel       @relation(fields: [hotel_id], references: [id])
  table_number  Int
  qr_token      String      @unique // Secure token for QR URL
  status        TableStatus @default(AVAILABLE)
  capacity      Int         @default(4)
  created_at    DateTime    @default(now())

  // Relations
  orders        Order[]

  @@unique([hotel_id, table_number]) // No duplicate table numbers per hotel
  @@index([hotel_id])
}

// ============================================================
// MENU ITEMS - Hotel Menu (hotel_id enforced)
// ============================================================

model MenuItem {
  id                String   @id @default(uuid())
  hotel_id          String   // CRITICAL: Multi-tenancy key
  hotel             Hotel    @relation(fields: [hotel_id], references: [id])
  name              String
  description       String?
  price             Decimal  @db.Decimal(10, 2)
  category          String
  image_url         String?
  is_available      Boolean  @default(true)
  prep_time_minutes Int      @default(15)
  sort_order        Int      @default(0)
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt

  @@index([hotel_id])
  @@index([hotel_id, category])
  @@index([hotel_id, is_available])
}

// ============================================================
// ORDERS - Customer Orders (hotel_id enforced)
// ============================================================

model Order {
  id              String        @id @default(uuid())
  hotel_id        String        // CRITICAL: Multi-tenancy key
  hotel           Hotel         @relation(fields: [hotel_id], references: [id])
  table_id        String
  table           Table         @relation(fields: [table_id], references: [id])
  items           Json          // Array of {menu_item_id, name, price, quantity, notes}
  total_amount    Decimal       @db.Decimal(10, 2)
  status          OrderStatus   @default(PENDING)
  payment_status  PaymentStatus @default(UNPAID)
  payment_method  PaymentMethod?
  notes           String?
  created_at      DateTime      @default(now())
  updated_at      DateTime      @updatedAt

  @@index([hotel_id])
  @@index([hotel_id, status])
  @@index([hotel_id, created_at])
  @@index([table_id])
}

// ============================================================
// SUBSCRIPTION PAYMENTS - Track plan payments
// ============================================================

model SubscriptionPayment {
  id            String   @id @default(uuid())
  hotel_id      String
  amount        Decimal  @db.Decimal(10, 2)
  plan_type     PlanType
  payment_date  DateTime @default(now())
  is_successful Boolean  @default(true)
  notes         String?

  @@index([hotel_id])
}
*/

// ============================================================
// EXPLANATION OF KEY DESIGN DECISIONS:
// ============================================================
//
// 1. MULTI-TENANCY: Every operational table has `hotel_id`.
//    Backend middleware ALWAYS filters by hotel_id.
//    Frontend filtering alone is NOT sufficient.
//
// 2. QR TOKEN: Each table has a unique `qr_token` field.
//    The QR URL includes this token + a time-bound session.
//    Example: /customer/hotel-1?table=table-1&token=abc123xyz
//
// 3. ORDER ITEMS AS JSON: Using JSON column for order items
//    provides flexibility. In high-scale, consider a separate
//    OrderItem table for better querying.
//
// 4. INDEXES: Composite indexes on (hotel_id, status) enable
//    fast queries for kitchen display and reports.
//
// 5. SUBSCRIPTION: is_active flag + subscription_end_date
//    enables read-only mode when expired.

export {};
