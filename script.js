// ── State ──────────────────────────────────────────────────────
const STATE = {
  user: null,
  token: localStorage.getItem('servilocal_token'),
  chatPartnerId: null,
  contacts: [],
  allContacts: [],
  chatTimer: null,
  activeView: 'dashboard',
  selectedRole: 'cliente',
  chatMessages: [
    { from: 'them', text: '¡Hola! Vi tu solicitud. ¿A qué hora te queda bien?', time: '10:30' },
    { from: 'me', text: 'Hola Carlos, ¿puedes a las 3pm hoy?', time: '10:32' },
    { from: 'them', text: 'Perfecto, a las 3pm te espero. ¿Es en mi local o a domicilio?', time: '10:33' },
    { from: 'me', text: 'En tu local mejor, ya conozco la dirección.', time: '10:35' },
    { from: 'them', text: '¡Listo! Te espero. El servicio incluye lavado y tratamiento sin costo adicional.', time: '10:36' },
  ],
  chatAttachment: null,
  bookings: [
    { id: 'b1', title: 'Corte y afeitado clásico', provider: 'Carlos Mena', client: 'Ana García', date: '2026-09-12', status: 'completado', total: 25000, commission: 2500 },
    { id: 'b2', title: 'Soporte técnico PC', provider: 'Marco Riascos', client: 'Ana García', date: '2026-09-14', status: 'confirmado', total: 50000, commission: 5000 },
    { id: 'b3', title: 'Clases de matemáticas', provider: 'Sandra Moya', client: 'Pedro Morales', date: '2026-09-15', status: 'pendiente', total: 30000, commission: 3000 },
  ],
  currentService: null,
  bookingStep: 'form',
  categoryFilter: 'Todos',
};

// ── Data ───────────────────────────────────────────────────────
const CATEGORIES = ['Todos', 'Barbería', 'Carpintería', 'Técnico', 'Transporte', 'Oficios', 'Belleza', 'Tutorías'];
const DEMO_USERS = {
  'ana@email.com': { id: 'c1', name: 'Ana García', email: 'ana@email.com', role: 'cliente', avatar: 'AG', location: 'Centro, Quibdó', password: 'ana123' },
  'pedro@email.com': { id: 'c2', name: 'Pedro Morales', email: 'pedro@email.com', role: 'cliente', avatar: 'PM', location: 'Barrio Huapango', password: 'pedro123' },
  'carlos@email.com': { id: 'p1', name: 'Carlos Mena', email: 'carlos@email.com', role: 'prestador', avatar: 'CM', location: 'Barrio Huapango', password: 'carlos123', rating: 4.9 },
  'marco@email.com': { id: 'p4', name: 'Marco Riascos', email: 'marco@email.com', role: 'prestador', avatar: 'MR', location: 'Villa del Río', password: 'marco123', rating: 4.6 },
  'sandra@email.com': { id: 'p6', name: 'Sandra Moya', email: 'sandra@email.com', role: 'prestador', avatar: 'SM', location: 'Virtual', password: 'sandra123', rating: 4.9 },
  'admin@servicios.co': { id: 'a1', name: 'Administrador', email: 'admin@servicios.co', role: 'admin', avatar: 'AD', location: 'Servi Choquib HQ', password: 'admin123' },
};
const API = 'http://127.0.0.1:8000/api';

let SERVICES = [
  { id: 's1', provider: 'Carlos Mena', avatar: 'CM', category: 'Barbería', title: 'Corte y afeitado clásico', desc: 'Corte moderno con máquina y tijeras, afeitado con navaja y tratamiento capilar incluido. Experiencia de 8 años.', price: 25000, unit: 'por servicio', rating: 4.9, reviews: 143, location: 'Barrio Huapango, Quibdó', img: 'photo-1503951914875-452162b0f3f1', available: true },
  { id: 's2', provider: 'Lucía Torres', avatar: 'LT', category: 'Belleza', title: 'Peinado y tratamiento capilar', desc: 'Peinados para eventos, tratamientos hidratantes, alisado y tintes. Atención a domicilio disponible.', price: 35000, unit: 'por sesión', rating: 4.8, reviews: 89, location: 'Centro, Quibdó', img: 'photo-1560066984-138dadb4c035', available: true },
  { id: 's3', provider: 'Jesús Palomino', avatar: 'JP', category: 'Carpintería', title: 'Muebles a medida y reparaciones', desc: 'Fabricación de muebles en madera, reparación de puertas, ventanas y estantes. Trabajo garantizado.', price: 80000, unit: 'por día', rating: 4.7, reviews: 56, location: 'Sector Kennedy, Quibdó', img: 'photo-1558618666-fcd25c85cd64', available: true },
  { id: 's4', provider: 'Marco Riascos', avatar: 'MR', category: 'Técnico', title: 'Soporte técnico PC y celulares', desc: 'Reparación de computadores, instalación de software, recuperación de datos y pantallas móviles.', price: 50000, unit: 'por visita', rating: 4.6, reviews: 201, location: 'Villa del Río, Quibdó', img: 'photo-1518770660439-4636190af475', available: true },
  { id: 's5', provider: 'Andrés Córdoba', avatar: 'AC', category: 'Transporte', title: 'Transporte urbano y encomiendas', desc: 'Servicio de moto-taxi, mensajería y entrega de domicilios en toda la ciudad. Disponible 24h.', price: 5000, unit: 'por trayecto', rating: 4.5, reviews: 378, location: 'Toda la ciudad', img: 'photo-1449965408869-eaa3f722e40d', available: true },
  { id: 's6', provider: 'Sandra Moya', avatar: 'SM', category: 'Tutorías', title: 'Clases de matemáticas y física', desc: 'Refuerzo escolar y universitario en álgebra, cálculo y física. Metodología personalizada.', price: 30000, unit: 'por hora', rating: 4.9, reviews: 64, location: 'A domicilio / Virtual', img: 'photo-1434030216411-0b793f4b4173', available: true },
  { id: 's7', provider: 'Fabio Lemos', avatar: 'FL', category: 'Oficios', title: 'Plomería y fontanería', desc: 'Instalación y reparación de tuberías, grifos y baños. Materiales incluidos en el presupuesto.', price: 60000, unit: 'por servicio', rating: 4.4, reviews: 92, location: 'Quibdó y alrededores', img: 'photo-1558618047-3c8c76ca7d13', available: false },
  { id: 's8', provider: 'Gloria Pino', avatar: 'GP', category: 'Oficios', title: 'Servicio de limpieza del hogar', desc: 'Limpieza profunda de casas, apartamentos y oficinas. Incluye insumos y equipos.', price: 45000, unit: 'por visita', rating: 4.7, reviews: 117, location: 'Todo Quibdó', img: 'photo-1581578731548-c64695cc6952', available: true },
];

const USERS_DATA = [
  { id: 'c1', name: 'Ana García', email: 'ana@email.com', role: 'cliente', avatar: 'AG', location: 'Centro, Quibdó' },
  { id: 'c2', name: 'Pedro Morales', email: 'pedro@email.com', role: 'cliente', avatar: 'PM', location: 'Barrio Huapango' },
  { id: 'p1', name: 'Carlos Mena', email: 'carlos@email.com', role: 'prestador', avatar: 'CM', location: 'Barrio Huapango', rating: 4.9 },
  { id: 'p4', name: 'Marco Riascos', email: 'marco@email.com', role: 'prestador', avatar: 'MR', location: 'Villa del Río', rating: 4.6 },
  { id: 'p6', name: 'Sandra Moya', email: 'sandra@email.com', role: 'prestador', avatar: 'SM', location: 'Virtual', rating: 4.9 },
  { id: 'a1', name: 'Administrador', email: 'admin@servicios.co', role: 'admin', avatar: 'AD', location: 'Servi Choquib HQ' },
];

// ── Helpers ────────────────────────────────────────────────────
const COP = n => '$' + n.toLocaleString('es-CO') + ' COP';
const icon = id => `<i data-lucide="${id}" aria-hidden="true" class="icon"></i>`;
const refreshIcons = () => { if (window.lucide) window.lucide.createIcons({ attrs: { 'stroke-width': 1.8 } }); };
const smallIcon = id => `<svg width="14" height="14"><use href="#ic-${id}"/></svg>`;
const avatar = (initials, size = 36, color = '#22d3ee', imageUrl = '') => {
  if (imageUrl) {
    return `<img src="${imageUrl}" alt="${initials || 'perfil'}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;border:1.5px solid ${color}50;background:#0f172a;display:block" />`;
  }
  return `<div class="avatar" style="width:${size}px;height:${size}px;background:linear-gradient(135deg,${color}28,${color}55);border:1.5px solid ${color}50;font-size:${Math.round(size * 0.35)}px;font-weight:700;color:${color};font-family:'Outfit',sans-serif">${initials || 'U'}</div>`;
};
const stars = r => `<span style="color:#fbbf24;display:flex;gap:2px;align-items:center">${[1, 2, 3, 4, 5].map(i => `<svg width="13" height="13" fill="${i <= Math.round(r) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><use href="#ic-star-fill"/></svg>`).join('')}</span>`;
const badge = (text, type = 'cyan') => `<span class="badge badge-${type}">${text}</span>`;
const statusBadge = s => badge(s, s === 'completado' ? 'green' : s === 'confirmado' ? 'cyan' : s === 'pendiente' ? 'amber' : 'red');
const roleColor = r => r === 'admin' ? '#f59e0b' : r === 'prestador' ? '#22d3ee' : '#818cf8';

function findServiceById(serviceId) {
  const targetId = String(serviceId).trim();
  return SERVICES.find(item => String(item.id) === targetId) || null;
}

function findUserById(userId) {
  const targetId = String(userId ?? '').trim();
  if (!targetId) return null;
  return STATE.contacts.find(contact => String(contact.id) === targetId)
    || STATE.allContacts.find(contact => String(contact.id) === targetId)
    || (STATE.user && String(STATE.user.id) === targetId ? STATE.user : null)
    || USERS_DATA.find(user => String(user.id) === targetId)
    || null;
}

function findUserByName(name) {
  const targetName = String(name ?? '').trim().toLowerCase();
  if (!targetName) return null;
  return STATE.contacts.find(contact => String(contact.name).trim().toLowerCase() === targetName)
    || STATE.allContacts.find(contact => String(contact.name).trim().toLowerCase() === targetName)
    || USERS_DATA.find(user => String(user.name).trim().toLowerCase() === targetName)
    || null;
}

function handleDemoApiRequest(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body) : {};

  if (path === '/profile' && method === 'PUT') {
    STATE.user = { ...STATE.user, ...body, profile_image: body.profile_image || STATE.user.profile_image || '' };
    return { user: STATE.user };
  }
  if (path === '/services') return { services: SERVICES };
  if (path === '/me' || path === '/profile') return { user: STATE.user };
  if (path === '/contacts') return { contacts: USERS_DATA.filter(user => user.id !== STATE.user.id) };
  if (path === '/bookings' && method === 'GET') return { bookings: STATE.bookings };
  if (path === '/bookings' && method === 'POST') {
    const service = findServiceById(body.serviceId);
    if (!service) throw new Error('No se pudo encontrar este servicio.');
    const booking = {
      id: `demo-${Date.now()}`,
      service_id: Number(service.id),
      client_id: STATE.user.id,
      provider_id: service.ownerId || service.owner_id || service.id,
      title: service.title,
      provider: service.provider,
      client: STATE.user.name,
      date: body.date || new Date().toISOString().slice(0, 10),
      note: body.note || '',
      status: 'pendiente',
      total: Number(service.price),
      commission: Math.round(Number(service.price) * 0.1),
      paid: 0,
      payment_amount: 0,
      created_at: new Date().toISOString(),
    };
    STATE.bookings.unshift(booking);
    return { bookingId: booking.id };
  }
  if (path.startsWith('/bookings/') && method === 'PUT') {
    const bookingId = path.split('/').pop();
    const booking = STATE.bookings.find(item => String(item.id) === String(bookingId));
    if (!booking) throw new Error('No se encontró esta solicitud.');
    const status = body.status;
    let payment_amount = Number(booking.payment_amount || 0);
    if (status === 'completado') {
      payment_amount = Number(booking.payment_amount || booking.total - booking.commission || 0);
      booking.status = 'completado';
      booking.paid = 1;
      booking.payment_amount = payment_amount;
      booking.paid_at = new Date().toISOString();
      return { ok: true, payment_amount, paid: true };
    }
    if (status === 'cancelado') {
      booking.status = 'cancelado';
      booking.paid = 0;
      booking.payment_amount = 0;
      booking.paid_at = '';
      return { ok: true, payment_amount: 0, paid: false };
    }
    booking.status = status;
    return { ok: true, payment_amount, paid: Boolean(booking.paid) };
  }
  if (path === '/messages' && method === 'POST') {
    const partnerId = String(body.receiverId || '').trim();
    const text = String(body.text || '').trim();
    if (!partnerId || (!text && !body.attachment)) throw new Error('Escribe un mensaje o adjunta un archivo.');
    const message = {
      id: Date.now(),
      sender_id: STATE.user.id,
      receiver_id: partnerId,
      text,
      created_at: new Date().toISOString(),
      sender_name: STATE.user.name,
      attachment: body.attachment || null,
    };
    STATE.chatMessages.push({ id: message.id, contactId: partnerId, from: 'me', text, attachment: message.attachment, time: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) });
    return { message };
  }
  if (path.startsWith('/messages/') && (method === 'PUT' || method === 'DELETE')) {
    const messageId = path.split('/').pop();
    const index = STATE.chatMessages.findIndex((message, messageIndex) => String(message.id || `${STATE.chatPartnerId}-${messageIndex}`) === messageId);
    if (index < 0 || STATE.chatMessages[index].from !== 'me') throw new Error('Solo puedes modificar tus propios mensajes.');
    if (method === 'DELETE') {
      STATE.chatMessages.splice(index, 1);
      return { ok: true };
    }
    const text = String(body.text || '').trim();
    if (!text) throw new Error('El mensaje no puede estar vacío.');
    STATE.chatMessages[index].text = text;
    return { ok: true };
  }
  if (path.startsWith('/conversations/') && method === 'DELETE') {
    STATE.chatMessages = [];
    return { ok: true };
  }
  if (path === '/messages') {
    const contactId = STATE.chatPartnerId || 'p1';
    return { messages: STATE.chatMessages.map((message, index) => ({
      id: message.id || `${contactId}-${index}`,
      sender_id: message.from === 'me' ? STATE.user.id : contactId,
      receiver_id: message.from === 'me' ? contactId : STATE.user.id,
      text: message.text,
      attachment: message.attachment || null,
      created_at: new Date().toISOString(),
    })) };
  }
  if (path.startsWith('/messages?with=')) {
    const contactId = decodeURIComponent(path.split('with=')[1] || '');
    const messages = STATE.chatMessages.map((message, index) => ({
      id: message.id || `${contactId}-${index}`,
      sender_id: message.from === 'me' ? STATE.user.id : contactId,
      receiver_id: message.from === 'me' ? contactId : STATE.user.id,
      text: message.text,
      attachment: message.attachment || null,
      created_at: new Date().toISOString(),
    }));
    return { messages };
  }
  if (path === '/reviews' && method === 'POST') {
    return { reviewId: Date.now() };
  }
  throw new Error('La operación no está disponible en modo demo.');
}

async function apiRequest(path, options = {}) {
  if (STATE.token === 'demo-token') {
    return handleDemoApiRequest(path, options);
  }

  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (STATE.token) headers.Authorization = `Bearer ${STATE.token}`;

  const urls = [];
  if (API.startsWith('http')) {
    urls.push(`${API}${path}`);
    urls.push(`http://localhost:8000/api${path}`);
    urls.push(`http://127.0.0.1:8000/api${path}`);
    urls.push(`http://localhost:4000/api${path}`);
    urls.push(`${window.location.origin}${path}`);
  } else {
    urls.push(`${API}${path}`);
  }

  let lastError = null;
  for (const url of urls) {
    try {
      const response = await fetch(url, { ...options, headers });
      const text = await response.text();
      if (!text.trim()) {
        if (!response.ok) throw new Error('El servidor no respondió con contenido válido.');
        return {};
      }

      const trimmed = text.trim();
      if (trimmed.startsWith('<')) {
        throw new Error('El backend no está disponible. Inicia python server.py y revisa el puerto 8000.');
      }

      const data = JSON.parse(trimmed);
      if (!response.ok) throw new Error(data.error || 'No se pudo completar la solicitud.');
      return data;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('No se pudo completar la solicitud.');
}

function getDemoUser(email, password) {
  const candidate = DEMO_USERS[email?.trim().toLowerCase()];
  if (!candidate || candidate.password !== password) return null;
  return candidate;
}

function getConversationContacts(contacts = [], messages = []) {
  if (!STATE.user) return [];
  const userId = String(STATE.user.id);
  const lastActivityByContact = new Map();

  for (const message of messages || []) {
    const senderId = String(message.sender_id);
    const receiverId = String(message.receiver_id);
    const counterpartId = senderId === userId ? receiverId : senderId;

    if (!counterpartId || counterpartId === 'undefined' || counterpartId === userId) continue;

    const ts = Date.parse(message.created_at || new Date().toISOString());
    const previous = lastActivityByContact.get(counterpartId) || 0;
    if (!Number.isNaN(ts) && ts > previous) {
      lastActivityByContact.set(counterpartId, ts);
    }
  }

  const conversationIds = [...lastActivityByContact.keys()].sort((a, b) => {
    return (lastActivityByContact.get(b) || 0) - (lastActivityByContact.get(a) || 0);
  });

  return conversationIds
    .map(id => (contacts || []).find(contact => String(contact.id) === String(id)))
    .filter(Boolean)
    .sort((a, b) => {
      const ta = lastActivityByContact.get(String(a.id)) || 0;
      const tb = lastActivityByContact.get(String(b.id)) || 0;
      return tb - ta;
    });
}

async function loadRemoteData() {
  const services = await apiRequest('/services');
  SERVICES = services.services;
  if (!STATE.user) return;
  const [bookings, contacts, messages] = await Promise.all([
    apiRequest('/bookings'),
    apiRequest('/contacts'),
    apiRequest('/messages'),
  ]);
  STATE.bookings = bookings.bookings;
  STATE.allContacts = contacts.contacts;
  STATE.contacts = getConversationContacts(STATE.allContacts, messages.messages);
  if (!STATE.chatPartnerId || !STATE.contacts.some(contact => String(contact.id) === String(STATE.chatPartnerId))) {
    STATE.chatPartnerId = STATE.contacts[0]?.id || null;
  }
  await loadConversation();
}

async function loadConversation() {
  if (!STATE.chatPartnerId) {
    STATE.chatMessages = [];
    return;
  }
  const messages = await apiRequest(`/messages?with=${STATE.chatPartnerId}`);
  STATE.chatMessages = messages.messages.map(message => ({
    id: message.id,
    contactId: STATE.chatPartnerId,
    from: String(message.sender_id) === String(STATE.user.id) ? 'me' : 'them',
    text: message.text,
    attachment: message.attachment || null,
    time: new Date(message.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
  }));
}

function showError(message, elementId) {
  const element = document.getElementById(elementId);
  if (!element) return;
  element.textContent = message;
  element.classList.remove('hidden');
}

// ── Auth logic ─────────────────────────────────────────────────
function switchAuthTab(tab, el) {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(b => b.classList.remove('active'));
  const selected = el || [...tabs].find(b => b.textContent.toLowerCase().includes(tab === 'login' ? 'iniciar sesión' : 'registrarse'));
  if (selected) selected.classList.add('active');
  document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
  document.getElementById('register-form').classList.toggle('hidden', tab !== 'register');
  document.getElementById('recover-form').classList.add('hidden');
}

function selectRole(r) {
  STATE.selectedRole = r;
  document.getElementById('role-cliente').classList.toggle('active', r === 'cliente');
  document.getElementById('role-prestador').classList.toggle('active', r === 'prestador');
}

function showLogin() {
  document.getElementById('landing-screen').classList.add('hidden');
  document.getElementById('auth-screen').classList.remove('hidden');
  document.getElementById('recover-form').classList.add('hidden');
  switchAuthTab('login');
  document.getElementById('login-email').focus();
}

function openRecoveryForm() {
  document.getElementById('login-form').classList.add('hidden');
  document.getElementById('recover-form').classList.remove('hidden');
  document.getElementById('recover-identifier').focus();
}

function showRecoveryMessage(message, isError = false) {
  const error = document.getElementById('recover-error');
  const success = document.getElementById('recover-success');
  error.classList.toggle('hidden', !isError);
  success.classList.toggle('hidden', isError);
  if (isError) {
    error.textContent = message;
  } else {
    success.textContent = message;
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const identifier = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-pass').value;
  const err = document.getElementById('login-error');
  err.classList.add('hidden');
  if (!identifier || !pass) { err.textContent = 'Completa todos los campos.'; err.classList.remove('hidden'); return; }

  try {
    const data = await apiRequest('/login', { method: 'POST', body: JSON.stringify({ identifier, password: pass }) });
    loginUser(data.user, data.token);
    return;
  } catch (error) {
    const fallbackUser = getDemoUser(identifier, pass);
    if (fallbackUser) {
      loginUser(fallbackUser, 'demo-token');
      return;
    }
    const message = error.message === 'Failed to fetch'
      ? 'No hay servidor activo. Inicia la app con python server.py y vuelve a intentarlo.'
      : error.message;
    showError(message, 'login-error');
  }
}

async function requestPasswordCode() {
  const identifier = document.getElementById('recover-identifier').value.trim();
  if (!identifier) {
    showRecoveryMessage('Escribe tu correo o teléfono para recibir el código.', true);
    return;
  }

  try {
    const result = await apiRequest('/password/forgot', {
      method: 'POST',
      body: JSON.stringify({ identifier })
    });
    showRecoveryMessage(result.message || 'Se envió un código de recuperación a tu correo.', false);
  } catch (error) {
    showRecoveryMessage(error.message, true);
  }
}

async function handlePasswordRecovery(e) {
  e.preventDefault();
  const identifier = document.getElementById('recover-identifier').value.trim();
  const code = document.getElementById('recover-code').value.trim();
  const newPassword = document.getElementById('recover-pass').value.trim();
  showRecoveryMessage('', false);

  if (!identifier || !code || !newPassword) {
    showRecoveryMessage('Completa correo, código y nueva contraseña.', true);
    return;
  }

  try {
    const result = await apiRequest('/password/reset', {
      method: 'POST',
      body: JSON.stringify({ identifier, code, new_password: newPassword })
    });
    showRecoveryMessage(result.message || 'Contraseña actualizada correctamente.', false);
    setTimeout(() => {
      document.getElementById('recover-form').classList.add('hidden');
      document.getElementById('login-form').classList.remove('hidden');
      document.getElementById('login-email').focus();
    }, 1000);
  } catch (error) {
    showRecoveryMessage(error.message, true);
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const pass = document.getElementById('reg-pass').value;
  const accepted = document.getElementById('accept-terms').checked;
  const err = document.getElementById('reg-error');
  err.classList.add('hidden');
  if (!name || !email || !pass) { err.textContent = 'Completa todos los campos.'; err.classList.remove('hidden'); return; }
  if (!accepted) { err.textContent = 'Debes aceptar los términos y condiciones.'; err.classList.remove('hidden'); return; }
  try {
    const data = await apiRequest('/register', { method: 'POST', body: JSON.stringify({ name, email, phone, password: pass, role: STATE.selectedRole }) });
    loginUser(data.user, data.token, true);
  } catch (error) {
    showError(error.message, 'reg-error');
  }
}

async function loginUser(user, token, completeProfile = false) {
  STATE.user = user;
  STATE.token = token;
  localStorage.setItem('servilocal_token', token);
  STATE.activeView = 'dashboard';
  document.getElementById('landing-screen').classList.add('hidden');
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  try { await loadRemoteData(); } catch (error) { console.error(error); }
  buildSidebar();
  navigate(completeProfile ? 'profile' : 'dashboard');
}

function logout() {
  STATE.user = null;
  STATE.token = null;
  localStorage.removeItem('servilocal_token');
  document.getElementById('app').classList.add('hidden');
  document.getElementById('auth-screen').classList.remove('hidden');
  document.getElementById('landing-screen').classList.add('hidden');
}

// ── Sidebar ────────────────────────────────────────────────────
const NAV_LINKS = {
  cliente: [
    { id: 'dashboard', label: 'Dashboard', icon: 'home' },
    { id: 'catalog', label: 'Catálogo', icon: 'grid' },
    { id: 'chat', label: 'Chat', icon: 'chat' },
    { id: 'history', label: 'Mis servicios', icon: 'history' },
    { id: 'profile', label: 'Mi perfil', icon: 'users' },
  ],
  prestador: [
    { id: 'dashboard', label: 'Dashboard', icon: 'home' },
    { id: 'my-services', label: 'Mis servicios', icon: 'brief' },
    { id: 'requests', label: 'Solicitudes', icon: 'bell' },
    { id: 'chat', label: 'Chat', icon: 'chat' },
    { id: 'income', label: 'Ingresos', icon: 'trend' },
    { id: 'profile', label: 'Mi perfil', icon: 'users' },
  ],
  admin: [
    { id: 'dashboard', label: 'Panel de control', icon: 'home' },
    { id: 'users', label: 'Usuarios', icon: 'users' },
    { id: 'transactions', label: 'Transacciones', icon: 'bar' },
    { id: 'services-admin', label: 'Servicios', icon: 'grid' },
    { id: 'profile', label: 'Mi perfil', icon: 'users' },
  ],
};

function buildSidebar() {
  const u = STATE.user;
  const rc = roleColor(u.role);
  document.getElementById('sidebar-user').innerHTML = `
    <div style="display:flex;align-items:center;gap:10px">
      ${avatar(u.avatar, 36, rc, u.profile_image)}
      <div class="user-info">
        <p style="font-family:'Outfit',sans-serif;font-weight:600;font-size:13px;color:#e2e8f0;margin:0;line-height:1.2">${u.name}</p>
        <span class="badge" style="background:${rc}22;color:${rc};border:1px solid ${rc}44;font-size:10px;text-transform:capitalize;padding:2px 7px">${u.role}</span>
      </div>
    </div>`;
  const nav = document.getElementById('sidebar-nav');
  nav.innerHTML = (NAV_LINKS[u.role] || []).map(l =>
    `<div class="nav-link${l.id === STATE.activeView ? ' active' : ''}" id="nav-${l.id}" onclick="navigate('${l.id}')">
      ${icon(l.icon)}<span class="nav-label">${l.label}</span>
    </div>`
  ).join('');
}

function navigate(view) {
  STATE.activeView = view;
  closeMenu();
  document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
  const el = document.getElementById(`nav-${view}`);
  if (el) el.classList.add('active');
  const TITLES = {
    dashboard: ['Dashboard', 'Resumen general'],
    catalog: ['Catálogo de servicios', 'Encuentra el profesional que necesitas'],
    chat: ['Chat', 'Comunicación en tiempo real'],
    history: ['Historial', 'Tus servicios contratados'],
    'my-services': ['Mis servicios', 'Gestiona tu catálogo'],
    requests: ['Solicitudes', 'Solicitudes de clientes'],
    income: ['Ingresos', 'Tu resumen financiero'],
    profile: ['Mi perfil', 'Actualiza tu información personal'],
    users: ['Usuarios', 'Gestión de la comunidad'],
    transactions: ['Transacciones', 'Control financiero'],
    'services-admin': ['Servicios', 'Servicios publicados'],
  };
  const [t, s] = TITLES[view] || ['Panel', ''];
  document.getElementById('topbar-title').textContent = t;
  document.getElementById('topbar-sub').textContent = s;
  renderView(view);
}

function toggleMenu() {
  const sidebar = document.querySelector('.sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  const toggle = document.getElementById('menu-toggle');
  const isOpen = sidebar.classList.toggle('open');
  backdrop.classList.toggle('visible', isOpen);
  toggle.setAttribute('aria-expanded', String(isOpen));
  toggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
}

function closeMenu() {
  const sidebar = document.querySelector('.sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  const toggle = document.getElementById('menu-toggle');
  if (!sidebar || !backdrop || !toggle) return;
  sidebar.classList.remove('open');
  backdrop.classList.remove('visible');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Abrir menú');
}

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeMenu();
});

// ── View Router ────────────────────────────────────────────────
function renderView(view) {
  const el = document.getElementById('main-content');
  const role = STATE.user.role;
  const renderers = {
    // CLIENT
    dashboard: role === 'cliente' ? renderClientDash : role === 'prestador' ? renderProviderDash : renderAdminDash,
    catalog: renderCatalog,
    chat: renderChat,
    history: renderHistory,
    profile: renderProfile,
    // PROVIDER
    'my-services': renderProviderServices,
    requests: renderRequests,
    income: renderIncome,
    // ADMIN
    users: renderAdminUsers,
    transactions: renderAdminTransactions,
    'services-admin': renderAdminServices,
  };
  const fn = renderers[view] || (role === 'admin' ? renderAdminDash : role === 'prestador' ? renderProviderDash : renderClientDash);
  el.innerHTML = `<div class="page fade-in">${fn()}</div>`;
  refreshIcons();
  afterRender(view);
}

function afterRender(view) {
  if (view === 'chat') setupChat();
  if (view === 'catalog') setupCatalog();
  if (view === 'requests') setupRequests();
}

// ── CLIENT VIEWS ───────────────────────────────────────────────
function renderClientDash() {
  const bookings = STATE.bookings.slice(0, 3);
  const totalSpent = STATE.bookings.reduce((total, booking) => total + (booking.client === STATE.user.name ? Number(booking.total) : 0), 0);
  const pending = STATE.bookings.filter(booking => booking.status === 'pendiente').length;
  const completed = STATE.bookings.filter(booking => booking.status === 'completado').length;
  return `
    <div class="dashboard-hero">
      <div><p class="section-kicker">Panel personal</p><h2>Hola, <span class="gradient-text">${STATE.user.name}</span></h2><p>Gestiona tus servicios y encuentra ayuda confiable cerca de ti.</p></div>
      <button class="btn-primary" onclick="navigate('catalog')">Explorar servicios ${icon('grid')}</button>
    </div>
    <div class="grid-4" style="margin-bottom:28px">
      ${[[String(STATE.bookings.length), 'Servicios contratados', 'Historial total', '#22d3ee'], [COP(totalSpent), 'Total gastado', 'Reservas registradas', '#818cf8'], [String(pending), 'Solicitudes pendientes', 'Por confirmar', '#fbbf24'], [String(completed), 'Servicios completados', 'Experiencia acumulada', '#4ade80']]
      .map(([v, l, s, c]) => `<div class="stat-card"><p class="mono" style="font-size:24px;font-weight:700;color:${c};margin:0 0 4px">${v}</p><p style="font-family:'Outfit',sans-serif;font-size:14px;font-weight:600;color:#e2e8f0;margin:0 0 2px">${l}</p><p style="font-size:12px;color:#64748b;margin:0">${s}</p></div>`).join('')}
    </div>
    <div class="grid-2">
      <div>
        <div class="section-heading"><div><p class="section-kicker">Actividad</p><h3>Servicios recientes</h3></div><button class="text-button" onclick="navigate('history')">Ver todo</button></div>
        <div style="display:flex;flex-direction:column;gap:10px">
          ${bookings.length ? bookings.map(b => `<div class="card card-p activity-row" style="display:flex;justify-content:space-between;align-items:center;border-radius:10px">
            <div><p style="font-family:'Outfit',sans-serif;font-weight:600;font-size:14px;margin:0 0 2px;color:#e2e8f0">${b.title}</p><p style="font-size:12px;color:#64748b;margin:0">${b.provider} · ${b.date}</p></div>
            ${statusBadge(b.status)}
          </div>`).join('') : '<div class="empty-state"><strong>Aún no tienes reservas</strong><span>Explora el catálogo para encontrar tu próximo servicio.</span><button class="btn-outline btn-sm" onclick="navigate(\'catalog\')">Ver catálogo</button></div>'}
        </div>
      </div>
      <div>
        <div class="section-heading"><div><p class="section-kicker">Accesos</p><h3>Acciones rápidas</h3></div></div>
        <div style="display:flex;flex-direction:column;gap:10px">
          ${[['🔍', 'Explorar catálogo de servicios', 'catalog'], ['💬', 'Continuar conversación', 'chat'], ['📋', 'Ver mi historial completo', 'history']]
      .map(([e, l, v]) => `<button onclick="navigate('${v}')" style="padding:14px 16px;border-radius:10px;border:1px solid rgba(34,211,238,0.12);background:rgba(17,27,84,0.4);display:flex;align-items:center;gap:12px;cursor:pointer;text-align:left;color:#e2e8f0;width:100%;transition:all 0.2s" onmouseover="this.style.borderColor='rgba(34,211,238,0.3)'" onmouseout="this.style.borderColor='rgba(34,211,238,0.12)'">
              <span style="font-size:20px">${e}</span><span style="font-family:'Outfit',sans-serif;font-weight:500;font-size:14px">${l}</span>
            </button>`).join('')}
        </div>
      </div>
    </div>`;
}

function renderCatalog() {
  const q = STATE.searchQuery || '';
  const cat = STATE.categoryFilter || 'Todos';
  const filtered = SERVICES.filter(s =>
    (cat === 'Todos' || s.category === cat) &&
    (s.title.toLowerCase().includes(q.toLowerCase()) || s.category.toLowerCase().includes(q.toLowerCase()))
  );
  return `
    <div style="margin-bottom:20px">
      <div style="position:relative;margin-bottom:14px">
        <span class="search-icon">${smallIcon('search')}</span>
        <input class="input input-search" id="catalog-search" placeholder="Buscar servicios, categorías..." value="${q}" oninput="onSearchInput(this.value)" />
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${CATEGORIES.map(c => `<button class="pill-filter${c === cat ? ' active' : ''}" onclick="filterCat('${c}')">${c}</button>`).join('')}
      </div>
    </div>
    <div class="grid-cards">
      ${filtered.map(s => `
        <div class="service-card" onclick="openServiceDetail('${s.id}')">
          <div style="height:160px;overflow:hidden;position:relative;background:#111b54">
            <img src="https://images.unsplash.com/${s.img}?w=400&h=200&fit=crop&auto=format" alt="${s.title}" style="width:100%;height:100%;object-fit:cover;opacity:0.85" loading="lazy" />
            ${!s.available ? '<div style="position:absolute;inset:0;background:rgba(10,15,46,0.7);display:flex;align-items:center;justify-content:center">' + badge('No disponible', 'red') + '</div>' : ''}
            <div class="service-profession" title="Profesión o categoría">${s.category}</div>
      <div style="position:absolute;top:10px;left:10px">${badge(s.available ? 'Disponible' : 'No disponible', s.available ? 'green' : 'red')}</div>
          </div>
          <div style="padding:16px">
            <h3 style="font-family:'Outfit',sans-serif;font-size:15px;font-weight:700;margin:0 0 4px;color:#f1f5f9">${s.title}</h3>
            <p style="font-size:12px;color:#64748b;margin:0 0 10px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${s.desc}</p>
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:10px">
              ${avatar(s.avatar, 24)}
              <button class="text-button" onclick="event.stopPropagation();openPublicProfile('${s.ownerId || ''}', '${s.provider}')">${s.provider}</button>
              <div style="display:flex;align-items:center;gap:4px;margin-left:auto">${stars(s.rating)}<span style="font-size:11px;color:#64748b">(${s.reviews})</span></div>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between">
              <div><span class="mono" style="font-size:16px;font-weight:700;color:#22d3ee">${COP(s.price)}</span><span style="font-size:11px;color:#64748b"> ${s.unit}</span></div>
              <button type="button" class="btn-primary btn-sm" ${s.available ? '' : 'disabled'} onclick="event.stopPropagation();requestService(${s.id})">${s.available ? 'Solicitar' : 'No disponible'}</button>
            </div>
          </div>
        </div>`).join('')}
    </div>`;
}

function setupCatalog() {
  STATE.searchQuery = STATE.searchQuery || '';
  STATE.categoryFilter = STATE.categoryFilter || 'Todos';
}

function onSearchInput(v) {
  STATE.searchQuery = v;
  const el = document.getElementById('main-content');
  const cat = STATE.categoryFilter || 'Todos';
  const q = v.toLowerCase();
  const filtered = SERVICES.filter(s =>
    (cat === 'Todos' || s.category === cat) && (s.title.toLowerCase().includes(q) || s.category.toLowerCase().includes(q))
  );
  const grid = el.querySelector('.grid-cards');
  if (grid) grid.innerHTML = filtered.map(s => serviceCardHtml(s)).join('');
}

function serviceCardHtml(s) {
  return `<div class="service-card" onclick="openServiceDetail('${s.id}')">
    <div style="height:160px;overflow:hidden;position:relative;background:#111b54">
      <img src="https://images.unsplash.com/${s.img}?w=400&h=200&fit=crop&auto=format" alt="${s.title}" style="width:100%;height:100%;object-fit:cover;opacity:0.85" loading="lazy"/>
      ${!s.available ? '<div style="position:absolute;inset:0;background:rgba(10,15,46,0.7);display:flex;align-items:center;justify-content:center">' + badge('No disponible', 'red') + '</div>' : ''}
      <div class="service-profession" title="Profesión o categoría">${s.category}</div>
    <div style="position:absolute;top:10px;left:10px">${badge(s.available ? 'Disponible' : 'No disponible', s.available ? 'green' : 'red')}</div>
    </div>
    <div style="padding:16px">
      <h3 style="font-family:'Outfit',sans-serif;font-size:15px;font-weight:700;margin:0 0 4px;color:#f1f5f9">${s.title}</h3>
      <p style="font-size:12px;color:#64748b;margin:0 0 10px;line-height:1.5">${s.desc}</p>
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:10px">
        ${avatar(s.avatar, 24)}<button class="text-button" onclick="event.stopPropagation();openPublicProfile('${s.ownerId || ''}', '${s.provider}')">${s.provider}</button>
        <div style="display:flex;align-items:center;gap:4px;margin-left:auto">${stars(s.rating)}<span style="font-size:11px;color:#64748b">(${s.reviews})</span></div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div><span class="mono" style="font-size:16px;font-weight:700;color:#22d3ee">${COP(s.price)}</span><span style="font-size:11px;color:#64748b"> ${s.unit}</span></div>
        <button type="button" class="btn-primary btn-sm" ${s.available ? '' : 'disabled'} onclick="event.stopPropagation();requestService('${s.id}')">${s.available ? 'Solicitar' : 'No disponible'}</button>
      </div>
    </div>
  </div>`;
}

function filterCat(cat) {
  STATE.categoryFilter = cat;
  navigate('catalog');
}

function requestService(serviceId) {
  const service = findServiceById(serviceId);
  if (!service) {
    alert('No se pudo encontrar este servicio. Actualiza el catálogo e inténtalo de nuevo.');
    return;
  }
  if (!service.available) return;
  openBooking(service.id);
}

function openReview(bookingId, title) {
  document.getElementById('modal-review-box').innerHTML = `
    <div class="modal-body">
      <div class="modal-header"><div><p class="section-kicker">Tu experiencia</p><h2 style="font-size:20px;margin-top:5px">Califica este servicio</h2></div><button class="btn-outline btn-sm" onclick="closeModal('modal-review')">${icon('x')}</button></div>
      <p style="color:#94a3b8;font-size:13px;margin-bottom:18px">${title}</p>
      <div class="rating-picker" id="review-rating">${[1, 2, 3, 4, 5].map(value => `<button type="button" aria-label="${value} estrellas" onclick="selectReviewRating(${value})">★</button>`).join('')}</div>
      <input type="hidden" id="review-rating-value" value="0" />
      <div class="form-group"><label class="form-label">Comentario (opcional)</label><textarea class="input" id="review-comment" rows="4" placeholder="¿Cómo fue tu experiencia?"></textarea></div>
      <p id="review-error" class="hidden" style="color:#f87171;font-size:13px;margin-bottom:12px"></p>
      <button class="btn-primary btn-full" onclick="submitReview(${bookingId})">Publicar reseña</button>
    </div>`;
  openModal('modal-review');
}

function selectReviewRating(rating) {
  document.getElementById('review-rating-value').value = rating;
  document.querySelectorAll('#review-rating button').forEach((button, index) => button.classList.toggle('selected', index < rating));
}

async function submitReview(bookingId) {
  const rating = Number(document.getElementById('review-rating-value').value);
  const comment = document.getElementById('review-comment').value.trim();
  if (!rating) return showError('Selecciona una calificación.', 'review-error');
  try {
    await apiRequest('/reviews', { method: 'POST', body: JSON.stringify({ bookingId, rating, comment }) });
    closeModal('modal-review');
    await loadRemoteData();
    navigate('history');
  } catch (error) {
    showError(error.message, 'review-error');
  }
}

function renderHistory() {
  return `
    <h2 style="font-family:'Outfit',sans-serif;font-size:20px;font-weight:700;margin-bottom:20px">Historial de servicios</h2>
    <div class="overflow-x">
      <table class="data-table">
        <thead><tr><th>Servicio</th><th>Prestador</th><th>Fecha</th><th>Total</th><th>Estado</th></tr></thead>
        <tbody>
          ${STATE.bookings.map(b => `<tr>
            <td style="font-family:'Outfit',sans-serif;font-weight:500">${b.title}</td>
            <td style="color:#94a3b8">${b.provider}</td>
            <td class="mono" style="font-size:12px;color:#64748b">${b.date}</td>
            <td class="mono" style="color:#22d3ee">${COP(b.total)}</td>
            <td>${statusBadge(b.status)} ${b.status === 'confirmado' ? `<button class="btn-primary btn-sm" onclick="changeBookingStatus('${b.id}','completado')">Aceptar servicio</button>` : ''} ${b.status === 'completado' ? `<button class="btn-outline btn-sm" onclick="openReview('${b.id}','${b.title.replace(/'/g, "\\'")}')">Calificar</button>` : ''} ${b.status === 'pendiente' || b.status === 'confirmado' ? `<button class="btn-danger" onclick="changeBookingStatus('${b.id}','cancelado')">Cancelar</button>` : ''}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

// ── CHAT ────────────────────────────────────────────────────────
function renderChat() {
  const partner = findUserById(STATE.chatPartnerId);
  return `
    <div class="chat-shell">
      <div class="chat-contacts">
        <div class="chat-contact-search"><div class="form-row"><span class="search-icon">${smallIcon('search')}</span><input class="input input-search" id="chat-contact-search" aria-label="Buscar persona" placeholder="Buscar persona..." oninput="filterChatContacts(this.value)" /></div></div>
        <h3 style="font-family:'Outfit',sans-serif;font-size:16px;margin:0;padding:16px 16px 8px">Conversaciones</h3>
        <div id="chat-contact-list" class="chat-contact-list">
          ${STATE.contacts.map(contact => `<div class="chat-contact-row" style="display:flex;align-items:center;gap:8px"><button class="chat-contact" onclick="selectChatContact('${contact.id}')" style="display:flex;align-items:center;gap:10px;flex:1;padding:10px;border:1px solid ${String(contact.id) === String(STATE.chatPartnerId) ? 'rgba(34,211,238,0.5)' : 'rgba(34,211,238,0.1)'};border-radius:8px;background:${String(contact.id) === String(STATE.chatPartnerId) ? 'rgba(34,211,238,0.12)' : 'transparent'};color:#e2e8f0;text-align:left;cursor:pointer">${avatar(contact.avatar, 30, roleColor(contact.role))}<span><strong style="display:block;font-size:13px">${contact.name}</strong><small style="color:#64748b">${contact.role}</small></span></button><button class="btn-outline btn-sm" title="Ver ficha" onclick="openPublicProfile('${contact.id}')">Ver</button></div>`).join('') || '<p style="color:#64748b;font-size:13px">No hay otros usuarios registrados.</p>'}
        </div>
      </div>
      <div class="chat-main">
      <div class="chat-header">
        ${avatar(partner?.avatar || '??', 40, partner ? roleColor(partner.role) : '#64748b')}
        <div><p style="font-family:'Outfit',sans-serif;font-weight:600;font-size:15px;margin:0">${partner?.name || 'Selecciona un contacto'}</p><span style="font-size:12px;color:#64748b">${partner?.role || 'Para iniciar una conversación'}</span></div>
      </div>
      ${partner ? `<div class="chat-header-actions"><button class="btn-outline btn-sm" title="Ver ficha" onclick="openPublicProfile('${partner.id}')">Ficha</button><button class="btn-outline btn-sm" title="Cerrar chat" onclick="closeChat()">Cerrar chat</button><button class="btn-danger btn-sm" title="Eliminar chat" onclick="deleteConversation()">Eliminar chat</button></div>` : ''}
      <div class="chat-area" id="chat-messages">
        ${STATE.chatMessages.map(m => chatBubble(m)).join('')}
      </div>
      <p id="chat-error" class="hidden" style="color:#f87171;font-size:12px;margin:10px 0 0"></p>
      ${renderChatAttachmentPreview()}
      <div class="chat-composer">
        <input type="file" id="chat-attachment-input" hidden accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" onchange="handleChatAttachment(this)" />
        <button type="button" class="btn-outline btn-sm" title="Adjuntar archivo" aria-label="Adjuntar archivo" onclick="document.getElementById('chat-attachment-input').click()" ${partner ? '' : 'disabled'}>${icon('paperclip')}</button>
        <input class="input flex-1" id="chat-input" ${partner ? '' : 'disabled'} placeholder="${partner ? 'Escribe un mensaje...' : 'Selecciona un contacto'}" onkeydown="if(event.key==='Enter')sendMsg()" style="border-radius:12px;padding:12px 16px" />
        <button class="btn-primary" onclick="sendMsg()" aria-label="Enviar mensaje" style="padding:12px 16px;border-radius:12px;display:flex;align-items:center;gap:8px">${icon('send')}</button>
      </div>
      </div>
    </div>`;
}

function chatBubble(m) {
  const isMe = m.from === 'me';
  return `<div class="${isMe ? 'bubble-me' : 'bubble-them'}">
    ${m.attachment ? chatAttachmentHtml(m.attachment) : ''}
    ${m.text ? `<p style="margin:0;line-height:1.5">${m.text}</p>` : ''}
    <div class="chat-message-footer"><p class="msg-time" style="text-align:${isMe ? 'right' : 'left'}">${m.time}</p>${isMe ? `<span class="chat-message-actions"><button type="button" onclick="editMessage('${m.id}')">Editar</button><button type="button" onclick="deleteMessage('${m.id}')">Eliminar</button></span>` : ''}</div>
  </div>`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function chatAttachmentHtml(attachment) {
  const name = escapeHtml(attachment.name || 'Archivo adjunto');
  if (attachment.type?.startsWith('image/') && attachment.dataUrl) {
    return `<a class="chat-image-link" href="${attachment.dataUrl}" target="_blank" rel="noopener"><img class="chat-image" src="${attachment.dataUrl}" alt="${name}" /></a>`;
  }
  return `<a class="chat-file" href="${attachment.dataUrl || '#'}" download="${name}">${icon('file')}<span>${name}</span></a>`;
}

function renderChatAttachmentPreview() {
  if (!STATE.chatAttachment) return '';
  return `<div class="chat-attachment-preview" id="chat-attachment-preview">${chatAttachmentHtml(STATE.chatAttachment)}<button type="button" class="btn-outline btn-sm" onclick="clearChatAttachment()" aria-label="Quitar archivo">${icon('x')}</button></div>`;
}

function clearChatAttachment() {
  STATE.chatAttachment = null;
  const input = document.getElementById('chat-attachment-input');
  if (input) input.value = '';
  const preview = document.getElementById('chat-attachment-preview');
  if (preview) preview.remove();
}

function handleChatAttachment(input) {
  const file = input.files?.[0];
  if (!file) return;
  if (file.size > 1024 * 1024) {
    input.value = '';
    showError('El archivo no puede superar 1 MB.', 'chat-error');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    STATE.chatAttachment = { name: file.name, type: file.type || 'application/octet-stream', size: file.size, dataUrl: String(reader.result || '') };
    const composer = document.querySelector('.chat-composer');
    if (composer && !document.getElementById('chat-attachment-preview')) {
      composer.insertAdjacentHTML('beforebegin', renderChatAttachmentPreview());
      refreshIcons();
    }
  };
  reader.onerror = () => showError('No se pudo leer el archivo.', 'chat-error');
  reader.readAsDataURL(file);
}

function filterChatContacts(query = '') {
  const term = query.trim().toLowerCase();
  document.querySelectorAll('#chat-contact-list .chat-contact-row').forEach(row => {
    row.hidden = term && !row.textContent.toLowerCase().includes(term);
  });
}

function setupChat() {
  const el = document.getElementById('chat-messages');
  if (el) el.scrollTop = el.scrollHeight;
  if (STATE.chatTimer) clearInterval(STATE.chatTimer);
  STATE.chatTimer = setInterval(async () => {
    if (!STATE.user || STATE.activeView !== 'chat') return;
    try {
      const previousCount = STATE.chatMessages.length;
      await loadConversation();
      if (STATE.chatMessages.length !== previousCount) {
        const messages = document.getElementById('chat-messages');
        if (messages) {
          messages.innerHTML = STATE.chatMessages.map(m => chatBubble(m)).join('');
          messages.scrollTop = messages.scrollHeight;
        }
      }
    } catch (error) {
      console.error(error);
    }
  }, 3000);
}

async function sendMsg() {
  const inp = document.getElementById('chat-input');
  const text = inp?.value.trim() || '';
  if (!text && !STATE.chatAttachment) return;
  try {
    await apiRequest('/messages', { method: 'POST', body: JSON.stringify({ receiverId: STATE.chatPartnerId, text, attachment: STATE.chatAttachment }) });
    addActiveChatContact();
    if (inp) inp.value = '';
    STATE.chatAttachment = null;
    const attachmentInput = document.getElementById('chat-attachment-input');
    if (attachmentInput) attachmentInput.value = '';
    await loadConversation();
    const preview = document.getElementById('chat-attachment-preview');
    if (preview) preview.remove();
    navigate('chat');
  } catch (error) {
    showError(error.message, 'chat-error');
  }
}

function addActiveChatContact() {
  const contact = findUserById(STATE.chatPartnerId);
  if (contact && !STATE.contacts.some(item => String(item.id) === String(contact.id))) {
    STATE.contacts.push(contact);
  }
}

async function editMessage(messageId) {
  const message = STATE.chatMessages.find(item => String(item.id) === String(messageId));
  if (!message || message.from !== 'me') return;
  const text = prompt('Editar mensaje', message.text)?.trim();
  if (!text || text === message.text) return;
  try {
    await apiRequest(`/messages/${encodeURIComponent(messageId)}`, { method: 'PUT', body: JSON.stringify({ text }) });
    await loadConversation();
    renderChatMessages();
  } catch (error) {
    showError(error.message, 'chat-error');
  }
}

async function deleteMessage(messageId) {
  if (!confirm('¿Eliminar este mensaje?')) return;
  try {
    await apiRequest(`/messages/${encodeURIComponent(messageId)}`, { method: 'DELETE' });
    await loadConversation();
    renderChatMessages();
  } catch (error) {
    showError(error.message, 'chat-error');
  }
}

async function deleteConversation() {
  if (!STATE.chatPartnerId || !confirm('¿Eliminar toda esta conversación?')) return;
  try {
    await apiRequest(`/conversations/${encodeURIComponent(STATE.chatPartnerId)}`, { method: 'DELETE' });
    STATE.contacts = STATE.contacts.filter(contact => String(contact.id) !== String(STATE.chatPartnerId));
    STATE.chatPartnerId = STATE.contacts[0]?.id || null;
    await loadConversation();
    navigate('chat');
  } catch (error) {
    showError(error.message, 'chat-error');
  }
}

function closeChat() {
  STATE.chatPartnerId = null;
  STATE.chatMessages = [];
  STATE.chatAttachment = null;
  navigate('chat');
}

function renderChatMessages() {
  const element = document.getElementById('chat-messages');
  if (!element) return;
  element.innerHTML = STATE.chatMessages.map(message => chatBubble(message)).join('');
  element.scrollTop = element.scrollHeight;
}

async function selectChatContact(contactId) {
  STATE.chatPartnerId = contactId;
  await loadConversation();
  navigate('chat');
}

function openPublicProfile(userId, userName = '') {
  const user = findUserById(userId) || findUserByName(userName);
  if (!user) return;
  document.getElementById('modal-profile-box').innerHTML = `
    <div class="public-profile">
      <div class="public-profile-cover"></div>
      <div class="public-profile-body">
        <div class="public-profile-heading">${avatar(user.avatar, 76, roleColor(user.role), user.profile_image)}<div><h2>${user.name}</h2><p>${user.role} · ${user.location || 'Quibdó'}</p></div><button class="btn-outline btn-sm" onclick="closeModal('modal-profile')">${icon('x')}</button></div>
        <p class="public-profile-bio">${user.bio || 'Este usuario aún no ha añadido una presentación.'}</p>
        <div class="public-profile-details"><div><span>Especialidad</span><strong>${user.specialty || 'No especificada'}</strong></div><div><span>Disponibilidad</span><strong>${user.availability || 'Disponible para solicitudes'}</strong></div><div><span>Contacto</span><strong>${user.phone || 'Disponible por chat'}</strong></div><div><span>Correo</span><strong>${user.email}</strong></div></div>
        <div style="display:flex;gap:10px;margin-top:22px"><button class="btn-primary flex-1" onclick="closeModal('modal-profile');selectChatContact('${user.id}')">Enviar mensaje</button><button class="btn-outline flex-1" onclick="closeModal('modal-profile')">Cerrar</button></div>
      </div>
    </div>`;
  openModal('modal-profile');
}

// ── SERVICE DETAIL MODAL ────────────────────────────────────────
function openServiceDetail(id) {
  const s = findServiceById(id);
  if (!s) return;
  const box = document.getElementById('modal-service-box');
  box.innerHTML = `
    <div style="height:200px;overflow:hidden;position:relative;border-radius:16px 16px 0 0;background:#111b54">
      <img src="https://images.unsplash.com/${s.img}?w=560&h=220&fit=crop&auto=format" alt="${s.title}" style="width:100%;height:100%;object-fit:cover;opacity:0.85" />
      <button onclick="closeModal('modal-service')" style="position:absolute;top:14px;right:14px;background:rgba(10,15,46,0.8);border:1px solid rgba(34,211,238,0.2);color:#e2e8f0;border-radius:8px;padding:6px 8px;cursor:pointer;display:flex">${icon('x')}</button>
      <div style="position:absolute;bottom:14px;left:14px">${badge(s.category)}</div>
    </div>
    <div style="padding:24px">
      <h2 style="font-size:22px;font-weight:700;margin:0 0 8px">${s.title}</h2>
      <p style="font-size:14px;color:#94a3b8;line-height:1.7;margin-bottom:16px">${s.desc}</p>
      <div style="display:flex;gap:16px;margin-bottom:20px;flex-wrap:wrap;align-items:center">
        <div style="display:flex;align-items:center;gap:8px">${avatar(s.avatar, 32)}<div><p style="font-family:'Outfit',sans-serif;font-weight:600;font-size:13px;margin:0">${s.provider}</p><div style="display:flex;align-items:center;gap:4px">${stars(s.rating)}<span style="font-size:11px;color:#64748b">${s.rating} (${s.reviews} reseñas)</span></div></div><button class="btn-outline btn-sm" onclick="openPublicProfile('${s.ownerId}')">Ver ficha</button></div>
        <div style="display:flex;align-items:center;gap:5px;color:#64748b;font-size:13px">${smallIcon('location')} ${s.location}</div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div><span class="mono" style="font-size:22px;font-weight:700;color:#22d3ee">${COP(s.price)}</span><span style="color:#64748b;font-size:13px"> ${s.unit}</span></div>
        <button class="btn-primary" style="padding:11px 24px;font-size:15px" ${s.available ? '' : 'disabled'} onclick="${s.available ? `closeModal('modal-service');requestService('${s.id}')` : ''}">
          ${s.available ? 'Solicitar servicio' : 'No disponible'}
        </button>
      </div>
    </div>`;
  openModal('modal-service');
}

// ── BOOKING MODAL ───────────────────────────────────────────────
function openBooking(id) {
  STATE.currentService = findServiceById(id);
  if (!STATE.currentService) {
    alert('No se pudo cargar el servicio. Actualiza el catálogo e inténtalo de nuevo.');
    return;
  }
  STATE.bookingStep = 'form';
  STATE.bookingDate = '';
  STATE.bookingNote = '';
  STATE.bookingPayMethod = 'nequi';
  STATE.contractAccepted = false;
  renderBookingStep();
  openModal('modal-booking');
}

function renderBookingStep() {
  const s = STATE.currentService;
  const step = STATE.bookingStep;
  const commission = Math.round(s.price * 0.1);
  const steps = ['form', 'contract', 'pay'];
  const stepIdx = steps.indexOf(step);
  const stepBar = steps.map((x, i) => `<div class="step-segment${i <= stepIdx ? ' done' : ''}"></div>`).join('');

  let body = '';
  if (step === 'form') {
    body = `
      <div style="background:rgba(17,27,84,0.5);border-radius:10px;padding:14px 16px;margin-bottom:16px;border:1px solid rgba(34,211,238,0.1)">
        <p style="font-family:'Outfit',sans-serif;font-weight:700;font-size:15px;margin:0 0 2px">${s.title}</p>
        <p style="font-size:13px;color:#64748b;margin:0 0 6px">Con ${s.provider}</p>
        <span class="mono" style="color:#22d3ee;font-weight:700">${COP(s.price)}</span>
      </div>
      <div class="form-group"><label class="form-label">Fecha preferida</label><input class="input" type="date" id="book-date" value="${STATE.bookingDate}" onchange="STATE.bookingDate=this.value" /></div>
      <div class="form-group"><label class="form-label">Nota para el prestador (opcional)</label><textarea class="input" rows="3" id="book-note" placeholder="Describe lo que necesitas..." onchange="STATE.bookingNote=this.value">${STATE.bookingNote}</textarea></div>
      <button class="btn-primary btn-full" style="padding:12px;font-size:15px" onclick="if(document.getElementById('book-date').value){STATE.bookingDate=document.getElementById('book-date').value;STATE.bookingStep='contract';renderBookingStep()}">Continuar</button>`;
  } else if (step === 'contract') {
    body = `
      <div style="background:rgba(17,27,84,0.5);border-radius:10px;padding:16px;margin-bottom:16px;border:1px solid rgba(34,211,238,0.15);max-height:240px;overflow-y:auto">
        ${[
        ['Cláusula 1 – Aceptación', 'Al confirmar, el Cliente y el Prestador aceptan formalmente los términos del servicio a través de la plataforma Servi Choquib.'],
        ['Cláusula 2 – Cancelación (40 min)', 'El servicio podrá cancelarse sin penalización en los 40 minutos siguientes a su confirmación.'],
        ['Cláusula 3 – Pagos y Comisión', 'Todo pago debe realizarse dentro de la app. La plataforma retiene automáticamente el 10% de comisión. Prohibido el pago externo.'],
      ].map(([c, t]) => `<div style="margin-bottom:14px"><p style="font-family:'Outfit',sans-serif;font-weight:600;font-size:13px;color:#22d3ee;margin:0 0 4px">${c}</p><p style="font-size:12px;color:#94a3b8;line-height:1.6;margin:0">${t}</p></div>`).join('')}
      </div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
        <input type="checkbox" id="contract-check" style="accent-color:#22d3ee;width:16px;height:16px" ${STATE.contractAccepted ? 'checked' : ''} onchange="STATE.contractAccepted=this.checked" />
        <label for="contract-check" style="font-size:13px;color:#94a3b8">Acepto los términos del contrato digital</label>
      </div>
      <div style="display:flex;gap:10px">
        <button class="btn-outline flex-1" style="padding:11px" onclick="STATE.bookingStep='form';renderBookingStep()">Atrás</button>
        <button class="btn-primary flex-1" style="padding:11px" onclick="if(STATE.contractAccepted){STATE.bookingStep='pay';renderBookingStep()}">Continuar al pago</button>
      </div>`;
  } else if (step === 'pay') {
    const methods = [['nequi', '📱 Nequi'], ['card', '💳 Tarjeta débito/crédito'], ['bancolombia', '🏦 Bancolombia']];
    body = `
      <div style="background:rgba(17,27,84,0.5);border-radius:10px;padding:16px;margin-bottom:16px;border:1px solid rgba(34,211,238,0.1)">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span style="font-size:13px;color:#94a3b8">Servicio</span><span class="mono" style="font-size:13px">${COP(s.price)}</span></div>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span style="font-size:13px;color:#94a3b8">Comisión plataforma (10%)</span><span class="mono" style="font-size:13px;color:#f59e0b">${COP(commission)}</span></div>
        <div class="divider"></div>
        <div style="display:flex;justify-content:space-between"><span style="font-family:'Outfit',sans-serif;font-weight:700">Total</span><span class="mono" style="font-weight:700;color:#22d3ee;font-size:16px">${COP(s.price)}</span></div>
      </div>
      <p style="font-family:'Outfit',sans-serif;font-weight:600;font-size:13px;color:#94a3b8;margin-bottom:10px">Método de pago (Sandbox)</p>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">
        ${methods.map(([m, l]) => `<button id="pay-btn-${m}" onclick="selectPayMethod('${m}')" style="padding:12px 16px;border-radius:10px;border:2px solid ${STATE.bookingPayMethod === m ? '#22d3ee' : 'rgba(34,211,238,0.15)'};background:${STATE.bookingPayMethod === m ? 'rgba(34,211,238,0.08)' : 'transparent'};color:${STATE.bookingPayMethod === m ? '#22d3ee' : '#94a3b8'};font-family:'Outfit',sans-serif;font-size:14px;font-weight:500;cursor:pointer;text-align:left;transition:all 0.15s">${l}</button>`).join('')}
      </div>
      <div class="warn-box" style="margin-bottom:16px">⚠️ Modo Sandbox (Wompi/PayU) — No se realizarán cobros reales.</div>
      <div style="display:flex;gap:10px">
        <button class="btn-outline flex-1" style="padding:11px" onclick="STATE.bookingStep='contract';renderBookingStep()">Atrás</button>
        <button class="btn-primary flex-1" style="padding:11px;font-size:14px" onclick="completeBooking()">Pagar ${COP(s.price)}</button>
      </div>`;
  } else if (step === 'success') {
    document.getElementById('modal-booking-box').innerHTML = `
      <div style="padding:40px;text-align:center">
        <div style="width:64px;height:64px;border-radius:50%;background:rgba(34,197,94,0.15);border:2px solid #4ade80;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;color:#4ade80">${icon('check')}</div>
        <h2 style="font-family:'Outfit',sans-serif;font-size:22px;font-weight:700;margin:0 0 8px">¡Servicio contratado!</h2>
        <p style="color:#94a3b8;margin-bottom:8px">Tu solicitud para <strong style="color:#22d3ee">${s.title}</strong> fue enviada con éxito.</p>
        <p style="font-size:12px;color:#64748b;margin-bottom:24px">Recuerda: tienes 40 minutos para cancelar sin penalización.</p>
        <div style="background:rgba(17,27,84,0.6);border-radius:10px;padding:12px 20px;margin-bottom:24px;border:1px solid rgba(34,211,238,0.15)">
          <p class="mono" style="font-size:13px;color:#94a3b8;margin:0 0 4px">Total pagado (sandbox)</p>
          <p class="mono" style="font-size:20px;color:#22d3ee;margin:0 0 2px">${COP(s.price)}</p>
          <p style="font-size:11px;color:#64748b;margin:0">Comisión plataforma: ${COP(commission)} (10%)</p>
        </div>
        <button class="btn-primary" style="padding:11px 32px" onclick="closeModal('modal-booking')">Ir al dashboard</button>
      </div>`;
    return;
  }

  document.getElementById('modal-booking-box').innerHTML = `
    <div style="padding:28px">
      <div class="modal-header">
        <h2 style="font-size:18px;font-weight:700;margin:0">${step === 'form' ? 'Solicitar servicio' : step === 'contract' ? 'Contrato digital' : 'Pago seguro'}</h2>
        <button class="btn-outline btn-sm" onclick="closeModal('modal-booking')">${icon('x')}</button>
      </div>
      <div class="step-bar">${stepBar}</div>
      ${body}
    </div>`;
}

function selectPayMethod(m) {
  STATE.bookingPayMethod = m;
  document.querySelectorAll('[id^="pay-btn-"]').forEach(el => {
    const isActive = el.id === `pay-btn-${m}`;
    el.style.borderColor = isActive ? '#22d3ee' : 'rgba(34,211,238,0.15)';
    el.style.background = isActive ? 'rgba(34,211,238,0.08)' : 'transparent';
    el.style.color = isActive ? '#22d3ee' : '#94a3b8';
  });
}

async function completeBooking() {
  try {
    await apiRequest('/bookings', { method: 'POST', body: JSON.stringify({ serviceId: STATE.currentService.id, date: STATE.bookingDate, note: STATE.bookingNote }) });
    STATE.bookingStep = 'success';
    await loadRemoteData();
    renderBookingStep();
  } catch (error) {
    alert(error.message);
  }
}

// ── PROVIDER VIEWS ──────────────────────────────────────────────
function renderProviderDash() {
  return `
    <h2 style="font-size:28px;font-weight:700;margin:0 0 4px">Panel de <span class="gradient-text">Prestador</span></h2>
    <p style="color:#64748b;margin:0 0 24px">Bienvenido, ${STATE.user.name}. Gestiona tus servicios aquí.</p>
    <div class="grid-4" style="margin-bottom:28px">
      ${[['3', 'Servicios activos', '#22d3ee'], ['7', 'Solicitudes hoy', '#818cf8'], ['$680k COP', 'Ingresos este mes', '#4ade80'], ['4.7 ★', 'Calificación', '#f59e0b']]
      .map(([v, l, c]) => `<div class="stat-card"><p class="mono" style="font-size:22px;font-weight:700;color:${c};margin:0 0 4px">${v}</p><p style="font-family:'Outfit',sans-serif;font-size:13px;font-weight:600;color:#94a3b8;margin:0">${l}</p></div>`).join('')}
    </div>
    <h3 style="font-family:'Outfit',sans-serif;font-size:16px;font-weight:600;margin-bottom:14px;color:#94a3b8">Mis servicios publicados</h3>
    <div style="display:flex;flex-direction:column;gap:10px">
      ${SERVICES.slice(0, 3).map(s => `
        <div class="card" style="padding:16px;border-radius:12px;display:flex;align-items:center;gap:16px">
          <img src="https://images.unsplash.com/${s.img}?w=80&h=80&fit=crop&auto=format" alt="${s.title}" style="width:60px;height:60px;border-radius:10px;object-fit:cover" loading="lazy" />
          <div style="flex:1"><p style="font-family:'Outfit',sans-serif;font-weight:600;margin:0 0 2px">${s.title}</p><p style="font-size:12px;color:#64748b;margin:0">${s.category} · ${COP(s.price)} ${s.unit}</p></div>
          <div style="display:flex;gap:8px;align-items:center">${stars(s.rating)}<span style="font-size:12px;color:#64748b">${s.rating}</span>${badge(s.available ? 'Activo' : 'Inactivo', s.available ? 'green' : 'red')}</div>
        </div>`).join('')}
    </div>`;
}

function renderProviderServices() {
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <h2 style="font-family:'Outfit',sans-serif;font-size:20px;font-weight:700;margin:0">Gestión de servicios</h2>
      <button class="btn-primary" style="padding:9px 18px;font-size:14px;display:flex;align-items:center;gap:8px" onclick="openModal('modal-new-service')">${icon('plus')} Publicar servicio</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:12px">
      ${SERVICES.slice(0, 5).map(s => `
        <div class="card" style="padding:16px;border-radius:12px;display:flex;gap:16px;align-items:center">
          <img src="https://images.unsplash.com/${s.img}?w=80&h=80&fit=crop&auto=format" alt="${s.title}" style="width:56px;height:56px;border-radius:8px;object-fit:cover" loading="lazy" />
          <div style="flex:1"><p style="font-family:'Outfit',sans-serif;font-weight:600;margin:0 0 2px">${s.title}</p><p style="font-size:12px;color:#64748b;margin:0">${s.category} · ${COP(s.price)} ${s.unit} · ${s.reviews} reseñas</p></div>
          <div style="display:flex;gap:8px">
            <button class="btn-outline btn-sm">Editar</button>
            ${badge(s.available ? 'Activo' : 'Inactivo', s.available ? 'green' : 'red')}
          </div>
        </div>`).join('')}
    </div>`;
}

function renderRequests() {
  return `
    <h2 style="font-family:'Outfit',sans-serif;font-size:20px;font-weight:700;margin-bottom:20px">Solicitudes recibidas</h2>
    <div id="requests-list" style="display:flex;flex-direction:column;gap:12px">
      ${STATE.bookings.map(b => requestCard(b)).join('')}
    </div>`;
}

function requestCard(b) {
  const btns = b.status === 'pendiente' ? `
    <div style="display:flex;gap:10px;margin-top:14px">
      <button class="btn-primary btn-sm" style="display:flex;align-items:center;gap:6px" onclick="updateBooking('${b.id}','confirmado')">${icon('check')} Aceptar</button>
      <button class="btn-danger" style="display:flex;align-items:center;gap:6px" onclick="updateBooking('${b.id}','cancelado')">${icon('x')} Rechazar</button>
    </div>` : '';
  return `<div class="card" style="padding:20px;border-radius:12px" id="req-${b.id}">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
      <div>
        <p style="font-family:'Outfit',sans-serif;font-weight:700;font-size:15px;margin:0 0 4px">${b.title}</p>
        <p style="font-size:13px;color:#94a3b8;margin:0 0 4px">Cliente: <strong style="color:#e2e8f0">${b.client}</strong></p>
        <p class="mono" style="font-size:12px;color:#64748b;margin:0">Fecha: ${b.date}</p>
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <span class="mono" style="color:#22d3ee;font-weight:700;font-size:15px">${COP(b.total)}</span>
        ${statusBadge(b.status)}
      </div>
    </div>
    ${btns}
  </div>`;
}

function setupRequests() { }

function updateBooking(id, status) {
  changeBookingStatus(id, status);
}

async function changeBookingStatus(id, status) {
  try {
    const result = await apiRequest(`/bookings/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
    if (status === 'completado' && result.payment_amount) {
      alert(`Servicio finalizado. Se realizó el pago de ${COP(result.payment_amount)} al prestador.`);
    }
    await loadRemoteData();
    navigate(STATE.user.role === 'prestador' ? 'requests' : 'history');
  } catch (error) {
    alert(error.message);
  }
}

function renderIncome() {
  const providerBookings = STATE.bookings.filter(booking => booking.provider_id === STATE.user.id || booking.provider === STATE.user.name);
  const completedPayments = providerBookings.filter(booking => booking.status === 'completado' || booking.paid === 1 || booking.payment_amount > 0);
  const totalReceived = completedPayments.reduce((sum, booking) => sum + Number(booking.payment_amount || (booking.total - booking.commission) || 0), 0);
  const platformCommission = completedPayments.reduce((sum, booking) => sum + Number(booking.commission || 0), 0);
  const months = ['Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep'];
  const values = [Math.max(0, totalReceived * 0.6), Math.max(0, totalReceived * 0.75), Math.max(0, totalReceived * 0.5), Math.max(0, totalReceived * 0.9), Math.max(0, totalReceived * 0.88), Math.max(0, totalReceived * 1.05)];
  const max = Math.max(...values, 1);
  return `
    <h2 style="font-family:'Outfit',sans-serif;font-size:20px;font-weight:700;margin-bottom:24px">Ingresos</h2>
    <div class="grid-3" style="margin-bottom:28px">
      ${[[COP(totalReceived), 'Total pagado', '#4ade80'], [COP(platformCommission), 'Comisión plataforma', '#f59e0b'], [COP(Math.max(0, totalReceived - platformCommission)), 'Neto recibido', '#22d3ee']]
      .map(([v, l, c]) => `<div class="stat-card"><p class="mono" style="font-size:20px;font-weight:700;color:${c};margin:0 0 4px">${v}</p><p style="font-family:'Outfit',sans-serif;font-size:13px;color:#94a3b8;margin:0">${l}</p></div>`).join('')}
    </div>
    <div class="card card-p" style="border-radius:14px">
      <p style="font-family:'Outfit',sans-serif;font-weight:600;font-size:15px;margin:0 0 20px;color:#94a3b8">Ingresos últimos 6 meses</p>
      <div class="bar-chart">
        ${months.map((m, i) => `<div class="bar-col">
          <span class="mono" style="font-size:10px;color:#64748b">${Math.round(values[i] / 1000)}k</span>
          <div class="bar-rect" style="height:${Math.round((values[i] / max) * 120)}px;background:${i === months.length - 1 ? 'linear-gradient(180deg,#22d3ee,#4f46e5)' : 'rgba(34,211,238,0.22)'}"></div>
          <span style="font-family:'Outfit',sans-serif;font-size:12px;color:#64748b">${m}</span>
        </div>`).join('')}
      </div>
    </div>`;
}

// ── ADMIN VIEWS ─────────────────────────────────────────────────
function renderAdminDash() {
  const dist = [['Clientes', 174, '#818cf8'], ['Prestadores', 98, '#22d3ee'], ['Admins', 12, '#f59e0b']];
  const cats = [['Oficios', 28], ['Técnico', 18], ['Belleza', 14], ['Transporte', 13], ['Otros', 20]];
  return `
    <h2 style="font-size:28px;font-weight:700;margin:0 0 4px">Panel de <span class="gradient-text">Administrador</span></h2>
    <p style="color:#64748b;margin:0 0 24px">Supervisión global de la plataforma Servi Choquib.</p>
    <div class="grid-4" style="margin-bottom:28px">
      ${[['284', 'Usuarios totales', '+12 esta semana', '#22d3ee'], ['93', 'Servicios activos', 'En plataforma', '#818cf8'], ['1,240', 'Transacciones', 'Este mes', '#4ade80'], ['$4.2M', 'Comisiones generadas', 'COP acumulado', '#f59e0b']]
      .map(([v, l, s, c]) => `<div class="stat-card"><p class="mono" style="font-size:24px;font-weight:700;color:${c};margin:0 0 4px">${v}</p><p style="font-family:'Outfit',sans-serif;font-size:14px;font-weight:600;color:#e2e8f0;margin:0 0 2px">${l}</p><p style="font-size:12px;color:#64748b;margin:0">${s}</p></div>`).join('')}
    </div>
    <div class="grid-2">
      <div class="card card-p" style="border-radius:14px">
        <p style="font-family:'Outfit',sans-serif;font-weight:600;margin:0 0 14px;color:#94a3b8">Distribución por roles</p>
        ${dist.map(([l, n, c]) => `<div style="margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="font-size:13px;color:#e2e8f0">${l}</span><span class="mono" style="font-size:12px;color:${c}">${n}</span></div>
          <div class="progress"><div class="progress-fill" style="width:${Math.round((n / 284) * 100)}%;background:${c}"></div></div>
        </div>`).join('')}
      </div>
      <div class="card card-p" style="border-radius:14px">
        <p style="font-family:'Outfit',sans-serif;font-weight:600;margin:0 0 14px;color:#94a3b8">Servicios por categoría</p>
        ${cats.map(([c, n]) => `<div style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:13px;color:#e2e8f0">${c}</span><span class="mono" style="font-size:12px;color:#64748b">${n}</span></div>
          <div class="progress"><div class="progress-fill" style="width:${Math.round((n / 28) * 100)}%"></div></div>
        </div>`).join('')}
      </div>
    </div>`;
}

function renderAdminUsers() {
  const rc = r => r === 'admin' ? 'amber' : r === 'prestador' ? 'cyan' : 'purple';
  return `
    <h2 style="font-family:'Outfit',sans-serif;font-size:20px;font-weight:700;margin-bottom:20px">Gestión de usuarios</h2>
    <div class="overflow-x">
      <table class="data-table">
        <thead><tr><th>Usuario</th><th>Email</th><th>Rol</th><th>Ubicación</th><th>Estado</th></tr></thead>
        <tbody>
          ${USERS_DATA.map(u => `<tr>
            <td><div style="display:flex;align-items:center;gap:10px">${avatar(u.avatar, 32, roleColor(u.role))}<span style="font-family:'Outfit',sans-serif;font-weight:500">${u.name}</span></div></td>
            <td style="color:#64748b;font-size:13px">${u.email}</td>
            <td>${badge(u.role, rc(u.role))}</td>
            <td style="color:#64748b;font-size:13px">${u.location || '—'}</td>
            <td>${badge('Activo', 'green')}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

function renderAdminTransactions() {
  return `
    <h2 style="font-family:'Outfit',sans-serif;font-size:20px;font-weight:700;margin-bottom:20px">Control de transacciones</h2>
    <div class="grid-3" style="margin-bottom:24px">
      ${[['$42.8M', 'Volumen total', '#22d3ee'], ['$4.28M', 'Comisiones retenidas', '#f59e0b'], ['1,198 / 1,240', 'Transacciones exitosas', '#4ade80']]
      .map(([v, l, c]) => `<div class="stat-card"><p class="mono" style="font-size:18px;font-weight:700;color:${c};margin:0 0 4px">${v}</p><p style="font-family:'Outfit',sans-serif;font-size:13px;color:#94a3b8;margin:0">${l} COP</p></div>`).join('')}
    </div>
    <div class="overflow-x">
      <table class="data-table">
        <thead><tr><th>ID</th><th>Servicio</th><th>Cliente</th><th>Prestador</th><th>Monto</th><th>Comisión</th><th>Estado</th></tr></thead>
        <tbody>
          ${STATE.bookings.map(b => `<tr>
            <td class="mono" style="font-size:12px;color:#64748b">${b.id.toUpperCase()}</td>
            <td style="font-family:'Outfit',sans-serif;font-weight:500">${b.title}</td>
            <td style="color:#94a3b8;font-size:13px">${b.client}</td>
            <td style="color:#94a3b8;font-size:13px">${b.provider}</td>
            <td class="mono" style="color:#22d3ee">${COP(b.total)}</td>
            <td class="mono" style="color:#f59e0b">${COP(b.commission)}</td>
            <td>${statusBadge(b.status)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

function renderAdminServices() {
  return `
    <h2 style="font-family:'Outfit',sans-serif;font-size:20px;font-weight:700;margin-bottom:20px">Servicios publicados</h2>
    <div style="display:flex;flex-direction:column;gap:10px">
      ${SERVICES.map(s => `
        <div class="card" style="padding:16px;border-radius:12px;display:flex;align-items:center;gap:14px">
          <img src="https://images.unsplash.com/${s.img}?w=70&h=70&fit=crop&auto=format" alt="${s.title}" style="width:52px;height:52px;border-radius:8px;object-fit:cover" loading="lazy" />
          <div style="flex:1"><p style="font-family:'Outfit',sans-serif;font-weight:600;margin:0 0 2px">${s.title}</p><p style="font-size:12px;color:#64748b;margin:0">${s.provider} · ${s.category} · ${COP(s.price)}</p></div>
          <div style="display:flex;gap:10px;align-items:center">${stars(s.rating)}${badge(s.available ? 'Activo' : 'Inactivo', s.available ? 'green' : 'red')}<button class="btn-danger" style="font-size:12px">Suspender</button></div>
        </div>`).join('')}
    </div>`;
}

// ── TERMS ──────────────────────────────────────────────────────
function openTerms() {
  document.getElementById('terms-content').innerHTML = [
    ['1. Naturaleza de la Plataforma', 'Servi Choquib es un canal tecnológico de intermediación. No asume relación laboral directa con los prestadores.'],
    ['2. Obligaciones de los Usuarios', 'Los prestadores garantizan la veracidad de su información. Los clientes deben realizar pagos dentro de la app.'],
    ['3. Política de Cancelación (40 min)', 'El servicio puede cancelarse sin penalización en los 40 minutos siguientes a su confirmación.'],
    ['4. Pagos y Comisión', 'Todo pago debe realizarse dentro de la app. La plataforma retiene el 10% de comisión. Prohibido el pago externo.'],
    ['5. Protección de Datos', 'Garantizamos la confidencialidad de datos conforme a la normativa colombiana de protección de datos.'],
  ].map(([t, c]) => `<div style="margin-bottom:16px"><p style="font-family:'Outfit',sans-serif;font-weight:600;font-size:14px;color:#22d3ee;margin:0 0 4px">${t}</p><p style="font-size:13px;color:#94a3b8;line-height:1.6;margin:0">${c}</p></div>`).join('');
  openModal('modal-terms');
}

// ── MODAL HELPERS ───────────────────────────────────────────────
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

// Close modals on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.add('hidden');
  });
});

// ── Persistent service management ─────────────────────────────
STATE.editingServiceId = null;

function renderProviderServices() {
  const ownServices = SERVICES.filter(service => service.ownerId === STATE.user.id);
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;gap:12px;flex-wrap:wrap">
      <div><h2 style="font-family:'Outfit',sans-serif;font-size:20px;font-weight:700;margin:0">Mis servicios</h2><p style="color:#64748b;font-size:13px;margin:4px 0 0">Publica y administra tu oferta.</p></div>
      <button class="btn-primary" style="padding:9px 18px;font-size:14px;display:flex;align-items:center;gap:8px" onclick="openServiceEditor()">${icon('plus')} Nuevo servicio</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:12px">
      ${ownServices.length ? ownServices.map(service => `
        <div class="card" style="padding:16px;border-radius:12px;display:flex;gap:16px;align-items:center;flex-wrap:wrap">
          <div style="flex:1;min-width:210px"><p style="font-family:'Outfit',sans-serif;font-weight:600;margin:0 0 4px">${service.title}</p><p style="font-size:12px;color:#64748b;margin:0">${service.category} · ${COP(service.price)} ${service.unit}</p><p style="font-size:12px;color:#94a3b8;margin:5px 0 0">${service.desc}</p></div>
          <div style="display:flex;gap:8px;align-items:center">${badge(service.available ? 'Activo' : 'Inactivo', service.available ? 'green' : 'red')}<button class="btn-outline btn-sm" onclick="openServiceEditor(${service.id})">Editar</button><button class="btn-danger" onclick="deleteService(${service.id})">Eliminar</button></div>
        </div>`).join('') : '<div class="card card-p"><p style="color:#94a3b8;margin:0">Todavía no tienes servicios publicados. Crea el primero.</p></div>'}
    </div>`;
}

function openServiceEditor(serviceId = null) {
  STATE.editingServiceId = serviceId;
  const service = SERVICES.find(item => item.id === serviceId);
  document.querySelector('#modal-new-service h3').textContent = service ? 'Editar servicio' : 'Publicar nuevo servicio';
  document.getElementById('service-title').value = service?.title || '';
  document.getElementById('service-price').value = service?.price || '';
  document.getElementById('service-category').value = service?.category || '';
  document.getElementById('service-desc').value = service?.desc || '';
  document.getElementById('service-unit').value = service?.unit || 'por servicio';
  document.getElementById('service-location').value = service?.location || 'Quibdó';
  openModal('modal-new-service');
}

async function saveServiceFromModal() {
  const payload = {
    title: document.getElementById('service-title').value.trim(),
    price: Number(document.getElementById('service-price').value),
    category: document.getElementById('service-category').value,
    desc: document.getElementById('service-desc').value.trim(),
    unit: document.getElementById('service-unit').value.trim(),
    location: document.getElementById('service-location').value.trim(),
    available: true,
  };
  try {
    const path = STATE.editingServiceId ? `/services/${STATE.editingServiceId}` : '/services';
    await apiRequest(path, { method: STATE.editingServiceId ? 'PUT' : 'POST', body: JSON.stringify(payload) });
    closeModal('modal-new-service');
    await loadRemoteData();
    navigate('my-services');
  } catch (error) {
    alert(error.message);
  }
}

async function deleteService(serviceId) {
  if (!confirm('¿Eliminar este servicio?')) return;
  try {
    await apiRequest(`/services/${serviceId}`, { method: 'DELETE' });
    await loadRemoteData();
    navigate('my-services');
  } catch (error) {
    alert(error.message);
  }
}

function readProfileImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve('');
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('No se pudo leer la imagen de perfil.'));
    reader.readAsDataURL(file);
  });
}

function renderProfile() {
  return `
    <div style="max-width:820px">
      <h2 style="font-family:'Outfit',sans-serif;font-size:24px;font-weight:700;margin:0 0 6px">Completa tu perfil</h2>
      <p style="color:#64748b;margin:0 0 24px">Mantén actualizada tu información para que otros usuarios puedan reconocerte y contactarte.</p>
      <div class="profile-layout">
      <div class="card card-p profile-card">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:24px">${avatar(STATE.user.avatar, 56, roleColor(STATE.user.role), STATE.user.profile_image)}<div><p style="font-family:'Outfit',sans-serif;font-weight:600;margin:0">${STATE.user.email}</p><p style="color:#64748b;font-size:13px;margin:4px 0;text-transform:capitalize">${STATE.user.role}</p></div></div>
        <div class="form-group">
          <label class="form-label">Foto de perfil</label>
          <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
            <input class="input" id="profile-image-input" type="file" accept="image/*" />
            ${STATE.user.profile_image ? `<img src="${STATE.user.profile_image}" alt="Foto de perfil" style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:1px solid rgba(34,211,238,0.3)" />` : ''}
          </div>
        </div>
        <div class="form-group"><label class="form-label">Nombre completo</label><input class="input" id="profile-name" value="${STATE.user.name || ''}" /></div>
        <div class="form-group"><label class="form-label">Ubicación</label><input class="input" id="profile-location" value="${STATE.user.location || ''}" placeholder="Barrio o ciudad" /></div>
        <div class="form-group"><label class="form-label">Teléfono</label><input class="input" id="profile-phone" value="${STATE.user.phone || ''}" placeholder="300 000 0000" /></div>
        <div class="form-group"><label class="form-label">Especialidad</label><input class="input" id="profile-specialty" value="${STATE.user.specialty || ''}" placeholder="Ej: Barbería, diseño, reparación..." /></div>
        <div class="form-group"><label class="form-label">Sobre mí</label><textarea class="input" id="profile-bio" rows="4" placeholder="Cuéntale a la comunidad quién eres y qué ofreces">${STATE.user.bio || ''}</textarea></div>
        <div class="form-group"><label class="form-label">Disponibilidad</label><select class="input" id="profile-availability"><option ${STATE.user.availability === 'Disponible para solicitudes' ? 'selected' : ''}>Disponible para solicitudes</option><option ${STATE.user.availability === 'Solo con cita previa' ? 'selected' : ''}>Solo con cita previa</option><option ${STATE.user.availability === 'No disponible temporalmente' ? 'selected' : ''}>No disponible temporalmente</option></select></div>
        <p id="profile-error" class="hidden" style="color:#f87171;font-size:13px;margin-bottom:12px"></p>
        <button class="btn-primary" onclick="saveProfile()">Guardar información</button>
      </div>
      <div class="card card-p profile-preview"><p class="profile-preview-label">Vista pública</p>${avatar(STATE.user.avatar, 72, roleColor(STATE.user.role), STATE.user.profile_image)}<h3>${STATE.user.name}</h3><p class="profile-role">${STATE.user.role}</p><p class="profile-bio">${STATE.user.bio || 'Tu presentación aparecerá aquí.'}</p><div class="divider"></div><p><strong>Especialidad</strong><br>${STATE.user.specialty || 'Agrega una especialidad'}</p><p><strong>Ubicación</strong><br>${STATE.user.location || 'Agrega tu ubicación'}</p><p><strong>Disponibilidad</strong><br>${STATE.user.availability || 'Disponible para solicitudes'}</p></div>
      </div>
    </div>`;
}

async function saveProfile() {
  const name = document.getElementById('profile-name').value.trim();
  const location = document.getElementById('profile-location').value.trim();
  const phone = document.getElementById('profile-phone').value.trim();
  const bio = document.getElementById('profile-bio').value.trim();
  const specialty = document.getElementById('profile-specialty').value.trim();
  const availability = document.getElementById('profile-availability').value;
  const imageInput = document.getElementById('profile-image-input');
  let profileImage = STATE.user.profile_image || '';

  try {
    if (imageInput && imageInput.files && imageInput.files[0]) {
      profileImage = await readProfileImageFile(imageInput.files[0]);
    }

    const data = await apiRequest('/profile', {
      method: 'PUT',
      body: JSON.stringify({ name, location, phone, bio, specialty, availability, profile_image: profileImage })
    });
    STATE.user = data.user;
    buildSidebar();
    navigate('profile');
  } catch (error) {
    showError(error.message, 'profile-error');
  }
}

async function restoreSession() {
  if (!STATE.token) return;
  try {
    const data = await apiRequest('/me');
    if (data.user) loginUser(data.user, STATE.token);
  } catch {
    localStorage.removeItem('servilocal_token');
    STATE.token = null;
  }
}

restoreSession();
