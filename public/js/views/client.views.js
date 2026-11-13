function renderClientDash() {
  const bookings = STATE.bookings.slice(0, 3);
  const totalSpent = STATE.bookings.reduce((total, booking) => total + (booking.client === STATE.user.name ? Number(booking.total) : 0), 0);
  const pending = STATE.bookings.filter(booking => booking.status === 'pendiente').length;
  const completed = STATE.bookings.filter(booking => booking.status === 'completado').length;
  return `
    <div class="dashboard-hero">
      <div><p class="section-kicker">Panel personal</p><h2>Hola, <span class="gradient-text">${escapeHtml(STATE.user.name)}</span></h2><p>Gestiona tus servicios y encuentra ayuda confiable cerca de ti.</p></div>
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
            <div><p style="font-family:'Outfit',sans-serif;font-weight:600;font-size:14px;margin:0 0 2px;color:#e2e8f0">${escapeHtml(b.title)}</p><p style="font-size:12px;color:#64748b;margin:0">${escapeHtml(b.provider)} · ${escapeHtml(b.date)}</p></div>
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
        <input class="input input-search" id="catalog-search" placeholder="Buscar servicios, categorías..." value="${escapeHtml(q)}" oninput="onSearchInput(this.value)" />
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${CATEGORIES.map(c => `<button class="pill-filter${c === cat ? ' active' : ''}" onclick="filterCat('${escapeHtml(c)}')">${escapeHtml(c)}</button>`).join('')}
      </div>
    </div>
    <div class="grid-cards">
      ${filtered.map(s => `
        <div class="service-card" onclick="openServiceDetail('${s.id}')">
          <div style="height:160px;overflow:hidden;position:relative;background:#111b54">
            <img src="https://images.unsplash.com/${s.img}?w=400&h=200&fit=crop&auto=format" alt="${escapeHtml(s.title)}" style="width:100%;height:100%;object-fit:contain;opacity:0.95" loading="lazy" />
            ${!s.available ? '<div style="position:absolute;inset:0;background:rgba(10,15,46,0.7);display:flex;align-items:center;justify-content:center">' + badge('No disponible', 'red') + '</div>' : ''}
            <div class="service-profession" title="Profesión o categoría">${escapeHtml(s.category)}</div>
      <div style="position:absolute;top:10px;left:10px">${badge(s.available ? 'Disponible' : 'No disponible', s.available ? 'green' : 'red')}</div>
          </div>
          <div style="padding:16px">
            <h3 style="font-family:'Outfit',sans-serif;font-size:15px;font-weight:700;margin:0 0 4px;color:#f1f5f9">${escapeHtml(s.title)}</h3>
            <p style="font-size:12px;color:#64748b;margin:0 0 10px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${escapeHtml(s.desc)}</p>
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:10px">
              ${avatar(s.avatar, 24)}
              <button class="text-button" onclick="event.stopPropagation();openPublicProfile('${escapeHtml(s.ownerId || '')}')">${escapeHtml(s.provider)}</button>
              <div style="display:flex;align-items:center;gap:4px;margin-left:auto">${stars(s.rating)}<span style="font-size:11px;color:#64748b">(${escapeHtml(s.reviews)})</span></div>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between">
              <div><span class="mono" style="font-size:16px;font-weight:700;color:#22d3ee">${COP(s.price)}</span><span style="font-size:11px;color:#64748b"> ${escapeHtml(s.unit)}</span></div>
              <button type="button" class="btn-primary btn-sm" ${s.available ? '' : 'disabled'} onclick="event.stopPropagation();requestService('${s.id}')">${s.available ? 'Solicitar' : 'No disponible'}</button>
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
      <img src="https://images.unsplash.com/${s.img}?w=400&h=200&fit=crop&auto=format" alt="${escapeHtml(s.title)}" style="width:100%;height:100%;object-fit:contain;opacity:0.95" loading="lazy"/>
      ${!s.available ? '<div style="position:absolute;inset:0;background:rgba(10,15,46,0.7);display:flex;align-items:center;justify-content:center">' + badge('No disponible', 'red') + '</div>' : ''}
      <div class="service-profession" title="Profesión o categoría">${escapeHtml(s.category)}</div>
    <div style="position:absolute;top:10px;left:10px">${badge(s.available ? 'Disponible' : 'No disponible', s.available ? 'green' : 'red')}</div>
    </div>
    <div style="padding:16px">
      <h3 style="font-family:'Outfit',sans-serif;font-size:15px;font-weight:700;margin:0 0 4px;color:#f1f5f9">${escapeHtml(s.title)}</h3>
      <p style="font-size:12px;color:#64748b;margin:0 0 10px;line-height:1.5">${escapeHtml(s.desc)}</p>
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:10px">
        ${avatar(s.avatar, 24)}<button class="text-button" onclick="event.stopPropagation();openPublicProfile('${escapeHtml(s.ownerId || '')}')">${escapeHtml(s.provider)}</button>
        <div style="display:flex;align-items:center;gap:4px;margin-left:auto">${stars(s.rating)}<span style="font-size:11px;color:#64748b">(${escapeHtml(s.reviews)})</span></div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div><span class="mono" style="font-size:16px;font-weight:700;color:#22d3ee">${COP(s.price)}</span><span style="font-size:11px;color:#64748b"> ${escapeHtml(s.unit)}</span></div>
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

function openReview(bookingId) {
  const booking = STATE.bookings.find(item => String(item.id) === String(bookingId));
  const title = booking?.title || '';
  document.getElementById('modal-review-box').innerHTML = `
    <div class="modal-body">
      <div class="modal-header"><div><p class="section-kicker">Tu experiencia</p><h2 style="font-size:20px;margin-top:5px">Califica este servicio</h2></div><button class="btn-outline btn-sm" onclick="closeModal('modal-review')">${icon('x')}</button></div>
      <p style="color:#94a3b8;font-size:13px;margin-bottom:18px">${escapeHtml(title)}</p>
      <div class="rating-picker" id="review-rating">${[1, 2, 3, 4, 5].map(value => `<button type="button" aria-label="${value} estrellas" onclick="selectReviewRating(${value})">★</button>`).join('')}</div>
      <input type="hidden" id="review-rating-value" value="0" />
      <div class="form-group"><label class="form-label">Comentario (opcional)</label><textarea class="input" id="review-comment" rows="4" placeholder="¿Cómo fue tu experiencia?"></textarea></div>
      <p id="review-error" class="hidden" style="color:#f87171;font-size:13px;margin-bottom:12px"></p>
      <button class="btn-primary btn-full" onclick="submitReview('${bookingId}')">Publicar reseña</button>
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
            <td style="font-family:'Outfit',sans-serif;font-weight:500">${escapeHtml(b.title)}</td>
            <td style="color:#94a3b8">${escapeHtml(b.provider)}</td>
            <td class="mono" style="font-size:12px;color:#64748b">${escapeHtml(b.date)}</td>
            <td class="mono" style="color:#22d3ee">${COP(b.total)}</td>
            <td>${statusBadge(b.status)} ${b.status === 'confirmado' ? `<button class="btn-primary btn-sm" onclick="changeBookingStatus('${b.id}','completado')">Aceptar servicio</button>` : ''} ${b.status === 'completado' ? `<button class="btn-outline btn-sm" onclick="openReview('${b.id}')">Calificar</button>` : ''} ${b.status === 'pendiente' || b.status === 'confirmado' ? `<button class="btn-danger" onclick="changeBookingStatus('${b.id}','cancelado')">Cancelar</button>` : ''}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

// ── CHAT ────────────────────────────────────────────────────────
