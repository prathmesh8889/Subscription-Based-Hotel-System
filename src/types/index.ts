// ============================================================
// Multi-Tenant Hotel/Restaurant Management System - Type Definitions
// ============================================================

export type UserRole = 'SUPER_ADMIN' | 'OWNER' | 'KITCHEN' | 'WAITER' | 'CUSTOMER';

export type PlanType = 'TRIAL' | 'STARTER' | 'PRO' | 'BUSINESS';

export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'SERVED';

export type PaymentStatus = 'UNPAID' | 'PAID';

export type PaymentMethod = 'CASH' | 'UPI' | 'CARD';

export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';

// ============================================================
// Core Entities
// ============================================================

export interface User {
  id: string;
  email: string;
  name: string;
  password?: string; // In real app: hashed (not returned from API)
  role: UserRole;
  hotelId: string | null;
  hotel_id?: string | null; // Alias for backward compatibility
  avatar?: string;
}

export interface Hotel {
  id: string;
  name: string;
  owner_id: string;
  plan_type: PlanType;
  subscription_start_date: string;
  subscription_end_date: string;
  is_active: boolean;
  max_tables: number;
  max_menu_items: number;
  address: string;
  phone: string;
  logo?: string;
}

export interface Table {
  id: string;
  hotel_id: string;
  table_number: number;
  qr_token: string;
  status: TableStatus;
  capacity: number;
}

export interface MenuItem {
  id: string;
  hotel_id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  is_available: boolean;
  prep_time_minutes: number;
}

export interface OrderItem {
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export interface Order {
  id: string;
  hotel_id: string;
  table_id: string;
  table_number: number;
  items: OrderItem[];
  total_amount: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method?: PaymentMethod;
  created_at: string;
  updated_at: string;
  notes?: string;
}

export interface CartItem {
  menu_item: MenuItem;
  quantity: number;
  notes?: string;
}

// ============================================================
// Plan Limits
// ============================================================

export interface PlanLimits {
  max_tables: number;
  max_menu_items: number;
  max_staff: number;
  features: string[];
}

export const PLAN_CONFIG: Record<PlanType, PlanLimits & { price: number; name: string }> = {
  TRIAL: {
    name: '14-Day Trial',
    price: 0,
    max_tables: 5,
    max_menu_items: 20,
    max_staff: 3,
    features: ['Basic Menu', 'QR Ordering', 'Kitchen Display'],
  },
  STARTER: {
    name: 'Starter',
    price: 499,
    max_tables: 10,
    max_menu_items: 50,
    max_staff: 5,
    features: ['Full Menu Management', 'QR Ordering', 'Kitchen Display', 'Basic Reports'],
  },
  PRO: {
    name: 'Pro',
    price: 999,
    max_tables: 25,
    max_menu_items: 150,
    max_staff: 15,
    features: ['Everything in Starter', 'Advanced Reports', 'Staff Management', 'Bill Export'],
  },
  BUSINESS: {
    name: 'Business',
    price: 1999,
    max_tables: 100,
    max_menu_items: 500,
    max_staff: 50,
    features: ['Everything in Pro', 'Multi-branch', 'API Access', 'Priority Support', 'Custom Branding'],
  },
};
