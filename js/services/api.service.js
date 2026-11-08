function handleDemoApiRequest(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body) : {};

  if (path === '/profile' && method === 'PUT') {
    STATE.user = { ...STATE.user, ...body, profile_image: body.profile_image || STATE.user.profile_image || '' };
    return { user: STATE.user };
  }
  if (path === '/services' && method === 'POST') {
    const service = {
      ...body,
      id: `demo-s${Date.now()}`,
      ownerId: STATE.user.id,
      provider: STATE.user.name,
      avatar: STATE.user.avatar,
      rating: 0,
      reviews: 0,
      available: true,
    };
    SERVICES.unshift(service);
    return { service };
  }
  if (path.startsWith('/services/') && method === 'PUT') {
    const service = findServiceById(path.split('/').pop());
    if (!service || String(service.ownerId) !== String(STATE.user.id)) throw new Error('Servicio no encontrado.');
    Object.assign(service, body);
    return { service };
  }
  if (path.startsWith('/services/') && method === 'DELETE') {
    const serviceId = path.split('/').pop();
    const index = SERVICES.findIndex(item => String(item.id) === String(serviceId) && String(item.ownerId) === String(STATE.user.id));
    if (index < 0) throw new Error('Servicio no encontrado.');
    SERVICES.splice(index, 1);
    return { ok: true };
  }
  if (path === '/services' && method === 'GET') return { services: SERVICES };
  if (path === '/me' || path === '/profile') return { user: STATE.user };
  if (path === '/contacts') return { contacts: USERS_DATA.filter(user => user.id !== STATE.user.id) };
  if (path === '/bookings' && method === 'GET') return { bookings: STATE.bookings };
  if (path === '/bookings' && method === 'POST') {
    const service = findServiceById(body.serviceId);
    if (!service) throw new Error('No se pudo encontrar este servicio.');
    const booking = {
      id: `demo-${Date.now()}`,
      service_id: service.id,
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

  // Usa una única URL base explícita. En GitHub Pages no hay servidor Node:
  // js/config.js debe apuntar a la URL HTTPS pública del backend desplegado.
  if (!API) {
    throw new Error(
      'La API no está configurada para este sitio. Edita js/config.js y asigna window.SERVI_API_URL a la URL HTTPS pública del backend, por ejemplo https://tu-api.example.com/api. GitHub Pages solo aloja el frontend.'
    );
  }

  const normalizedPath = String(path).startsWith('/') ? path : `/${path}`;
  const url = `${API}${normalizedPath}`;

  let response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (error) {
    throw new Error(
      `No se pudo conectar con Servi Choquib API (${url}). Comprueba que el backend esté desplegado y accesible por HTTPS, y que CLIENT_ORIGIN incluya exactamente ${window.location.origin}.`,
      { cause: error },
    );
  }

  const responseText = await response.text();
  let data = {};
  if (responseText.trim()) {
    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error('La API respondió con un formato no válido. Comprueba la URL pública configurada en js/config.js y el estado del backend.');
    }
  }

  if (!response.ok) {
    throw new Error(data.error || `La solicitud falló (HTTP ${response.status}).`);
  }
  return data;
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
  const recentContacts = getConversationContacts(STATE.allContacts, messages.messages);
  const recentIds = new Set(recentContacts.map(contact => String(contact.id)));
  // Incluye contactos sin conversación para permitir iniciar un chat nuevo desde la interfaz.
  STATE.contacts = [...recentContacts, ...STATE.allContacts.filter(contact => !recentIds.has(String(contact.id)))];
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

