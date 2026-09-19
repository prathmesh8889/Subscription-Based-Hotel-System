import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { io as createSocket, Socket } from 'socket.io-client';
import { prisma } from './config/database';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function login(baseUrl: string, email: string, password: string): Promise<string> {
  const response = await fetch(baseUrl + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const body: any = await response.json();
  assert(response.ok && body?.success, 'Login smoke test failed for ' + email);

  const setCookie = response.headers.get('set-cookie');
  assert(setCookie, 'Login did not return an auth cookie');
  return setCookie.split(';')[0];
}

function waitForSocket(socket: Socket): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Socket connection timed out')), 8000);
    socket.once('connect', () => {
      clearTimeout(timer);
      resolve();
    });
    socket.once('connect_error', error => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

export async function runProductionSmokeTests(port: number): Promise<void> {
  const baseUrl = `http://127.0.0.1:${port}`;
  const adminEmail = process.env.SUPER_ADMIN_EMAIL!;
  const adminPassword = process.env.SUPER_ADMIN_PASSWORD!;

  const health = await fetch(baseUrl + '/health');
  const healthBody: any = await health.json();
  assert(health.ok && healthBody?.database === 'connected', 'Health endpoint/database check failed');

  await login(baseUrl, adminEmail, adminPassword);

  const suffix = Date.now().toString(36) + crypto.randomBytes(3).toString('hex');
  const ownerEmail = `smoke-owner-${suffix}@example.invalid`;
  const ownerPassword = crypto.randomBytes(20).toString('base64url');

  let hotelId: string | null = null;
  let ownerId: string | null = null;
  let tableId: string | null = null;
  let menuItemId: string | null = null;
  let orderId: string | null = null;
  let socket: Socket | null = null;

  try {
    const hotel = await prisma.hotel.create({
      data: {
        name: 'Smoke Test Hotel ' + suffix,
        subscriptionPlan: 'TRIAL',
        subscriptionStart: new Date(),
        subscriptionEnd: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isActive: true,
        maxTables: 2,
        maxMenuItems: 5,
        maxStaff: 2,
      },
    });
    hotelId = hotel.id;

    const owner = await prisma.user.create({
      data: {
        email: ownerEmail,
        password: await bcrypt.hash(ownerPassword, 10),
        name: 'Smoke Test Owner',
        role: 'OWNER',
        hotelId,
        isActive: true,
      },
    });
    ownerId = owner.id;

    const table = await prisma.table.create({
      data: {
        hotelId,
        tableNumber: 1,
        capacity: 2,
        qrToken: crypto.randomBytes(32).toString('hex'),
      },
    });
    tableId = table.id;

    const menuItem = await prisma.menuItem.create({
      data: {
        hotelId,
        name: 'Smoke Test Item',
        description: 'Temporary production verification item',
        price: 99,
        category: 'Test',
        isAvailable: true,
        prepTimeMinutes: 1,
      },
    });
    menuItemId = menuItem.id;

    const ownerCookie = await login(baseUrl, ownerEmail, ownerPassword);

    socket = createSocket(baseUrl, {
      transports: ['websocket', 'polling'],
      extraHeaders: { Cookie: ownerCookie },
      reconnection: false,
    });

    await waitForSocket(socket);

    const liveEvent = new Promise<any>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('new_order Socket.IO event timed out')), 8000);
      socket!.once('new_order', payload => {
        clearTimeout(timer);
        resolve(payload);
      });
    });

    const orderResponse = await fetch(baseUrl + '/api/public/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hotelId,
        tableId,
        token: table.qrToken,
        items: [{ menuItemId, quantity: 1 }],
      }),
    });

    const orderBody: any = await orderResponse.json();
    assert(orderResponse.ok && orderBody?.success, 'Public QR order request failed');
    orderId = orderBody.data.orderId;

    const event = await liveEvent;
    assert(event?.orderId === orderId, 'Socket.IO event did not match the created order');

    const savedOrder = await prisma.order.findUnique({ where: { id: orderId } });
    assert(savedOrder, 'Order was not persisted in PostgreSQL');
    assert(Number(savedOrder.totalAmount) === 99, 'Server-side order total calculation is incorrect');
  } finally {
    if (socket) socket.disconnect();
    if (hotelId) {
      await prisma.auditLog.deleteMany({ where: { hotelId } });
      await prisma.order.deleteMany({ where: { hotelId } });
      await prisma.menuItem.deleteMany({ where: { hotelId } });
      await prisma.table.deleteMany({ where: { hotelId } });
      await prisma.user.deleteMany({ where: { hotelId } });
      await prisma.hotel.deleteMany({ where: { id: hotelId } });
    } else if (ownerId) {
      await prisma.user.deleteMany({ where: { id: ownerId } });
    }
  }
}
