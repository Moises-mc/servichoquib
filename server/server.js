import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'cambia-esta-clave-en-produccion';

app.use(cors({ origin: true }));
app.use(express.json({ limit: '2mb' }));

const users = [
  { id: 'c1', name: 'Ana García', email: 'ana@email.com', role: 'cliente', password: 'ana123', avatar: 'AG', location: 'Centro, Quibdó' },
  { id: 'p1', name: 'Carlos Mena', email: 'carlos@email.com', role: 'prestador', password: 'carlos123', avatar: 'CM', location: 'Barrio Huapango', rating: 4.9 },
  { id: 'p4', name: 'Marco Riascos', email: 'marco@email.com', role: 'prestador', password: 'marco123', avatar: 'MR', location: 'Villa del Río', rating: 4.6 },
  { id: 'p6', name: 'Sandra Moya', email: 'sandra@email.com', role: 'prestador', password: 'sandra123', avatar: 'SM', location: 'Virtual', rating: 4.9 }
];

let services = [
  { id: 's1', ownerId: 'p1', provider: 'Carlos Mena', avatar: 'CM', category: 'Barbería', title: 'Corte y afeitado clásico', desc: 'Corte moderno, afeitado y tratamiento capilar.', price: 25000, unit: 'por servicio', rating: 4.9, reviews: 143, location: 'Barrio Huapango, Quibdó', available: true },
  { id: 's4', ownerId: 'p4', provider: 'Marco Riascos', avatar: 'MR', category: 'Técnico', title: 'Soporte técnico PC y celulares', desc: 'Reparación de computadores, software y celulares.', price: 50000, unit: 'por visita', rating: 4.6, reviews: 201, location: 'Villa del Río', available: true },
  { id: 's6', ownerId: 'p6', provider: 'Sandra Moya', avatar: 'SM', category: 'Tutorías', title: 'Clases de matemáticas y física', desc: 'Refuerzo escolar con metodología personalizada.', price: 30000, unit: 'por hora', rating: 4.9, reviews: 64, location: 'A domicilio / Virtual', available: true }
];

let bookings = [
  { id: 'b1', service_id: 's1', client_id: 'c1', provider_id: 'p1', title: 'Corte y afeitado clásico', provider: 'Carlos Mena', client: 'Ana García', date: '2026-09-08', status: 'completado', total: 25000, commission: 2500, paid: 1, payment_amount: 22500 },
  { id: 'b2', service_id: 's1', client_id: 'c1', provider_id: 'p1', title: 'Corte y afeitado clásico', provider: 'Carlos Mena', client: 'Ana García', date: '2026-09-14', status: 'confirmado', total: 25000, commission: 2500, paid: 0, payment_amount: 0 },
  { id: 'b3', service_id: 's6', client_id: 'c1', provider_id: 'p6', title: 'Clases de matemáticas y física', provider: 'Sandra Moya', client: 'Ana García', date: '2026-09-15', status: 'pendiente', total: 30000, commission: 3000, paid: 0, payment_amount: 0 }
];
let messages = [];
let reviews = [];

const publicUser = ({ password, ...user }) => user;
const tokenFor = user => jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  try {
    req.auth = jwt.verify(token, JWT_SECRET);
    req.user = users.find(user => user.id === req.auth.id);
    if (!req.user) throw new Error('Usuario no encontrado');
    next();
  } catch {
    res.status(401).json({ error: 'Sesión no válida.' });
  }
}

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'Servi Choquib API' }));

app.post('/api/login', (req, res) => {
  const identifier = String(req.body.identifier || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const user = users.find(item => item.email.toLowerCase() === identifier);
  if (!user || user.password !== password) return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
  res.json({ user: publicUser(user), token: tokenFor(user) });
});

app.post('/api/register', (req, res) => {
  const { name, email, phone = '', password, role = 'cliente' } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Completa los campos obligatorios.' });
  if (users.some(user => user.email.toLowerCase() === email.toLowerCase())) return res.status(409).json({ error: 'Ese correo ya está registrado.' });
  const user = { id: `u${Date.now()}`, name, email, phone, password, role, avatar: name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase(), location: 'Quibdó' };
  users.push(user);
  res.status(201).json({ user: publicUser(user), token: tokenFor(user) });
});

app.get('/api/me', auth, (req, res) => res.json({ user: publicUser(req.user) }));
app.get('/api/profile', auth, (req, res) => res.json({ user: publicUser(req.user) }));
app.put('/api/profile', auth, (req, res) => {
  Object.assign(req.user, req.body);
  res.json({ user: publicUser(req.user) });
});

app.get('/api/services', (req, res) => res.json({ services }));
app.post('/api/services', auth, (req, res) => {
  const service = { ...req.body, id: `s${Date.now()}`, ownerId: req.user.id, provider: req.user.name, avatar: req.user.avatar, rating: 0, reviews: 0, available: true };
  services.unshift(service);
  res.status(201).json({ service });
});
app.put('/api/services/:id', auth, (req, res) => {
  const service = services.find(item => item.id === req.params.id && item.ownerId === req.user.id);
  if (!service) return res.status(404).json({ error: 'Servicio no encontrado.' });
  Object.assign(service, req.body);
  res.json({ service });
});
app.delete('/api/services/:id', auth, (req, res) => {
  const index = services.findIndex(item => item.id === req.params.id && item.ownerId === req.user.id);
  if (index < 0) return res.status(404).json({ error: 'Servicio no encontrado.' });
  services.splice(index, 1);
  res.json({ ok: true });
});

app.get('/api/contacts', auth, (req, res) => res.json({ contacts: users.filter(user => user.id !== req.user.id).map(publicUser) }));

app.get('/api/bookings', auth, (req, res) => {
  const visible = bookings.filter(item => item.client_id === req.user.id || item.provider_id === req.user.id || req.user.role === 'admin');
  res.json({ bookings: visible });
});
app.post('/api/bookings', auth, (req, res) => {
  const service = services.find(item => item.id === String(req.body.serviceId));
  if (!service) return res.status(404).json({ error: 'Servicio no encontrado.' });
  const booking = { id: `b${Date.now()}`, service_id: service.id, client_id: req.user.id, provider_id: service.ownerId, title: service.title, provider: service.provider, client: req.user.name, date: req.body.date, note: req.body.note || '', status: 'pendiente', total: Number(service.price), commission: Math.round(Number(service.price) * .1), paid: 0 };
  bookings.unshift(booking);
  res.status(201).json({ bookingId: booking.id, booking });
});
app.put('/api/bookings/:id', auth, (req, res) => {
  const booking = bookings.find(item => item.id === req.params.id);
  if (!booking) return res.status(404).json({ error: 'Solicitud no encontrada.' });
  booking.status = req.body.status;
  if (booking.status === 'completado') { booking.paid = 1; booking.payment_amount = booking.total - booking.commission; }
  res.json({ ok: true, payment_amount: booking.payment_amount || 0, paid: Boolean(booking.paid) });
});

app.get('/api/messages', auth, (req, res) => {
  const withId = String(req.query.with || '');
  const visible = withId
    ? messages.filter(item => (item.sender_id === req.user.id && item.receiver_id === withId) || (item.receiver_id === req.user.id && item.sender_id === withId))
    : messages.filter(item => item.sender_id === req.user.id || item.receiver_id === req.user.id);
  res.json({ messages: visible });
});
app.post('/api/messages', auth, (req, res) => {
  const text = String(req.body.text || '').trim();
  const receiverId = String(req.body.receiverId || '');
  if (!text || !receiverId) return res.status(400).json({ error: 'Escribe un mensaje y selecciona un contacto.' });
  const message = { id: `m${Date.now()}`, sender_id: req.user.id, receiver_id: receiverId, text, created_at: new Date().toISOString() };
  messages.push(message);
  res.status(201).json({ message });
});

app.post('/api/reviews', auth, (req, res) => {
  reviews.push({ ...req.body, id: `r${Date.now()}`, userId: req.user.id });
  res.status(201).json({ reviewId: reviews.at(-1).id });
});

app.listen(PORT, () => console.log(`Servi Choquib API disponible en http://localhost:${PORT}`));
