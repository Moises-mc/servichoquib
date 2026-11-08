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
