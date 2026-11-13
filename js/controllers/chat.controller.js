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
  const allowedTypes = new Set([
    'image/png', 'image/jpeg', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'audio/mpeg', 'audio/ogg', 'audio/wav',
    'application/pdf', 'application/msword', 'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ]);
  if (file.size > 1024 * 1024 || !allowedTypes.has(String(file.type).toLowerCase())) {
    input.value = '';
    showError(file.size > 1024 * 1024 ? 'El archivo no puede superar 1 MB.' : 'El tipo de archivo no está permitido.', 'chat-error');
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
  const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const term = normalize(query);
  let visible = 0;
  document.querySelectorAll('#chat-contact-list .chat-contact-row').forEach(row => {
    const matches = !term || normalize(row.dataset.contactName).includes(term);
    row.hidden = !matches;
    if (matches) visible += 1;
  });
  const empty = document.getElementById('chat-search-empty');
  if (empty) empty.hidden = !term || visible > 0;
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
    await addActiveChatContact();
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

async function addActiveChatContact() {
  const result = await apiRequest('/conversations');
  STATE.contacts = result.contacts || [];
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
        <div class="public-profile-heading">${avatar(user.avatar, 76, roleColor(user.role), user.profile_image)}<div><h2>${escapeHtml(user.name)}</h2><p>${escapeHtml(user.role)} · ${escapeHtml(user.location || 'Quibdó')}</p></div><button class="btn-outline btn-sm" onclick="closeModal('modal-profile')">${icon('x')}</button></div>
        <p class="public-profile-bio">${escapeHtml(user.bio || 'Este usuario aún no ha añadido una presentación.')}</p>
        <div class="public-profile-details"><div><span>Especialidad</span><strong>${escapeHtml(user.specialty || 'No especificada')}</strong></div><div><span>Disponibilidad</span><strong>${escapeHtml(user.availability || 'Disponible para solicitudes')}</strong></div><div><span>Contacto</span><strong>${escapeHtml(user.phone || 'Disponible por chat')}</strong></div><div><span>Correo</span><strong>${escapeHtml(user.email)}</strong></div></div>
        <div style="display:flex;gap:10px;margin-top:22px"><button class="btn-primary flex-1" onclick="closeModal('modal-profile');selectChatContact('${escapeHtml(user.id)}')">Enviar mensaje</button><button class="btn-outline flex-1" onclick="closeModal('modal-profile')">Cerrar</button></div>
      </div>
    </div>`;
  openModal('modal-profile');
}

// ── SERVICE DETAIL MODAL ────────────────────────────────────────
