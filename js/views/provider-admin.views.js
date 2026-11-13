function renderProviderDash() {
  const providerServices = SERVICES.filter(service => String(service.ownerId) === String(STATE.user.id));
  const providerBookings = STATE.bookings.filter(booking => String(booking.provider_id) === String(STATE.user.id));
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayEnd = dayStart + 24 * 60 * 60 * 1000;
  const requestsToday = providerBookings.filter(booking => {
    const created = Date.parse(booking.created_at || '');
    return Number.isFinite(created) && created >= dayStart && created < dayEnd;
  }).length;
  const paidBookings = providerBookings.filter(booking => Number(booking.paid) === 1 && Number(booking.payment_amount) > 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const incomeThisMonth = paidBookings.filter(booking => {
    const paidAt = Date.parse(booking.paid_at || booking.updated_at || booking.created_at || '');
    return Number.isFinite(paidAt) && paidAt >= monthStart;
  }).reduce((sum, booking) => sum + Number(booking.payment_amount || 0), 0);
  const reviewCount = providerServices.reduce((sum, service) => sum + Number(service.reviews || 0), 0);
  const rating = reviewCount
    ? providerServices.reduce((sum, service) => sum + Number(service.rating || 0) * Number(service.reviews || 0), 0) / reviewCount
    : 0;
  const stats = [
    [String(providerServices.filter(service => service.available).length), 'Servicios activos', '#22d3ee'],
    [String(requestsToday), 'Solicitudes hoy', '#818cf8'],
    [COP(incomeThisMonth), 'Ingresos pagados este mes', '#4ade80'],
    [reviewCount ? `${rating.toFixed(1)} ★` : 'Sin calificaciones', 'Calificación', '#f59e0b'],
  ];
  return `
    <h2 style="font-size:28px;font-weight:700;margin:0 0 4px">Panel de <span class="gradient-text">Prestador</span></h2>
    <p style="color:#64748b;margin:0 0 24px">Bienvenido, ${escapeHtml(STATE.user.name)}. Gestiona tus servicios aquí.</p>
    <div class="grid-4 provider-dashboard-stats" style="margin-bottom:28px">
      ${stats.map(([value, label, color]) => `<div class="stat-card"><p class="mono" style="font-size:22px;font-weight:700;color:${color};margin:0 0 4px">${escapeHtml(value)}</p><p style="font-family:'Outfit',sans-serif;font-size:13px;font-weight:600;color:#94a3b8;margin:0">${escapeHtml(label)}</p></div>`).join('')}
    </div>
    <h3 style="font-family:'Outfit',sans-serif;font-size:16px;font-weight:600;margin-bottom:14px;color:#94a3b8">Mis servicios publicados</h3>
    <div class="provider-dashboard-services" style="display:flex;flex-direction:column;gap:10px">
      ${providerServices.map(service => `
        <div class="card provider-dashboard-service" style="padding:16px;border-radius:12px;display:flex;align-items:center;gap:16px">
          <img src="${safeImageUrl(service.img) || (/^photo-[a-z0-9-]+$/i.test(String(service.img || '')) ? `https://images.unsplash.com/${encodeURIComponent(service.img)}?w=120&h=120&fit=crop&auto=format` : '/assets/servi-choquib-icon.png')}" alt="${escapeHtml(service.title)}" onerror="this.onerror=null;this.src='/assets/servi-choquib-icon.png'" style="width:60px;height:60px;border-radius:10px;object-fit:cover;background:#111b54" loading="lazy" />
          <div style="flex:1;min-width:0"><p style="font-family:'Outfit',sans-serif;font-weight:600;margin:0 0 2px">${escapeHtml(service.title)}</p><p style="font-size:12px;color:#64748b;margin:0">${escapeHtml(service.category)} · ${COP(service.price)} ${escapeHtml(service.unit)}</p></div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">${stars(service.rating)}<span style="font-size:12px;color:#64748b">${Number(service.reviews || 0)} reseñas</span>${badge(service.available ? 'Activo' : 'Inactivo', service.available ? 'green' : 'red')}</div>
        </div>`).join('') || '<div class="card card-p provider-empty-state"><strong>Aún no has publicado servicios.</strong><p style="color:#94a3b8;margin:6px 0 14px">Cuando publiques tu primer servicio, aparecerá aquí.</p><button class="btn-primary" onclick="navigate(&quot;my-services&quot;)">Publicar mi primer servicio</button></div>'}
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
        <p style="font-family:'Outfit',sans-serif;font-weight:700;font-size:15px;margin:0 0 4px">${escapeHtml(b.title)}</p>
        <p style="font-size:13px;color:#94a3b8;margin:0 0 4px">Cliente: <strong style="color:#e2e8f0">${escapeHtml(b.client)}</strong></p>
        <p class="mono" style="font-size:12px;color:#64748b;margin:0">Fecha: ${escapeHtml(b.date)}</p>
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
    if (status === 'completado') {
      alert('Servicio finalizado. El pago aún no está habilitado; se activará cuando se integre PayU.');
    }
    await loadRemoteData();
    navigate(STATE.user.role === 'prestador' ? 'requests' : 'history');
  } catch (error) {
    alert(error.message);
  }
}

function renderIncome() {
  const providerBookings = STATE.bookings.filter(booking => booking.provider_id === STATE.user.id || booking.provider === STATE.user.name);
  const completedPayments = providerBookings.filter(booking => booking.paid === 1 && Number(booking.payment_amount) > 0);
  const totalReceived = completedPayments.reduce((sum, booking) => sum + Number(booking.payment_amount || 0), 0);
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
            <td><div style="display:flex;align-items:center;gap:10px">${avatar(u.avatar, 32, roleColor(u.role))}<span style="font-family:'Outfit',sans-serif;font-weight:500">${escapeHtml(u.name)}</span></div></td>
            <td style="color:#64748b;font-size:13px">${escapeHtml(u.email)}</td>
            <td>${badge(u.role, rc(u.role))}</td>
            <td style="color:#64748b;font-size:13px">${escapeHtml(u.location || '—')}</td>
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
            <td class="mono" style="font-size:12px;color:#64748b">${escapeHtml(b.id).toUpperCase()}</td>
            <td style="font-family:'Outfit',sans-serif;font-weight:500">${escapeHtml(b.title)}</td>
            <td style="color:#94a3b8;font-size:13px">${escapeHtml(b.client)}</td>
            <td style="color:#94a3b8;font-size:13px">${escapeHtml(b.provider)}</td>
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
          <img src="https://images.unsplash.com/${s.img}?w=70&h=70&fit=crop&auto=format" alt="${escapeHtml(s.title)}" style="width:52px;height:52px;border-radius:8px;object-fit:cover" loading="lazy" />
          <div style="flex:1"><p style="font-family:'Outfit',sans-serif;font-weight:600;margin:0 0 2px">${escapeHtml(s.title)}</p><p style="font-size:12px;color:#64748b;margin:0">${escapeHtml(s.provider)} · ${escapeHtml(s.category)} · ${COP(s.price)}</p></div>
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

