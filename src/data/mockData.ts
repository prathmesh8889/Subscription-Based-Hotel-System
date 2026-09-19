// ============================================================
// Mock Data Store - Simulates PostgreSQL Database
// ============================================================

import { Hotel, MenuItem, Order, Table, User } from '../types';

// ============================================================
// Users (with hotel_id for multi-tenancy)
// ============================================================
export const mockUsers: User[] = [
  {
    id: 'user-sa-1',
    email: 'admin@saas.com',
    name: 'Super Admin',
    password: 'admin123',
    role: 'SUPER_ADMIN',
    hotelId: null,
    hotel_id: null,
  },
  {
    id: 'user-own-1',
    email: 'owner@tajpalace.com',
    name: 'Rajesh Kumar',
    password: 'owner123',
    role: 'OWNER',
    hotelId: 'hotel-1',
    hotel_id: 'hotel-1',
  },
  {
    id: 'user-own-2',
    email: 'owner@spicegarden.com',
    name: 'Priya Sharma',
    password: 'owner123',
    role: 'OWNER',
    hotelId: 'hotel-2',
    hotel_id: 'hotel-2',
  },
  {
    id: 'user-kit-1',
    email: 'kitchen@tajpalace.com',
    name: 'Chef Anil',
    password: 'kitchen123',
    role: 'KITCHEN',
    hotelId: 'hotel-1',
    hotel_id: 'hotel-1',
  },
  {
    id: 'user-wait-1',
    email: 'waiter@tajpalace.com',
    name: 'Suresh',
    password: 'waiter123',
    role: 'WAITER',
    hotelId: 'hotel-1',
    hotel_id: 'hotel-1',
  },
];

// ============================================================
// Hotels (Tenants)
// ============================================================
export const mockHotels: Hotel[] = [
  {
    id: 'hotel-1',
    name: 'Taj Palace Restaurant',
    owner_id: 'user-own-1',
    plan_type: 'PRO',
    subscription_start_date: '2025-01-01',
    subscription_end_date: '2026-12-31',
    is_active: true,
    max_tables: 25,
    max_menu_items: 150,
    address: '123 MG Road, Bangalore',
    phone: '+91 98765 43210',
  },
  {
    id: 'hotel-2',
    name: 'Spice Garden',
    owner_id: 'user-own-2',
    plan_type: 'STARTER',
    subscription_start_date: '2025-06-01',
    subscription_end_date: '2026-06-01',
    is_active: true,
    max_tables: 10,
    max_menu_items: 50,
    address: '45 Park Street, Mumbai',
    phone: '+91 87654 32109',
  },
  {
    id: 'hotel-3',
    name: 'Cafe Mocha',
    owner_id: 'user-own-3',
    plan_type: 'TRIAL',
    subscription_start_date: '2026-01-01',
    subscription_end_date: '2026-01-15',
    is_active: false,
    max_tables: 5,
    max_menu_items: 20,
    address: '78 Linking Road, Mumbai',
    phone: '+91 76543 21098',
  },
];

// ============================================================
// Tables (hotel_id enforced)
// ============================================================
export const mockTables: Table[] = [
  { id: 'table-1', hotel_id: 'hotel-1', table_number: 1, qr_token: 'qr_h1_t1_a8f3k2', status: 'AVAILABLE', capacity: 4 },
  { id: 'table-2', hotel_id: 'hotel-1', table_number: 2, qr_token: 'qr_h1_t2_b9g4l3', status: 'OCCUPIED', capacity: 2 },
  { id: 'table-3', hotel_id: 'hotel-1', table_number: 3, qr_token: 'qr_h1_t3_c0h5m4', status: 'AVAILABLE', capacity: 6 },
  { id: 'table-4', hotel_id: 'hotel-1', table_number: 4, qr_token: 'qr_h1_t4_d1i6n5', status: 'AVAILABLE', capacity: 4 },
  { id: 'table-5', hotel_id: 'hotel-1', table_number: 5, qr_token: 'qr_h1_t5_e2j7o6', status: 'RESERVED', capacity: 8 },
  { id: 'table-6', hotel_id: 'hotel-2', table_number: 1, qr_token: 'qr_h2_t1_f3k8p7', status: 'AVAILABLE', capacity: 4 },
  { id: 'table-7', hotel_id: 'hotel-2', table_number: 2, qr_token: 'qr_h2_t2_g4l9q8', status: 'OCCUPIED', capacity: 2 },
  { id: 'table-8', hotel_id: 'hotel-2', table_number: 3, qr_token: 'qr_h2_t3_h5m0r9', status: 'AVAILABLE', capacity: 4 },
];

// ============================================================
// Menu Items (hotel_id enforced)
// ============================================================
export const mockMenuItems: MenuItem[] = [
  // Hotel 1 - Taj Palace
  { id: 'mi-1', hotel_id: 'hotel-1', name: 'Butter Chicken', description: 'Creamy tomato-based chicken curry', price: 320, category: 'Main Course', image_url: '', is_available: true, prep_time_minutes: 20 },
  { id: 'mi-2', hotel_id: 'hotel-1', name: 'Paneer Tikka', description: 'Grilled cottage cheese with spices', price: 250, category: 'Starters', image_url: '', is_available: true, prep_time_minutes: 15 },
  { id: 'mi-3', hotel_id: 'hotel-1', name: 'Dal Makhani', description: 'Slow-cooked black lentils', price: 200, category: 'Main Course', image_url: '', is_available: true, prep_time_minutes: 10 },
  { id: 'mi-4', hotel_id: 'hotel-1', name: 'Garlic Naan', description: 'Freshly baked naan with garlic butter', price: 60, category: 'Breads', image_url: '', is_available: true, prep_time_minutes: 5 },
  { id: 'mi-5', hotel_id: 'hotel-1', name: 'Biryani', description: 'Aromatic basmati rice with spices', price: 280, category: 'Rice', image_url: '', is_available: true, prep_time_minutes: 25 },
  { id: 'mi-6', hotel_id: 'hotel-1', name: 'Gulab Jamun', description: 'Sweet milk dumplings in syrup', price: 120, category: 'Desserts', image_url: '', is_available: true, prep_time_minutes: 5 },
  { id: 'mi-7', hotel_id: 'hotel-1', name: 'Masala Dosa', description: 'Crispy rice crepe with potato filling', price: 150, category: 'South Indian', image_url: '', is_available: false, prep_time_minutes: 12 },
  { id: 'mi-8', hotel_id: 'hotel-1', name: 'Mango Lassi', description: 'Refreshing mango yogurt drink', price: 80, category: 'Beverages', image_url: '', is_available: true, prep_time_minutes: 3 },
  // Hotel 2 - Spice Garden
  { id: 'mi-9', hotel_id: 'hotel-2', name: 'Chicken Biryani', description: 'Hyderabadi style dum biryani', price: 250, category: 'Rice', image_url: '', is_available: true, prep_time_minutes: 25 },
  { id: 'mi-10', hotel_id: 'hotel-2', name: 'Veg Thali', description: 'Complete meal with roti, rice, dal, sabzi', price: 180, category: 'Thali', image_url: '', is_available: true, prep_time_minutes: 10 },
  { id: 'mi-11', hotel_id: 'hotel-2', name: 'Samosa', description: 'Crispy pastry with spiced potato filling', price: 40, category: 'Snacks', image_url: '', is_available: true, prep_time_minutes: 5 },
  { id: 'mi-12', hotel_id: 'hotel-2', name: 'Chai', description: 'Traditional Indian tea', price: 20, category: 'Beverages', image_url: '', is_available: true, prep_time_minutes: 3 },
];

// ============================================================
// Orders (hotel_id enforced)
// ============================================================
export const mockOrders: Order[] = [
  {
    id: 'order-1',
    hotel_id: 'hotel-1',
    table_id: 'table-2',
    table_number: 2,
    items: [
      { menu_item_id: 'mi-1', name: 'Butter Chicken', price: 320, quantity: 1 },
      { menu_item_id: 'mi-4', name: 'Garlic Naan', price: 60, quantity: 3 },
    ],
    total_amount: 500,
    status: 'PREPARING',
    payment_status: 'UNPAID',
    created_at: '2026-01-15T12:30:00Z',
    updated_at: '2026-01-15T12:35:00Z',
  },
  {
    id: 'order-2',
    hotel_id: 'hotel-1',
    table_id: 'table-1',
    table_number: 1,
    items: [
      { menu_item_id: 'mi-2', name: 'Paneer Tikka', price: 250, quantity: 2 },
      { menu_item_id: 'mi-8', name: 'Mango Lassi', price: 80, quantity: 2 },
    ],
    total_amount: 660,
    status: 'READY',
    payment_status: 'UNPAID',
    created_at: '2026-01-15T12:15:00Z',
    updated_at: '2026-01-15T12:30:00Z',
  },
  {
    id: 'order-3',
    hotel_id: 'hotel-1',
    table_id: 'table-3',
    table_number: 3,
    items: [
      { menu_item_id: 'mi-5', name: 'Biryani', price: 280, quantity: 2 },
      { menu_item_id: 'mi-6', name: 'Gulab Jamun', price: 120, quantity: 2 },
    ],
    total_amount: 800,
    status: 'SERVED',
    payment_status: 'PAID',
    payment_method: 'UPI',
    created_at: '2026-01-15T11:00:00Z',
    updated_at: '2026-01-15T11:45:00Z',
  },
  {
    id: 'order-4',
    hotel_id: 'hotel-2',
    table_id: 'table-7',
    table_number: 2,
    items: [
      { menu_item_id: 'mi-9', name: 'Chicken Biryani', price: 250, quantity: 1 },
      { menu_item_id: 'mi-12', name: 'Chai', price: 20, quantity: 2 },
    ],
    total_amount: 290,
    status: 'PENDING',
    payment_status: 'UNPAID',
    created_at: '2026-01-15T12:40:00Z',
    updated_at: '2026-01-15T12:40:00Z',
  },
];
