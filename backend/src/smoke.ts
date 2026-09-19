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

async function authenticatedGet(baseUrl: string, path: string, cookie: string) {
  return fetch(baseUrl + path, { headers: { Cookie: cookie } });
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
  const frontendUrl = process.env.FRONTEND_URL?.replace(/\/$/, '');
  const adminEmail = process.env.SUPER_ADMIN_EMAIL!;
  const adminPassword = process.env.SUPER_ADMIN_PASSWORD!;

  const health = await fetch(baseUrl + '/health');
  const healthBody: any = await health.json();
  assert(health.ok && healthBody?.database === 'connected', 'Health endpoint/database check failed');

  if (frontendUrl) {
    const response = await fetch(frontendUrl + '/');
    const html = await response.text();
    assert(response.ok, 'Frontend root failed');
    assert(html.includes('id="root"'), 'Frontend SPA root missing');

    const scriptMatch = html.match(/<script[^>]+src="([^"]+\.js)"/i);
    assert(scriptMatch, 'Frontend JavaScript bundle not found');
    const bundleUrl = new URL(scriptMatch[1], frontendUrl + '/').toString();
    const bundleResponse = await fetch(bundleUrl);
    const bundle = await bundleResponse.text();
    assert(bundleResponse.ok, 'Frontend JavaScript bundle failed to load');
    assert(bundle.includes('Platform Admin'), 'Admin login UI missing from deployed bundle');
    assert(bundle.includes('Hotel Management'), 'Admin dashboard UI missing from deployed bundle');
    assert(bundle.includes('Super Admin access is required'), 'Admin role guard missing from deployed bundle');
  }

  const adminCookie = await login(baseUrl, adminEmail, adminPassword);

  const verify = await authenticatedGet(baseUrl, '/api/auth/verify', adminCookie);
  const verifyBody: any = await verify.json();
  assert(verify.ok && verifyBody?.data?.user?.role === 'SUPER_ADMIN', 'Admin session verification failed');

  const platformHotels = await authenticatedGet(baseUrl, '/api/platform/hotels', adminCookie);
  assert(platformHotels.ok, 'Admin dashboard data endpoint failed');

  const anonymousPlatform = await fetch(baseUrl + '/api/platform/hotels');
  assert(anonymousPlatform.status === 401 || anonymousPlatform.status === 403, 'Platform API is not protected');

  const suffix = Date.now().toString(36) + crypto.randomBytes(3).toString('hex');
  const ownerEmail = `smoke-owner-${suffix}@example.invalid`;
  const ownerPassword = crypto.randomBytes(20).toString('base64url');
  let hotelId: string | null = null;
  let ownerId: string | null = null;
  let socket: Socket | null = null;
  let customerSocket: Socket | null = null;

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

    const ownerCookie = await login(baseUrl, ownerEmail, ownerPassword);
    const ownerPlatform = await authenticatedGet(baseUrl, '/api/platform/hotels', ownerCookie);
    assert(ownerPlatform.status === 403, 'Non-admin user was able to access platform API');

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
        tableId: table.id,
        token: table.qrToken,
        items: [{ menuItemId: menuItem.id, quantity: 1 }],
      }),
    });
    const orderBody: any = await orderResponse.json();
    assert(orderResponse.ok && orderBody?.success, 'Public QR order request failed');

    const event = await liveEvent;
    assert(event?.orderId === orderBody.data.orderId, 'Socket.IO event did not match created order');

    const publicOrder = await fetch(
      baseUrl + '/api/public/orders/' + encodeURIComponent(orderBody.data.orderId) +
      '?hotelId=' + encodeURIComponent(hotelId) +
      '&tableId=' + encodeURIComponent(table.id) +
      '&token=' + encodeURIComponent(table.qrToken)
    );
    const publicOrderBody: any = await publicOrder.json();
    assert(publicOrder.ok && publicOrderBody?.data?.id === orderBody.data.orderId, 'Customer order details endpoint failed');

    customerSocket = createSocket(baseUrl + '/customer', {
      transports: ['websocket', 'polling'],
      auth: {
        hotelId,
        tableId: table.id,
        token: table.qrToken,
      },
      reconnection: false,
    });
    await waitForSocket(customerSocket);

    const customerUpdate = new Promise<any>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Customer live order update timed out')), 8000);
      customerSocket!.once('order_updated', payload => {
        clearTimeout(timer);
        resolve(payload);
      });
    });

    customerSocket.emit('watch_order', { orderId: orderBody.data.orderId });

    const statusResponse = await fetch(baseUrl + '/api/orders/' + orderBody.data.orderId + '/status', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: ownerCookie,
      },
      body: JSON.stringify({ status: 'PREPARING' }),
    });
    assert(statusResponse.ok, 'Staff order status update failed');

    const customerEvent = await customerUpdate;
    assert(
      customerEvent?.orderId === orderBody.data.orderId && customerEvent?.status === 'PREPARING',
      'Customer did not receive live PREPARING update'
    );

    const savedOrder = await prisma.order.findUnique({ where: { id: orderBody.data.orderId } });
    assert(savedOrder, 'Order was not persisted in PostgreSQL');
    assert(Number(savedOrder.totalAmount) === 99, 'Server-side total is incorrect');
  } finally {
    if (socket) socket.disconnect();
    if (customerSocket) customerSocket.disconnect();
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
