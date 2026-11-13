
async function apiRequest(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (STATE.token) headers.Authorization = `Bearer ${STATE.token}`;

  // Usa una única URL base. Reintentar contra otros puertos u orígenes ocultaba
  // los errores CORS y podía enviar POST a Live Server (que responde 405).
  const normalizedPath = String(path).startsWith('/') ? path : `/${path}`;
  const url = `${API}${normalizedPath}`;

  let response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (error) {
    throw new Error(
      `No se pudo conectar con Servi Choquib API (${url}). Verifica que el backend esté activo y que CLIENT_ORIGIN incluya el origen del frontend.`,
      { cause: error },
    );
  }

  const responseText = await response.text();
  let data = {};
  if (responseText.trim()) {
    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error('La API respondió con un formato no válido. Comprueba que el backend esté ejecutándose en el puerto 8000.');
    }
  }

  if (!response.ok) {
    throw new Error(data.error || `La solicitud falló (HTTP ${response.status}).`);
  }
  return data;
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

