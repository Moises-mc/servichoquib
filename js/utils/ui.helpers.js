function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>\"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

const safeImageUrl = value => {
  const url = String(value || '');
  return /^(https:\/\/|data:image\/(?:png|jpeg|gif|webp);base64,)/i.test(url) ? escapeHtml(url) : '';
};

// ── Helpers ────────────────────────────────────────────────────
const COP = n => '$' + n.toLocaleString('es-CO') + ' COP';
const icon = id => `<i data-lucide="${id}" aria-hidden="true" class="icon"></i>`;
const refreshIcons = () => { if (window.lucide) window.lucide.createIcons({ attrs: { 'stroke-width': 1.8 } }); };
const smallIcon = id => `<svg width="14" height="14"><use href="#ic-${id}"/></svg>`;
const avatar = (initials, size = 36, color = '#22d3ee', imageUrl = '') => {
  if (safeImageUrl(imageUrl)) {
    return `<img src="${safeImageUrl(imageUrl)}" alt="${escapeHtml(initials || 'perfil')}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;border:1.5px solid ${color}50;background:#0f172a;display:block" />`;
  }
  return `<div class="avatar" style="width:${size}px;height:${size}px;background:linear-gradient(135deg,${color}28,${color}55);border:1.5px solid ${color}50;font-size:${Math.round(size * 0.35)}px;font-weight:700;color:${color};font-family:'Outfit',sans-serif">${escapeHtml(initials || 'U')}</div>`;
};
const stars = r => `<span style="color:#fbbf24;display:flex;gap:2px;align-items:center">${[1, 2, 3, 4, 5].map(i => `<svg width="13" height="13" fill="${i <= Math.round(r) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><use href="#ic-star-fill"/></svg>`).join('')}</span>`;
const badge = (text, type = 'cyan') => `<span class="badge badge-${['cyan', 'green', 'amber', 'red', 'purple'].includes(type) ? type : 'cyan'}">${escapeHtml(text)}</span>`;
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



// Devuelve la imagen guardada del servicio; admite imágenes Base64 como la foto de perfil.
function serviceImageUrl(service, size = '400x200') {
  const image = String(service?.img || '');
  if (safeImageUrl(image)) return safeImageUrl(image);
  if (/^photo-[a-z0-9-]+$/i.test(image)) {
    const [width, height] = size.split('x');
    return `https://images.unsplash.com/${encodeURIComponent(image)}?w=${width}&h=${height}&fit=crop&auto=format`;
  }
  return '/assets/servi-choquib-icon.png';
}
