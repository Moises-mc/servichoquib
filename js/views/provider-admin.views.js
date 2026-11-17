function dashboardServiceImage(service) {
  return serviceImageUrl(service, '240x180');
}

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
  const completedCount = providerBookings.filter(booking => booking.status === 'completado').length;
  const completionRate = providerBookings.length ? Math.round((completedCount / providerBookings.length) * 100) : null;
  const stats = [
    [String(providerServices.filter(service => service.available).length), 'Servicios activos', '#22d3ee', 'briefcase'],
    [String(requestsToday), 'Solicitudes hoy', '#818cf8', 'bell'],
    [COP(incomeThisMonth), 'Ingresos pagados este mes', '#4ade80', 'chart-line'],
    [reviewCount ? `${rating.toFixed(1)} ★` : 'Sin calificaciones', 'Calificación promedio', '#f59e0b', 'star'],
  ];
  const months = [];
  const monthlyIncome = [];
  for (let offset = 5; offset >= 0; offset -= 1) {
    const month = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    const amount = paidBookings.filter(booking => {
      const paidAt = Date.parse(booking.paid_at || booking.updated_at || booking.created_at || '');
      return Number.isFinite(paidAt) && paidAt >= month.getTime() && paidAt < nextMonth.getTime();
    }).reduce((sum, booking) => sum + Number(booking.payment_amount || 0), 0);
    months.push(month.toLocaleDateString('es-CO', { month: 'short' }));
    monthlyIncome.push(amount);
  }
  const maxIncome = Math.max(...monthlyIncome, 1);
  const hasIncomeHistory = monthlyIncome.some(value => value > 0);
  const recentBookings = [...providerBookings].sort((a, b) => Date.parse(b.created_at || b.date || 0) - Date.parse(a.created_at || a.date || 0)).slice(0, 4);
  return `
    <div class="provider-dashboard-hero">
      <div><p class="section-kicker">Tu espacio de trabajo</p><h2>¡Hola, <span class="gradient-text">${escapeHtml(STATE.user.name)}</span>!</h2><p>Este es el resumen de tu actividad real en Servi Choquib.</p></div>
      <button class="btn-primary" onclick="navigate('my-services')">Gestionar servicios ${icon('arrow-right')}</button>
    </div>
    <div class="grid-4 provider-dashboard-stats" style="margin-bottom:22px">
      ${stats.map(([value, label, color, symbol]) => `<div class="stat-card provider-stat-card"><span class="provider-stat-icon" style="color:${color}">${icon(symbol)}</span><p class="mono" style="font-size:22px;font-weight:700;color:${color};margin:0 0 5px;overflow-wrap:anywhere">${escapeHtml(value)}</p><p style="font-family:'Outfit',sans-serif;font-size:13px;font-weight:600;color:#94a3b8;margin:0">${escapeHtml(label)}</p></div>`).join('')}
    </div>
    <div class="provider-dashboard-main-grid">
      <section class="card card-p provider-dashboard-panel">
        <div class="section-heading"><div><p class="section-kicker">Resumen financiero</p><h3>Ingresos recibidos</h3></div><span class="provider-panel-icon">${icon('chart-no-axes-combined')}</span></div>
        <p class="provider-chart-total mono">${COP(incomeThisMonth)} <small>este mes</small></p>
        ${hasIncomeHistory ? `<div class="provider-income-chart">${months.map((month, index) => `<div class="provider-income-column"><span class="mono">${Math.round(monthlyIncome[index] / 1000)}k</span><div class="provider-income-bar" style="height:${Math.max(4, Math.round(monthlyIncome[index] / maxIncome * 118))}px"></div><small>${escapeHtml(month)}</small></div>`).join('')}</div>` : '<div class="empty-state"><strong>Aún no hay pagos registrados.</strong><p>La gráfica se actualizará cuando existan pagos confirmados. No se muestran proyecciones.</p></div>'}
      </section>
      <section class="card card-p provider-dashboard-panel">
        <div class="section-heading"><div><p class="section-kicker">Seguimiento</p><h3>Actividad reciente</h3></div><button class="text-button" onclick="navigate('requests')">Ver solicitudes</button></div>
        ${recentBookings.length ? `<div class="provider-recent-list">${recentBookings.map(booking => `<div class="provider-recent-item"><span class="provider-recent-dot"></span><div><strong>${escapeHtml(booking.title)}</strong><p>${escapeHtml(booking.client)} · ${escapeHtml(booking.date || 'Fecha no disponible')}</p></div><div>${statusBadge(booking.status)}</div></div>`).join('')}</div>` : '<div class="empty-state"><strong>Aún no tienes solicitudes.</strong><p>Cuando un cliente solicite uno de tus servicios, aparecerá aquí.</p></div>'}
      </section>
    </div>
    <div class="provider-dashboard-lower-grid">
      <section class="card card-p provider-dashboard-panel">
        <div class="section-heading"><div><p class="section-kicker">Tu catálogo</p><h3>Mis servicios publicados</h3></div><button class="text-button" onclick="navigate('my-services')">Gestionar</button></div>
        <div class="provider-dashboard-services">
          ${providerServices.map(service => `<div class="card provider-dashboard-service">
            <img src="${dashboardServiceImage(service)}" alt="${escapeHtml(service.title)}" onerror="this.onerror=null;this.src='/assets/servi-choquib-icon.png'" loading="lazy" />
            <div class="provider-service-info"><strong>${escapeHtml(service.title)}</strong><p>${escapeHtml(service.category)} · ${COP(service.price)} ${escapeHtml(service.unit)}</p></div>
            <div class="provider-service-status">${badge(service.available ? 'Activo' : 'Inactivo', service.available ? 'green' : 'red')}</div>
          </div>`).join('') || '<div class="empty-state"><strong>Aún no has publicado servicios.</strong><p>Publica tu primer servicio para que los clientes puedan encontrarte.</p><button class="btn-primary" onclick="navigate(\'my-services\')">Publicar servicio</button></div>'}
        </div>
      </section>
      <section class="card card-p provider-dashboard-panel">
        <div class="section-heading"><div><p class="section-kicker">Indicadores</p><h3>Tu rendimiento</h3></div></div>
        <div class="provider-performance-grid">
          <div><strong>${providerBookings.length ? String(completedCount) : '0'}</strong><span>Servicios completados</span></div>
          <div><strong>${completionRate === null ? '—' : `${completionRate}%`}</strong><span>Tasa de finalización</span></div>
          <div><strong>${String(reviewCount)}</strong><span>Reseñas recibidas</span></div>
          <div><strong>${String(paidBookings.length)}</strong><span>Pagos confirmados</span></div>
        </div>
        ${providerBookings.length ? '' : '<p class="provider-performance-note">Estos indicadores se calcularán a medida que recibas solicitudes.</p>'}
      </section>
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
  const providerBookings = STATE.bookings.filter(booking => String(booking.provider_id) === String(STATE.user.id));
  const completedPayments = providerBookings.filter(booking => Number(booking.paid) === 1 && Number(booking.payment_amount) > 0);
  const totalReceived = completedPayments.reduce((sum, booking) => sum + Number(booking.payment_amount || 0), 0);
  const platformCommission = completedPayments.reduce((sum, booking) => sum + Number(booking.commission || 0), 0);
  const now = new Date();
  const monthLabels = [];
  const monthlyTotals = [];
  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const next = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    const total = completedPayments.filter(booking => {
      const paidAt = Date.parse(booking.paid_at || booking.updated_at || booking.created_at || '');
      return Number.isFinite(paidAt) && paidAt >= date.getTime() && paidAt < next.getTime();
    }).reduce((sum, booking) => sum + Number(booking.payment_amount || 0), 0);
    monthLabels.push(date.toLocaleDateString('es-CO', { month: 'short' }));
    monthlyTotals.push(total);
  }
  const max = Math.max(...monthlyTotals, 1);
  const hasMonthlyPayments = monthlyTotals.some(value => value > 0);
  return `
    <h2 style="font-family:'Outfit',sans-serif;font-size:20px;font-weight:700;margin-bottom:24px">Ingresos</h2>
    <div class="grid-3" style="margin-bottom:28px">
      ${[[COP(totalReceived), 'Total pagado', '#4ade80'], [COP(platformCommission), 'Comisión plataforma', '#f59e0b'], [COP(Math.max(0, totalReceived - platformCommission)), 'Neto recibido', '#22d3ee']]
      .map(([v, l, c]) => `<div class="stat-card"><p class="mono" style="font-size:20px;font-weight:700;color:${c};margin:0 0 4px">${v}</p><p style="font-family:'Outfit',sans-serif;font-size:13px;color:#94a3b8;margin:0">${l}</p></div>`).join('')}
    </div>
    <div class="card card-p" style="border-radius:14px">
      <p style="font-family:'Outfit',sans-serif;font-weight:600;font-size:15px;margin:0 0 20px;color:#94a3b8">Ingresos pagados · últimos 6 meses</p>
      ${hasMonthlyPayments ? `<div class="bar-chart">${monthLabels.map((month, index) => `<div class="bar-col">
        <span class="mono" style="font-size:10px;color:#64748b">${Math.round(monthlyTotals[index] / 1000)}k</span>
        <div class="bar-rect" style="height:${Math.max(3, Math.round((monthlyTotals[index] / max) * 120))}px;background:${index === monthLabels.length - 1 ? 'linear-gradient(180deg,#22d3ee,#4f46e5)' : 'rgba(34,211,238,0.22)'}"></div>
        <span style="font-family:'Outfit',sans-serif;font-size:12px;color:#64748b">${escapeHtml(month)}</span>
      </div>`).join('')}</div>` : '<div class="empty-state"><strong>Aún no hay pagos registrados.</strong><p>La gráfica aparecerá cuando existan pagos confirmados en la plataforma.</p></div>'}
    </div>`;
}

// ── ADMIN VIEWS ─────────────────────────────────────────────────
// Datos reales de /api/admin/dashboard (STATE.admin); se refrescan tras cada acción.
const adminData = () => STATE.admin || { summary: {}, users: [], services: [], bookings: [] };
const isPaidBooking = booking => Number(booking.paid) === 1 && Number(booking.payment_amount) > 0;
const adminStat = (value, label, color) => `<div class="stat-card"><p class="mono" style="font-size:22px;font-weight:700;color:${color};margin:0 0 4px">${escapeHtml(value)}</p><p style="font-family:'Outfit',sans-serif;font-size:13px;font-weight:600;color:#e2e8f0;margin:0">${escapeHtml(label)}</p></div>`;
const adminEmpty = (title, text) => `<div class="card card-p empty-state"><strong>${title}</strong><p>${text}</p></div>`;
const normalizeText = value => String(value ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function renderAdminDash() {
  const { summary, services, bookings } = adminData();
  const categories = [...new Set(services.map(service => String(service.category || '').trim()).filter(Boolean))]
    .map(category => [category, services.filter(service => service.category === category).length])
    .sort((a, b) => b[1] - a[1]);
  const roleCounts = [['Clientes', summary.clients || 0, '#818cf8'], ['Prestadores', summary.providers || 0, '#22d3ee'], ['Administradores', summary.admins || 0, '#f59e0b']];
  const maxRole = Math.max(...roleCounts.map(([, count]) => count), 1);
  const maxCategory = Math.max(...categories.map(([, count]) => count), 1);
  const recent = bookings.slice(0, 5);
  return `
    <h2 style="font-size:28px;font-weight:700;margin:0 0 4px">Panel de <span class="gradient-text">Administrador</span></h2>
    <p style="color:#64748b;margin:0 0 24px">Resumen basado en los registros reales de Servi Choquib. Valores en COP.</p>
    <div class="grid-4" style="margin-bottom:16px">
      ${adminStat(String(summary.users || 0), `Usuarios (${summary.activeUsers || 0} activos)`, '#22d3ee')}
      ${adminStat(String(summary.activeServices || 0), `Servicios activos de ${summary.services || 0}`, '#818cf8')}
      ${adminStat(String(summary.bookings || 0), `Reservas (${summary.pendingBookings || 0} pendientes)`, '#4ade80')}
      ${adminStat(COP(summary.totalPaid || 0), 'Pagos confirmados', '#22d3ee')}
    </div>
    <div class="grid-4" style="margin-bottom:28px">
      ${adminStat(COP(summary.commissionRevenue || 0), 'Comisiones (10%)', '#f59e0b')}
      ${adminStat(String(summary.paidTransactions || 0), 'Transacciones pagadas', '#4ade80')}
      ${adminStat(String(summary.unpaidBookings || 0), 'Reservas sin pago', '#f87171')}
      ${adminStat(String(summary.suspendedUsers || 0), 'Cuentas suspendidas', '#fbbf24')}
    </div>
    <div class="grid-2" style="margin-bottom:20px">
      <div class="card card-p" style="border-radius:14px">
        <p style="font-family:'Outfit',sans-serif;font-weight:600;margin:0 0 14px;color:#94a3b8">Usuarios por rol</p>
        ${roleCounts.map(([label, count, color]) => `<div style="margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="font-size:13px;color:#e2e8f0">${label}</span><span class="mono" style="font-size:12px;color:${color}">${count}</span></div>
          <div class="progress"><div class="progress-fill" style="width:${Math.round((count / maxRole) * 100)}%;background:${color}"></div></div></div>`).join('')}
      </div>
      <div class="card card-p" style="border-radius:14px">
        <p style="font-family:'Outfit',sans-serif;font-weight:600;margin:0 0 14px;color:#94a3b8">Servicios por categoría</p>
        ${categories.length ? categories.map(([category, count]) => `<div style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:13px;color:#e2e8f0">${escapeHtml(category)}</span><span class="mono" style="font-size:12px;color:#64748b">${count}</span></div>
          <div class="progress"><div class="progress-fill" style="width:${Math.round((count / maxCategory) * 100)}%"></div></div></div>`).join('') : '<div class="empty-state"><strong>Aún no hay servicios publicados.</strong></div>'}
      </div>
    </div>
    <div class="card card-p" style="border-radius:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><p style="font-family:'Outfit',sans-serif;font-weight:600;margin:0;color:#94a3b8">Últimas reservas</p><button class="btn-outline btn-sm" onclick="navigate('transactions')">Ver todas</button></div>
      ${recent.length ? recent.map(booking => `<div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:8px 0;border-top:1px solid rgba(34,211,238,0.08)"><span style="font-size:13px">${escapeHtml(booking.title)} <span style="color:#64748b">· ${escapeHtml(booking.client)}</span></span><span class="mono" style="font-size:13px;color:#22d3ee">${COP(booking.total)} ${isPaidBooking(booking) ? badge('Pagado', 'green') : badge('Sin pago', 'red')}</span></div>`).join('') : '<div class="empty-state"><strong>Aún no hay reservas.</strong></div>'}
    </div>`;
}

function setAdminFilter(key, value) {
  STATE.adminFilters[key] = value;
  renderView(STATE.activeView);
  // renderView reemplaza el DOM: devolver el foco al buscador activo.
  const input = document.getElementById(`admin-${key}`);
  if (input && input.tagName === 'INPUT') { input.focus(); input.setSelectionRange(value.length, value.length); }
}

function renderAdminUsers() {
  const rc = role => role === 'admin' ? 'amber' : role === 'prestador' ? 'cyan' : 'purple';
  const { userSearch, userRole } = STATE.adminFilters;
  const query = normalizeText(userSearch);
  const users = adminData().users.filter(user =>
    (userRole === 'todos' || user.role === userRole) &&
    (!query || normalizeText(`${user.name} ${user.email} ${user.location}`).includes(query)));
  return `
    <h2 style="font-family:'Outfit',sans-serif;font-size:20px;font-weight:700;margin-bottom:16px">Gestión de usuarios <span class="mono" style="color:#22d3ee">(${users.length})</span></h2>
    <div class="admin-toolbar">
      <input class="input" id="admin-userSearch" type="search" placeholder="Buscar por nombre, correo o ubicación" value="${escapeHtml(userSearch)}" oninput="setAdminFilter('userSearch', this.value)" />
      <select class="input" id="admin-userRole" onchange="setAdminFilter('userRole', this.value)">
        ${[['todos', 'Todos los roles'], ['cliente', 'Clientes'], ['prestador', 'Prestadores'], ['admin', 'Administradores']].map(([value, label]) => `<option value="${value}" ${userRole === value ? 'selected' : ''}>${label}</option>`).join('')}
      </select>
    </div>
    ${users.length ? `<div class="overflow-x"><table class="data-table">
      <thead><tr><th>Usuario</th><th>Email</th><th>Rol</th><th>Ubicación</th><th>Estado</th><th>Acción</th></tr></thead>
      <tbody>${users.map(user => {
        const active = user.isActive !== false;
        const isSelfOrAdmin = user.role === 'admin' || String(user.id) === String(STATE.user.id);
        return `<tr>
        <td><div style="display:flex;align-items:center;gap:10px">${avatar(user.avatar, 32, roleColor(user.role), user.profile_image)}<span style="font-family:'Outfit',sans-serif;font-weight:500">${escapeHtml(user.name)}</span></div></td>
        <td style="color:#64748b;font-size:13px">${escapeHtml(user.email)}</td>
        <td>${badge(user.role, rc(user.role))}</td>
        <td style="color:#64748b;font-size:13px">${escapeHtml(user.location || '—')}</td>
        <td>${active ? badge('Activo', 'green') : badge('Suspendido', 'red')}</td>
        <td>${isSelfOrAdmin ? '<span style="color:#64748b;font-size:12px">—</span>' : `<button class="${active ? 'btn-outline' : 'btn-primary'} btn-sm" onclick="adminSetUserStatus('${escapeHtml(user.id)}', ${!active})">${active ? 'Suspender' : 'Reactivar'}</button>`}</td>
      </tr>`; }).join('')}</tbody>
    </table></div>` : adminEmpty('Sin resultados.', 'Ajusta la búsqueda o el filtro de rol.')}`;
}

function renderAdminTransactions() {
  const { payment } = STATE.adminFilters;
  const all = adminData().bookings;
  const paid = all.filter(isPaidBooking);
  const paidVolume = paid.reduce((sum, booking) => sum + Number(booking.payment_amount || 0), 0);
  const commission = paid.reduce((sum, booking) => sum + Number(booking.commission || 0), 0);
  const pendingVolume = all.filter(booking => !isPaidBooking(booking) && booking.status !== 'cancelado').reduce((sum, booking) => sum + Number(booking.total || 0), 0);
  const bookings = all.filter(booking => payment === 'todos' || (payment === 'pagado' ? isPaidBooking(booking) : !isPaidBooking(booking)));
  const paymentBadge = booking => isPaidBooking(booking) ? badge('Pagado', 'green') : booking.payment_status === 'revisar' ? badge('Revisar monto', 'amber') : booking.status === 'cancelado' ? badge('Cancelada', 'red') : badge(booking.payment_status === 'pendiente' ? 'Pago en curso' : 'Sin pago', 'red');
  return `
    <h2 style="font-family:'Outfit',sans-serif;font-size:20px;font-weight:700;margin-bottom:20px">Control de transacciones</h2>
    <div class="grid-4" style="margin-bottom:20px">
      ${adminStat(COP(paidVolume), 'Pagos confirmados', '#22d3ee')}
      ${adminStat(COP(commission), 'Comisiones confirmadas', '#f59e0b')}
      ${adminStat(COP(pendingVolume), 'Por cobrar', '#f87171')}
      ${adminStat(String(paid.length), 'Pagos registrados', '#4ade80')}
    </div>
    <div class="admin-toolbar">
      <select class="input" id="admin-payment" onchange="setAdminFilter('payment', this.value)">
        ${[['todos', 'Todas las reservas'], ['pagado', 'Solo pagadas'], ['sin_pago', 'Sin pago confirmado']].map(([value, label]) => `<option value="${value}" ${payment === value ? 'selected' : ''}>${label}</option>`).join('')}
      </select>
    </div>
    ${bookings.length ? `<div class="overflow-x"><table class="data-table">
      <thead><tr><th>ID</th><th>Servicio</th><th>Cliente</th><th>Prestador</th><th>Valor</th><th>Comisión</th><th>Reserva</th><th>Pago</th></tr></thead>
      <tbody>${bookings.map(booking => `<tr>
        <td class="mono" style="font-size:12px;color:#64748b">${escapeHtml(String(booking.id).slice(0, 10)).toUpperCase()}</td>
        <td style="font-family:'Outfit',sans-serif;font-weight:500">${escapeHtml(booking.title)}</td>
        <td style="color:#94a3b8;font-size:13px">${escapeHtml(booking.client)}</td>
        <td style="color:#94a3b8;font-size:13px">${escapeHtml(booking.provider)}</td>
        <td class="mono" style="color:#22d3ee">${COP(booking.total)}</td>
        <td class="mono" style="color:#f59e0b">${isPaidBooking(booking) ? COP(booking.commission) : '—'}</td>
        <td>${statusBadge(booking.status)}</td>
        <td>${paymentBadge(booking)}</td>
      </tr>`).join('')}</tbody>
    </table></div>` : adminEmpty('Sin reservas para este filtro.', 'Las reservas aparecerán aquí cuando un cliente solicite un servicio.')}`;
}

function renderAdminServices() {
  const { serviceSearch, serviceState } = STATE.adminFilters;
  const query = normalizeText(serviceSearch);
  const services = adminData().services.filter(service =>
    (serviceState === 'todos' || (serviceState === 'activos') === Boolean(service.available)) &&
    (!query || normalizeText(`${service.title} ${service.provider} ${service.category}`).includes(query)));
  return `
    <h2 style="font-family:'Outfit',sans-serif;font-size:20px;font-weight:700;margin-bottom:16px">Servicios publicados <span class="mono" style="color:#22d3ee">(${services.length})</span></h2>
    <div class="admin-toolbar">
      <input class="input" id="admin-serviceSearch" type="search" placeholder="Buscar por título, prestador o categoría" value="${escapeHtml(serviceSearch)}" oninput="setAdminFilter('serviceSearch', this.value)" />
      <select class="input" id="admin-serviceState" onchange="setAdminFilter('serviceState', this.value)">
        ${[['todos', 'Todos'], ['activos', 'Activos'], ['inactivos', 'Inactivos']].map(([value, label]) => `<option value="${value}" ${serviceState === value ? 'selected' : ''}>${label}</option>`).join('')}
      </select>
    </div>
    <div style="display:flex;flex-direction:column;gap:10px">
      ${services.map(service => `
        <div class="card" style="padding:16px;border-radius:12px;display:flex;align-items:center;gap:14px;flex-wrap:wrap">
          <img src="${dashboardServiceImage(service)}" onerror="this.onerror=null;this.src='/assets/servi-choquib-icon.png'" alt="${escapeHtml(service.title)}" style="width:52px;height:52px;border-radius:8px;object-fit:cover" loading="lazy" />
          <div style="flex:1;min-width:180px"><p style="font-family:'Outfit',sans-serif;font-weight:600;margin:0 0 2px">${escapeHtml(service.title)}</p><p style="font-size:12px;color:#64748b;margin:0">${escapeHtml(service.provider)} · ${escapeHtml(service.category)} · ${COP(service.price)}</p></div>
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">${badge(service.available ? 'Activo' : 'Inactivo', service.available ? 'green' : 'red')}
            <button class="${service.available ? 'btn-outline' : 'btn-primary'} btn-sm" onclick="adminSetServiceStatus('${escapeHtml(service.id)}', ${!service.available})">${service.available ? 'Desactivar' : 'Activar'}</button></div>
        </div>`).join('') || adminEmpty('Sin resultados.', 'Ajusta la búsqueda o el filtro de estado.')}
    </div>`;
}

async function adminAction(path, body, confirmText) {
  if (confirmText && !confirm(confirmText)) return;
  try {
    await apiRequest(path, { method: 'PATCH', body: JSON.stringify(body) });
    STATE.admin = await apiRequest('/admin/dashboard');
    renderView(STATE.activeView);
  } catch (error) {
    alert(error.message);
  }
}
const adminSetUserStatus = (id, isActive) => adminAction(`/admin/users/${encodeURIComponent(id)}/status`, { isActive },
  isActive ? null : 'La cuenta no podrá iniciar sesión hasta ser reactivada. ¿Suspender?');
const adminSetServiceStatus = (id, available) => adminAction(`/admin/services/${encodeURIComponent(id)}/status`, { available },
  available ? null : 'El servicio dejará de ser reservable. ¿Desactivar?');

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

