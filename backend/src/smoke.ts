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
  const suffix = Date.now().toString(36) + crypto.randomBytes(3).toString('hex');

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
    assert(bundle.includes('My Orders'), 'Customer order tracking UI missing from deployed bundle');
  }

  const smokeAdminEmail = `smoke-admin-${suffix}@example.invalid`;
  const smokeAdminPassword = crypto.randomBytes(24).toString('base64url');
  const ownerEmail = `smoke-owner-${suffix}@example.invalid`;
  const ownerPassword = crypto.randomBytes(20).toString('base64url');

  let smokeAdminId: string | null = null;
  let hotelId: string | null = null;
  let socket: Socket | null = null;
  let customerSocket: Socket | null = null;

  try {
    const smokeAdmin = await prisma.user.create({
      data: {
        email: smokeAdminEmail,
        password: await bcrypt.hash(smokeAdminPassword, 10),
        name: 'Smoke Test Admin',
        role: 'SUPER_ADMIN',
        hotelId: null,
        isActive: true,
      },
    });
    smokeAdminId = smokeAdmin.id;

    const adminCookie = await login(baseUrl, smokeAdminEmail, smokeAdminPassword);

    const verify = await authenticatedGet(baseUrl, '/api/auth/verify', adminCookie);
    const verifyBody: any = await verify.json();
    assert(
      verify.ok && verifyBody?.data?.user?.role === 'SUPER_ADMIN',
      'Admin session verification failed'
    );

    const platformHotels = await authenticatedGet(baseUrl, '/api/platform/hotels', adminCookie);
    assert(platformHotels.ok, 'Admin dashboard data endpoint failed');

    const anonymousPlatform = await fetch(baseUrl + '/api/platform/hotels');
    assert(
      anonymousPlatform.status === 401 || anonymousPlatform.status === 403,
      'Platform API is not protected'
    );

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

    await prisma.user.create({
      data: {
        email: ownerEmail,
        password: await bcrypt.hash(ownerPassword, 10),
        name: 'Smoke Test Owner',
        role: 'OWNER',
        hotelId,
        isActive: true,
      },
    });

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

    const ownerSettings = await authenticatedGet(baseUrl, '/api/owner/settings', ownerCookie);
    const ownerSettingsBody: any = await ownerSettings.json();
    assert(ownerSettings.ok && ownerSettingsBody?.data?.hotel?.id === hotelId, 'Owner settings failed');

    const updateSettings = await fetch(baseUrl + '/api/owner/settings', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: ownerCookie,
      },
      body: JSON.stringify({
        name: 'Smoke Test Owner',
        email: ownerEmail,
        hotelName: 'Smoke Test Hotel ' + suffix,
        address: 'Smoke Test Address',
        phone: '9999999999',
        businessEmail: '',
      }),
    });
    assert(updateSettings.ok, 'Owner profile/settings update failed');

    const addTableResponse = await fetch(baseUrl + '/api/tables', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: ownerCookie,
      },
      body: JSON.stringify({ tableNumber: 2, capacity: 4 }),
    });
    assert(addTableResponse.ok, 'Owner add-table action failed');

    const addMenuResponse = await fetch(baseUrl + '/api/menu', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: ownerCookie,
      },
      body: JSON.stringify({
        name: 'Smoke Extra Item',
        description: 'Owner CRUD verification',
        price: 55,
        category: 'Test',
        isAvailable: true,
        prepTimeMinutes: 2,
      }),
    });
    assert(addMenuResponse.ok, 'Owner add-menu action failed');

    const staffEmail = `smoke-waiter-${suffix}@example.invalid`;
    const addStaffResponse = await fetch(baseUrl + '/api/staff', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: ownerCookie,
      },
      body: JSON.stringify({
        name: 'Smoke Waiter',
        email: staffEmail,
        password: crypto.randomBytes(16).toString('base64url'),
        role: 'WAITER',
      }),
    });
    const addStaffBody: any = await addStaffResponse.json();
    assert(addStaffResponse.ok && addStaffBody?.data?.id, 'Owner add-staff action failed');

    const toggleStaffResponse = await fetch(baseUrl + '/api/staff/' + addStaffBody.data.id + '/toggle', {
      method: 'PATCH',
      headers: { Cookie: ownerCookie },
    });
    assert(toggleStaffResponse.ok, 'Owner staff toggle action failed');

    const reportResponse = await authenticatedGet(
      baseUrl,
      '/api/reports/revenue?hotelId=' + encodeURIComponent(hotelId),
      ownerCookie
    );
    assert(reportResponse.ok, 'Owner reports endpoint failed');

    const ownerPlatform = await authenticatedGet(baseUrl, '/api/platform/hotels', ownerCookie);
    assert(ownerPlatform.status === 403, 'Non-admin user was able to access platform API');

    socket = createSocket(baseUrl, {
      transports: ['websocket', 'polling'],
      extraHeaders: { Cookie: ownerCookie },
      reconnection: false,
    });
    await waitForSocket(socket);

    const staffLiveEvent = new Promise<any>((resolve, reject) => {
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

    const staffEvent = await staffLiveEvent;
    assert(
      staffEvent?.orderId === orderBody.data.orderId,
      'Staff Socket.IO event did not match created order'
    );

    const publicOrder = await fetch(
      baseUrl + '/api/public/orders/' + encodeURIComponent(orderBody.data.orderId) +
      '?hotelId=' + encodeURIComponent(hotelId) +
      '&tableId=' + encodeURIComponent(table.id) +
      '&token=' + encodeURIComponent(table.qrToken)
    );
    const publicOrderBody: any = await publicOrder.json();
    assert(
      publicOrder.ok && publicOrderBody?.data?.id === orderBody.data.orderId,
      'Customer order details endpoint failed'
    );
    assert(
      Array.isArray(publicOrderBody?.data?.items) &&
      publicOrderBody.data.items[0]?.name === 'Smoke Test Item',
      'Customer order item details are incomplete'
    );

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

    const snapshot = new Promise<any>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Customer order snapshot timed out')), 8000);
      customerSocket!.once('order_snapshot', payload => {
        clearTimeout(timer);
        resolve(payload);
      });
    });

    customerSocket.emit('watch_order', { orderId: orderBody.data.orderId });
    const snapshotPayload = await snapshot;
    assert(
      snapshotPayload?.orderId === orderBody.data.orderId,
      'Customer could not subscribe to own order'
    );

    const customerUpdate = new Promise<any>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Customer live order update timed out')), 8000);
      customerSocket!.once('order_updated', payload => {
        clearTimeout(timer);
        resolve(payload);
      });
    });

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
      customerEvent?.orderId === orderBody.data.orderId &&
      customerEvent?.status === 'PREPARING',
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
    }

    if (smokeAdminId) {
      await prisma.auditLog.deleteMany({ where: { userId: smokeAdminId } });
      await prisma.user.deleteMany({ where: { id: smokeAdminId } });
    }
  }
}
