import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { newDb } from 'pg-mem';
import { setPoolForTests, initializeDatabase, closeDatabase, schema } from '../src/database/db.js';
import { createApp } from '../src/app.js';
import { seedDemoData } from './fixtures/demo-seed.js';
import { BookingModel } from '../src/models/booking.model.js';

let server;
let application;
let baseUrl;
let anaToken;
let carlosToken;
let marcoToken;
let adminToken;

async function request(path, { token, method = 'GET', body, headers = {} } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const text = await response.text();
  return { status: response.status, data: text ? JSON.parse(text) : {} };
}

before(async () => {
  const memory = newDb({ autoCreateForeignKeyIndices: true });
  const adapter = memory.adapters.createPg();
  setPoolForTests(new adapter.Pool());
  await initializeDatabase();
  await seedDemoData();

  application = createApp();
  server = application.httpServer;
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  const [ana, carlos, marco, admin] = await Promise.all([
    request('/api/login', { method: 'POST', body: { identifier: 'ana@email.com', password: 'ana12345' } }),
    request('/api/login', { method: 'POST', body: { identifier: 'carlos@email.com', password: 'carlos12345' } }),
    request('/api/login', { method: 'POST', body: { identifier: 'marco@email.com', password: 'marco12345' } }),
    request('/api/login', { method: 'POST', body: { identifier: 'admin@servicios.co', password: 'admin12345' } }),
  ]);
  anaToken = ana.data.token;
  carlosToken = carlos.data.token;
  marcoToken = marco.data.token;
  adminToken = admin.data.token;
});

after(async () => {
  if (application?.io) await new Promise(resolve => application.io.close(resolve));
  else if (server?.listening) await new Promise(resolve => server.close(resolve));
  await closeDatabase();
});


test('modo serverless inicializa antes de las rutas y desactiva sockets y disco local', async () => {
  let initializationCount = 0;
  const serverless = createApp({
    enableSockets: false,
    enableLocalUploads: false,
    beforeRoutes: async () => { initializationCount += 1; },
  });
  assert.equal(serverless.io, null);

  await new Promise((resolve, reject) => {
    serverless.httpServer.once('error', reject);
    serverless.httpServer.listen(0, '127.0.0.1', resolve);
  });
  const url = `http://127.0.0.1:${serverless.httpServer.address().port}`;
  try {
    const health = await fetch(`${url}/api/health`);
    assert.equal(health.status, 200);
    const upload = await fetch(`${url}/api/uploads`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${anaToken}` },
    });
    assert.equal(upload.status, 501);
    assert.equal(initializationCount, 2);
  } finally {
    await new Promise(resolve => serverless.httpServer.close(resolve));
  }
});

test('el esquema se inicializa y las reservas demo aplican nota vacía por defecto', async () => {
  assert.ok(schema.includes('servi_choquib'));
  const demoBooking = await BookingModel.findById('b1');
  assert.equal(demoBooking.note, '');
  const health = await request('/api/health');
  assert.equal(health.status, 200);
  assert.equal(health.data.database, 'connected');
});

test('CORS responde al preflight OPTIONS desde Live Server por localhost y 127.0.0.1', async () => {
  for (const origin of ['http://localhost:5500', 'http://127.0.0.1:5500']) {
    const response = await fetch(`${baseUrl}/api/login`, {
      method: 'OPTIONS',
      headers: { Origin: origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type' },
    });
    assert.equal(response.status, 204);
    assert.equal(response.headers.get('access-control-allow-origin'), origin);
    assert.match(response.headers.get('access-control-allow-methods') || '', /POST/);
    const allowedHeaders = (response.headers.get('access-control-allow-headers') || '').toLowerCase();
    assert.match(allowedHeaders, /authorization/);
    assert.match(allowedHeaders, /content-type/);
  }
});

test('catálogo demo persiste ocho servicios y cuentas', async () => {
  const catalog = await request('/api/services');
  assert.equal(catalog.status, 200);
  assert.equal(catalog.data.services.length, 8);
  assert.ok(catalog.data.services.every(service => service.ownerId));
});

test('autenticación devuelve usuario público sin hash de contraseña', async () => {
  const me = await request('/api/me', { token: anaToken });
  assert.equal(me.status, 200);
  assert.equal(me.data.user.email, 'ana@email.com');
  assert.equal(Object.hasOwn(me.data.user, 'passwordHash'), false);
});

test('el perfil ignora cambios no autorizados', async () => {
  const result = await request('/api/profile', {
    token: anaToken, method: 'PUT',
    body: { name: 'Ana María', role: 'admin', email: 'intruso@example.com', passwordHash: 'exposed' },
  });
  assert.equal(result.status, 200);
  assert.equal(result.data.user.name, 'Ana María');
  assert.equal(result.data.user.role, 'cliente');
  assert.equal(result.data.user.email, 'ana@email.com');
  assert.equal(Object.hasOwn(result.data.user, 'passwordHash'), false);
});

test('solo el propietario puede editar y borrar un servicio', async () => {
  const created = await request('/api/services', {
    token: carlosToken, method: 'POST',
    body: { title: 'Servicio de prueba', price: 12000, category: 'Oficios', desc: 'Prueba', unit: 'por servicio', location: 'Quibdó' },
  });
  assert.equal(created.status, 201);
  const id = created.data.service.id;
  const forbiddenUpdate = await request(`/api/services/${id}`, { token: marcoToken, method: 'PUT', body: { title: 'Intento de edición' } });
  assert.equal(forbiddenUpdate.status, 404);
  const updated = await request(`/api/services/${id}`, { token: carlosToken, method: 'PUT', body: { title: 'Servicio actualizado', ownerId: 'p4', rating: 5 } });
  assert.equal(updated.status, 200);
  assert.equal(updated.data.service.title, 'Servicio actualizado');
  assert.equal(updated.data.service.ownerId, 'p1');
  assert.equal(updated.data.service.rating, 0);
  const forbiddenDelete = await request(`/api/services/${id}`, { token: marcoToken, method: 'DELETE' });
  assert.equal(forbiddenDelete.status, 404);
  const deleted = await request(`/api/services/${id}`, { token: carlosToken, method: 'DELETE' });
  assert.equal(deleted.status, 200);
});

test('reservas persisten, filtran usuarios y validan permisos', async () => {
  const created = await request('/api/bookings', { token: anaToken, method: 'POST', body: { serviceId: 's4', date: '2026-12-01' } });
  assert.equal(created.status, 201);
  assert.equal(created.data.booking.note, '');
  const bookingId = created.data.booking.id;
  const marcoBookings = await request('/api/bookings', { token: marcoToken });
  assert.ok(marcoBookings.data.bookings.some(item => item.id === bookingId));
  const unauthorized = await request(`/api/bookings/${bookingId}`, { token: carlosToken, method: 'PUT', body: { status: 'confirmado' } });
  assert.equal(unauthorized.status, 403);
  const confirmed = await request(`/api/bookings/${bookingId}`, { token: marcoToken, method: 'PUT', body: { status: 'confirmado' } });
  assert.equal(confirmed.status, 200);
  const completed = await request(`/api/bookings/${bookingId}`, { token: marcoToken, method: 'PUT', body: { status: 'completado' } });
  assert.equal(completed.status, 200);
  assert.equal(completed.data.payment_amount, 0);
  assert.equal(completed.data.paid, false);
});

test('mensajes persisten y el remitente conserva control de edición y borrado', async () => {
  const created = await request('/api/messages', { token: anaToken, method: 'POST', body: { receiverId: 'p1', text: 'Mensaje privado de prueba' } });
  assert.equal(created.status, 201);
  const id = created.data.message.id;
  const denied = await request(`/api/messages/${id}`, { token: marcoToken, method: 'DELETE' });
  assert.equal(denied.status, 404);
  const updated = await request(`/api/messages/${id}`, { token: anaToken, method: 'PUT', body: { text: 'Mensaje editado' } });
  assert.equal(updated.status, 200);
  assert.equal(updated.data.message.text, 'Mensaje editado');
  const deleted = await request(`/api/messages/${id}`, { token: anaToken, method: 'DELETE' });
  assert.equal(deleted.status, 200);
});


test('el administrador recibe el padrón real completo y los usuarios normales no se listan a sí mismos', async () => {
  const adminContacts = await request('/api/contacts', { token: adminToken });
  assert.equal(adminContacts.status, 200);
  assert.ok(adminContacts.data.contacts.some(user => user.id === 'a1'));
  assert.equal(adminContacts.data.contacts.length, 11);
  const clientContacts = await request('/api/contacts', { token: anaToken });
  assert.equal(clientContacts.status, 200);
  assert.equal(clientContacts.data.contacts.some(user => user.id === 'c1'), false);
});

test('la bandeja de conversaciones solo incluye usuarios con mensajes intercambiados', async () => {
  const marcoEmpty = await request('/api/conversations', { token: marcoToken });
  assert.equal(marcoEmpty.status, 200);
  assert.deepEqual(marcoEmpty.data.contacts, []);
  const anaConversations = await request('/api/conversations', { token: anaToken });
  assert.equal(anaConversations.status, 200);
  assert.ok(anaConversations.data.contacts.some(contact => contact.id === 'p1'));
  assert.equal(anaConversations.data.contacts.some(contact => contact.id === 'p4'), false);
});

test('mensajería rechaza adjuntos con tipos o contenido no permitido', async () => {
  const invalid = await request('/api/messages', { token: anaToken, method: 'POST', body: { receiverId: 'p1', text: '', attachment: { name: 'x.svg', type: 'image/svg+xml', dataUrl: 'data:text/html,<script>alert(1)</script>' } } });
  assert.equal(invalid.status, 400);
  const valid = await request('/api/messages', { token: anaToken, method: 'POST', body: { receiverId: 'p1', text: '', attachment: { name: 'nota.txt', type: 'text/plain', dataUrl: 'data:text/plain;base64,aGVsbG8=' } } });
  assert.equal(valid.status, 201);
  assert.equal(valid.data.message.attachment.size, 5);
});

test('reseñas requieren reserva completada y no permiten duplicados', async () => {
  const payload = { bookingId: 'b1', rating: 5, comment: 'Muy buen servicio.' };
  const first = await request('/api/reviews', { token: anaToken, method: 'POST', body: payload });
  assert.equal(first.status, 201);
  const duplicate = await request('/api/reviews', { token: anaToken, method: 'POST', body: payload });
  assert.equal(duplicate.status, 409);
});

test('validación y autenticación rechazan datos incompletos', async () => {
  const login = await request('/api/login', { method: 'POST', body: { identifier: 'no-es-correo', password: '' } });
  assert.equal(login.status, 400);
  const protectedRoute = await request('/api/bookings');
  assert.equal(protectedRoute.status, 401);
});


import crypto from 'node:crypto';

function rapydHeaders(url, body) {
  const salt = crypto.randomBytes(6).toString('hex');
  const timestamp = String(Math.floor(Date.now() / 1000));
  const hex = crypto.createHmac('sha256', 'test_secret').update(`${url}${salt}${timestamp}test_accesstest_secret${body}`).digest('hex');
  return { salt, timestamp, signature: Buffer.from(hex).toString('base64') };
}

async function sendWebhook(event, { sign = true } = {}) {
  const raw = JSON.stringify(event);
  const url = `${baseUrl}/api/payments/webhook`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(sign ? rapydHeaders(url, raw) : {}) },
    body: raw,
  });
  return response.status;
}

test('panel admin: solo administradores; suspender bloquea el inicio de sesión', async () => {
  assert.equal((await request('/api/admin/dashboard', { token: anaToken })).status, 403);
  const dashboard = await request('/api/admin/dashboard', { token: adminToken });
  assert.equal(dashboard.status, 200);
  assert.ok(dashboard.data.summary.users >= 1);
  const carlos = dashboard.data.users.find(user => user.email === 'carlos@email.com');
  const suspended = await request(`/api/admin/users/${carlos.id}/status`, { token: adminToken, method: 'PATCH', body: { isActive: false } });
  assert.equal(suspended.status, 200);
  assert.equal((await request('/api/login', { method: 'POST', body: { identifier: 'carlos@email.com', password: 'carlos12345' } })).status, 403);
  assert.equal((await request('/api/bookings', { token: carlosToken })).status, 403);
  await request(`/api/admin/users/${carlos.id}/status`, { token: adminToken, method: 'PATCH', body: { isActive: true } });
  assert.equal((await request('/api/login', { method: 'POST', body: { identifier: 'carlos@email.com', password: 'carlos12345' } })).status, 200);
  const toggled = await request('/api/admin/services/s1/status', { token: adminToken, method: 'PATCH', body: { available: false } });
  assert.equal(toggled.data.service.available, false);
  await request('/api/admin/services/s1/status', { token: adminToken, method: 'PATCH', body: { available: true } });
});

test('pagos Rapyd: permisos, firma del webhook y confirmación en COP', async () => {
  const created = await request('/api/bookings', { token: anaToken, method: 'POST', body: { serviceId: 's4', date: '2026-12-05' } });
  const id = created.data.booking.id;
  assert.equal((await request('/api/payments/checkout', { method: 'POST', body: { bookingId: id } })).status, 401);
  assert.equal((await request('/api/payments/checkout', { token: marcoToken, method: 'POST', body: { bookingId: id } })).status, 403);

  const event = { type: 'PAYMENT_COMPLETED', data: { merchant_reference_id: id, amount: 50000, currency_code: 'COP' } };
  assert.equal(await sendWebhook(event, { sign: false }), 401);
  assert.equal((await request(`/api/payments/status/${id}`, { token: anaToken })).data.paid, false);

  // monto distinto al de la reserva: no se marca como pagada
  assert.equal(await sendWebhook({ ...event, data: { ...event.data, amount: 1 } }), 200);
  const review = await request(`/api/payments/status/${id}`, { token: anaToken });
  assert.equal(review.data.paid, false);
  assert.equal(review.data.paymentStatus, 'revisar');

  assert.equal(await sendWebhook(event), 200);
  const paid = await request(`/api/payments/status/${id}`, { token: anaToken });
  assert.equal(paid.data.paid, true);
  assert.equal(paid.data.paymentAmount, 50000);
  assert.equal((await request('/api/payments/status/' + id, { token: carlosToken })).status, 403);
  assert.equal((await request('/api/payments/checkout', { token: anaToken, method: 'POST', body: { bookingId: id } })).status, 409);
});
