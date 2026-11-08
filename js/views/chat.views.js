// Plantillas de presentación del módulo de mensajería.
function renderChat() {
  const partner = findUserById(STATE.chatPartnerId);
  return `
    <div class="chat-shell">
      <div class="chat-contacts">
        <div class="chat-contact-search"><div class="form-row"><span class="search-icon">${smallIcon('search')}</span><input class="input input-search" id="chat-contact-search" aria-label="Buscar persona" placeholder="Buscar persona..." oninput="filterChatContacts(this.value)" /></div></div>
        <h3 style="font-family:'Outfit',sans-serif;font-size:16px;margin:0;padding:16px 16px 8px">Conversaciones</h3>
        <div id="chat-contact-list" class="chat-contact-list">
          ${STATE.contacts.map(contact => `<div class="chat-contact-row" style="display:flex;align-items:center;gap:8px"><button class="chat-contact" onclick="selectChatContact('${escapeHtml(contact.id)}')" style="display:flex;align-items:center;gap:10px;flex:1;padding:10px;border:1px solid ${String(contact.id) === String(STATE.chatPartnerId) ? 'rgba(34,211,238,0.5)' : 'rgba(34,211,238,0.1)'};border-radius:8px;background:${String(contact.id) === String(STATE.chatPartnerId) ? 'rgba(34,211,238,0.12)' : 'transparent'};color:#e2e8f0;text-align:left;cursor:pointer">${avatar(contact.avatar, 30, roleColor(contact.role))}<span><strong style="display:block;font-size:13px">${escapeHtml(contact.name)}</strong><small style="color:#64748b">${escapeHtml(contact.role)}</small></span></button><button class="btn-outline btn-sm" title="Ver ficha" onclick="openPublicProfile('${escapeHtml(contact.id)}')">Ver</button></div>`).join('') || '<p style="color:#64748b;font-size:13px">No hay otros usuarios registrados.</p>'}
        </div>
      </div>
      <div class="chat-main">
      <div class="chat-header">
        ${avatar(partner?.avatar || '??', 40, partner ? roleColor(partner.role) : '#64748b')}
        <div><p style="font-family:'Outfit',sans-serif;font-weight:600;font-size:15px;margin:0">${escapeHtml(partner?.name || 'Selecciona un contacto')}</p><span style="font-size:12px;color:#64748b">${escapeHtml(partner?.role || 'Para iniciar una conversación')}</span></div>
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
    ${m.text ? `<p style="margin:0;line-height:1.5">${escapeHtml(m.text)}</p>` : ''}
    <div class="chat-message-footer"><p class="msg-time" style="text-align:${isMe ? 'right' : 'left'}">${escapeHtml(m.time)}</p>${isMe ? `<span class="chat-message-actions"><button type="button" onclick="editMessage('${escapeHtml(m.id)}')">Editar</button><button type="button" onclick="deleteMessage('${escapeHtml(m.id)}')">Eliminar</button></span>` : ''}</div>
  </div>`;
}


function chatAttachmentHtml(attachment) {
  const name = escapeHtml(attachment?.name || 'Archivo adjunto');
  const dataUrl = String(attachment?.dataUrl || '');
  const safeDataUrl = /^data:(?:image\/(?:png|jpeg|gif|webp)|video\/(?:mp4|webm)|audio\/(?:mpeg|ogg|wav)|application\/(?:pdf|msword|vnd\.ms-excel|vnd\.openxmlformats-officedocument\.(?:wordprocessingml\.document|spreadsheetml\.sheet))|text\/plain);base64,[a-z0-9+/=]+$/i.test(dataUrl)
    ? escapeHtml(dataUrl)
    : '';
  if (!safeDataUrl) return `<span class="chat-file chat-file-unavailable">${icon('file')}<span>${name} · archivo no disponible</span></span>`;
  if (attachment?.type?.startsWith('image/')) {
    return `<a class="chat-image-link" href="${safeDataUrl}" target="_blank" rel="noopener"><img class="chat-image" src="${safeDataUrl}" alt="${name}" /></a>`;
  }
  return `<a class="chat-file" href="${safeDataUrl}" download="${name}">${icon('file')}<span>${name}</span></a>`;
}

function renderChatAttachmentPreview() {
  if (!STATE.chatAttachment) return '';
  return `<div class="chat-attachment-preview" id="chat-attachment-preview">${chatAttachmentHtml(STATE.chatAttachment)}<button type="button" class="btn-outline btn-sm" onclick="clearChatAttachment()" aria-label="Quitar archivo">${icon('x')}</button></div>`;
}
