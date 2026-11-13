function renderProviderDash() {
  return `
    <h2 style="font-size:28px;font-weight:700;margin:0 0 4px">Panel de <span class="gradient-text">Prestador</span></h2>
    <p style="color:#64748b;margin:0 0 24px">Bienvenido, ${escapeHtml(STATE.user.name)}. Gestiona tus servicios aquí.</p>
    <div class="grid-4" style="margin-bottom:28px">
      ${[['3', 'Servicios activos', '#22d3ee'], ['7', 'Solicitudes hoy', '#818cf8'], ['$680k COP', 'Ingresos este mes', '#4ade80'], ['4.7 ★', 'Calificación', '#f59e0b']]
      .map(([v, l, c]) => `<div class="stat-card"><p class="mono" style="font-size:22px;font-weight:700;color:${c};margin:0 0 4px">${v}</p><p style="font-family:'Outfit',sans-serif;font-size:13px;font-weight:600;color:#94a3b8;margin:0">${l}</p></div>`).join('')}
    </div>
    <h3 style="font-family:'Outfit',sans-serif;font-size:16px;font-weight:600;margin-bottom:14px;color:#94a3b8">Mis servicios publicados</h3>
    <div style="display:flex;flex-direction:column;gap:10px">
      ${SERVICES.slice(0, 3).map(s => `
        <div class="card" style="padding:16px;border-radius:12px;display:flex;align-items:center;gap:16px">
          <img src="https://images.unsplash.com/${s.img}?w=80&h=80&fit=crop&auto=format" alt="${escapeHtml(s.title)}" style="width:60px;height:60px;border-radius:10px;object-fit:cover" loading="lazy" />
          <div style="flex:1"><p style="font-family:'Outfit',sans-serif;font-weight:600;margin:0 0 2px">${escapeHtml(s.title)}</p><p style="font-size:12px;color:#64748b;margin:0">${escapeHtml(s.category)} · ${COP(s.price)} ${escapeHtml(s.unit)}</p></div>
          <div style="display:flex;gap:8px;align-items:center">${stars(s.rating)}<span style="font-size:12px;color:#64748b">${s.rating}</span>${badge(s.available ? 'Activo' : 'Inactivo', s.available ? 'green' : 'red')}</div>
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
function adminMoney(value) {
  return COP(Number(value || 0));
}

async function loadAdminData(view) {
  if (ADMIN_DATA.loading) return;
  ADMIN_DATA.loading = true;
  try {
    const data = await apiRequest('/admin/dashboard');
    Object.assign(ADMIN_DATA, data, { loaded: true });
    if (STATE.user?.role === 'admin' && STATE.activeView === view) {
      const renderers = {
        dashboard: renderAdminDash,
        users: renderAdminUsers,
        transactions: renderAdminTransactions,
        'services-admin': renderAdminServices,
        'bookings-admin': renderAdminBookings,
      };
      const content = document.getElementById('main-content');
      if (content && renderers[view]) {
        content.innerHTML = `<div class="page fade-in">${renderers[view]()}</div>`;
        refreshIcons();
      }
    }
  } catch (error) {
    const content = document.getElementById('main-content');
    if (content && STATE.activeView === view) {
      content.innerHTML = `<div class="page"><div class="card card-p"><h3>No se pudo cargar el panel administrativo</h3><p style="color:#94a3b8">${escapeHtml(error.message)}</p><button class="btn-primary" onclick="loadAdminData('${view}')">Reintentar</button></div></div>`;
    }
  } finally {
    ADMIN_DATA.loading = false;
  }
}

async function adminSetUserStatus(id, isActive) {
  try {
    await apiRequest(`/admin/users/${encodeURIComponent(id)}/status`, {
      method: 'PATCH', body: JSON.stringify({ isActive }),
    });
    ADMIN_DATA.loaded = false;
    await loadAdminData('users');
  } catch (error) { alert(error.message); }
}

async function adminSetServiceStatus(id, available) {
  try {
    await apiRequest(`/admin/services/${encodeURIComponent(id)}/status`, {
      method: 'PATCH', body: JSON.stringify({ available }),
    });
    ADMIN_DATA.loaded = false;
    await loadAdminData('services-admin');
  } catch (error) { alert(error.message); }
}

function adminStat(value, label, note, iconName) {
  return `<article class="stat-card" style="min-width:0"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px"><div><p class="mono" style="font-size:25px;font-weight:700;color:#22d3ee;margin:0 0 5px">${value}</p><p style="font-weight:600;color:#e2e8f0;margin:0">${label}</p><p style="font-size:12px;color:#64748b;margin:5px 0 0">${note}</p></div><span style="color:#22d3ee;opacity:.8">${icon(iconName)}</span></div></article>`;
}

function renderAdminDash() {
  const d = ADMIN_DATA.summary || {};
  return `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;margin-bottom:24px">
      <div><h2 style="font-size:28px;font-weight:700;margin:0 0 4px">Centro de <span class="gradient-text">control</span></h2>
      <p style="color:#64748b;margin:0">Indicadores calculados con la información registrada en Servi Choquib.</p></div>
      <button class="btn-ghost" onclick="ADMIN_DATA.loaded=false;loadAdminData('dashboard')">Actualizar datos</button>
    </div>
    <div class="grid-4" style="margin-bottom:18px">
      ${adminStat(d.users ?? '—','Usuarios registrados',`${d.clients ?? 0} clientes · ${d.providers ?? 0} prestadores`,'users')}
      ${adminStat(d.activeServices ?? '—','Servicios activos',`${d.services ?? 0} publicaciones en total`,'grid')}
      ${adminStat(d.bookings ?? '—','Contrataciones',`${d.pendingBookings ?? 0} pendientes · ${d.completedBookings ?? 0} finalizadas`,'briefcase')}
      ${adminStat(adminMoney(d.commissionRevenue),'Comisiones verificadas',`${d.paidTransactions ?? 0} pagos registrados`,'wallet')}
    </div>
    <div class="grid-2">
      <section class="card card-p"><h3 style="margin:0 0 16px;font-size:16px">Usuarios por tipo de cuenta</h3>
        ${[['Clientes',d.clients,'#818cf8'],['Prestadores',d.providers,'#22d3ee'],['Administradores',d.admins,'#f59e0b']].map(([label,value,color])=>`<div style="margin:14px 0"><div style="display:flex;justify-content:space-between;margin-bottom:7px"><span>${label}</span><strong>${value ?? 0}</strong></div><div class="progress"><div class="progress-fill" style="width:${d.users ? Math.min(100,(Number(value||0)/d.users)*100) : 0}%;background:${color}"></div></div></div>`).join('')}
      </section>
      <section class="card card-p"><h3 style="margin:0 0 16px;font-size:16px">Estado de la operación</h3>
        ${[['Solicitudes pendientes',d.pendingBookings],['Trabajos finalizados',d.completedBookings],['Pagos registrados',d.paidTransactions],['Cuentas activas',d.activeUsers]].map(([label,value])=>`<div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid rgba(148,163,184,.12)"><span style="color:#94a3b8">${label}</span><strong>${value ?? 0}</strong></div>`).join('')}
      </section>
    </div>
    <p style="font-size:12px;color:#64748b;margin-top:16px">Los valores de pagos y comisiones solo incluyen transacciones marcadas como pagadas en la base de datos. PayU todavía no está integrado.</p>`;
}

function renderAdminUsers() {
  const users = ADMIN_DATA.users || [];
  const rc = role => role === 'admin' ? 'amber' : role === 'prestador' ? 'cyan' : 'purple';
  return `<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:20px">
    <div><h2 style="font-size:22px;margin:0 0 4px">Gestión de usuarios</h2><p style="color:#64748b;margin:0">${users.length} cuentas registradas</p></div>
    <input class="input" style="max-width:280px" placeholder="Buscar por nombre o correo..." oninput="filterAdminUsers(this.value)" />
  </div>
  <div class="overflow-x"><table class="data-table"><thead><tr><th>Usuario</th><th>Correo</th><th>Rol</th><th>Ubicación</th><th>Correo verificado</th><th>Estado</th><th>Acción</th></tr></thead>
  <tbody id="admin-users-body">${users.map(adminUserRow).join('') || '<tr><td colspan="7">No hay usuarios registrados.</td></tr>'}</tbody></table></div>`;
}

function adminUserRow(user) {
  const active = user.isActive !== false;
  return `<tr data-admin-user="${escapeHtml(`${user.name} ${user.email}`.toLowerCase())}">
    <td>${avatar(user.avatar,32,roleColor(user.role),user.profile_image)} <strong>${escapeHtml(user.name)}</strong></td>
    <td>${escapeHtml(user.email)}</td><td>${badge(user.role, user.role==='admin'?'amber':user.role==='prestador'?'cyan':'purple')}</td>
    <td>${escapeHtml(user.location || '—')}</td><td>${user.emailVerified ? badge('Verificado','green') : badge('Pendiente','amber')}</td>
    <td>${badge(active?'Activo':'Suspendido',active?'green':'red')}</td>
    <td>${user.role === 'admin' ? '<span style="color:#64748b">Protegido</span>' : `<button class="${active?'btn-danger':'btn-primary'} btn-sm" onclick="adminSetUserStatus('${escapeHtml(user.id)}',${!active})">${active?'Suspender':'Reactivar'}</button>`}</td>
  </tr>`;
}

function filterAdminUsers(value) {
  const query = String(value || '').toLowerCase().trim();
  document.querySelectorAll('[data-admin-user]').forEach(row => {
    row.style.display = row.dataset.adminUser.includes(query) ? '' : 'none';
  });
}

function renderAdminTransactions() {
  const paid = (ADMIN_DATA.bookings || []).filter(b => Number(b.paid) === 1 && Number(b.payment_amount) > 0);
  const total = paid.reduce((sum,b)=>sum+Number(b.payment_amount||0),0);
  const commission = paid.reduce((sum,b)=>sum+Number(b.commission||0),0);
  return `<h2 style="font-size:22px;margin:0 0 4px">Control de transacciones</h2><p style="color:#64748b;margin:0 0 20px">Solo se muestran pagos registrados; no se simulan aprobaciones de pasarela.</p>
    <div class="grid-3" style="margin-bottom:22px">${adminStat(paid.length,'Pagos registrados','Transacciones marcadas como pagadas','check-circle')}${adminStat(adminMoney(total),'Valor pagado','COP registrados','wallet')}${adminStat(adminMoney(commission),'Comisión registrada','COP acumulados','trending-up')}</div>
    <div class="overflow-x"><table class="data-table"><thead><tr><th>Contratación</th><th>Servicio</th><th>Cliente</th><th>Prestador</th><th>Valor</th><th>Comisión</th><th>Fecha</th></tr></thead><tbody>
    ${paid.map(b=>`<tr><td>${escapeHtml(b.id)}</td><td>${escapeHtml(b.title)}</td><td>${escapeHtml(b.client)}</td><td>${escapeHtml(b.provider)}</td><td>${adminMoney(b.payment_amount)}</td><td>${adminMoney(b.commission)}</td><td>${escapeHtml(b.paid_at || b.date || '—')}</td></tr>`).join('') || '<tr><td colspan="7">Todavía no hay pagos verificados.</td></tr>'}
    </tbody></table></div>`;
}

function renderAdminServices() {
  const services = ADMIN_DATA.services || [];
  return `<h2 style="font-size:22px;margin:0 0 4px">Moderación de servicios</h2><p style="color:#64748b;margin:0 0 20px">${services.length} publicaciones registradas. Puedes activar o desactivar su visibilidad.</p>
    <div style="display:flex;flex-direction:column;gap:10px">${services.map(service=>`<article class="card" style="padding:16px;border-radius:12px;display:flex;align-items:center;gap:14px;flex-wrap:wrap">
      <div style="flex:1;min-width:220px"><strong>${escapeHtml(service.title)}</strong><p style="margin:5px 0;color:#94a3b8;font-size:13px">${escapeHtml(service.provider)} · ${escapeHtml(service.category)} · ${adminMoney(service.price)}</p><small style="color:#64748b">${escapeHtml(service.location || 'Sin ubicación')}</small></div>
      ${badge(service.available?'Publicado':'Oculto',service.available?'green':'red')}
      <button class="${service.available?'btn-danger':'btn-primary'} btn-sm" onclick="adminSetServiceStatus('${escapeHtml(service.id)}',${!service.available})">${service.available?'Desactivar':'Activar'}</button>
    </article>`).join('') || '<div class="card card-p">No hay servicios publicados.</div>'}</div>`;
}

function renderAdminBookings() {
  const bookings = ADMIN_DATA.bookings || [];
  return `<h2 style="font-size:22px;margin:0 0 4px">Seguimiento de contrataciones</h2><p style="color:#64748b;margin:0 0 20px">Vista de supervisión; los estados operativos se modifican desde el flujo de cliente y prestador.</p>
  <div class="overflow-x"><table class="data-table"><thead><tr><th>Servicio</th><th>Cliente</th><th>Prestador</th><th>Fecha</th><th>Valor</th><th>Estado</th><th>Pago</th></tr></thead><tbody>
  ${bookings.map(b=>`<tr><td>${escapeHtml(b.title)}</td><td>${escapeHtml(b.client)}</td><td>${escapeHtml(b.provider)}</td><td>${escapeHtml(b.date)}</td><td>${adminMoney(b.total)}</td><td>${statusBadge(b.status)}</td><td>${Number(b.paid)===1?badge('Pagado','green'):badge('Sin pago','amber')}</td></tr>`).join('') || '<tr><td colspan="7">No hay contrataciones registradas.</td></tr>'}
  </tbody></table></div>`;
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

