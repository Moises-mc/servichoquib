function showError(message, elementId) {
  const element = document.getElementById(elementId);
  if (!element) return;
  element.textContent = message;
  element.classList.remove('hidden');
}

// ── Auth logic ─────────────────────────────────────────────────
function switchAuthTab(tab, el) {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(b => b.classList.remove('active'));
  const selected = el || [...tabs].find(b => b.textContent.toLowerCase().includes(tab === 'login' ? 'iniciar sesión' : 'registrarse'));
  if (selected) selected.classList.add('active');
  document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
  document.getElementById('register-form').classList.toggle('hidden', tab !== 'register');
  document.getElementById('recover-form').classList.add('hidden');
}

function selectRole(r) {
  STATE.selectedRole = r;
  document.getElementById('role-cliente').classList.toggle('active', r === 'cliente');
  document.getElementById('role-prestador').classList.toggle('active', r === 'prestador');
}

function showLogin() {
  document.getElementById('landing-screen').classList.add('hidden');
  document.getElementById('auth-screen').classList.remove('hidden');
  document.getElementById('recover-form').classList.add('hidden');
  switchAuthTab('login');
  document.getElementById('login-email').focus();
}

function openRecoveryForm() {
  document.getElementById('login-form').classList.add('hidden');
  document.getElementById('recover-form').classList.remove('hidden');
  document.getElementById('recover-identifier').focus();
}

function showRecoveryMessage(message, isError = false) {
  const error = document.getElementById('recover-error');
  const success = document.getElementById('recover-success');
  error.classList.toggle('hidden', !isError);
  success.classList.toggle('hidden', isError);
  if (isError) {
    error.textContent = message;
  } else {
    success.textContent = message;
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const identifier = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-pass').value;
  const err = document.getElementById('login-error');
  err.classList.add('hidden');
  if (!identifier || !pass) { err.textContent = 'Completa todos los campos.'; err.classList.remove('hidden'); return; }

  try {
    const data = await apiRequest('/login', { method: 'POST', body: JSON.stringify({ identifier, password: pass }) });
    loginUser(data.user, data.token);
    return;
  } catch (error) {
    const fallbackUser = getDemoUser(identifier, pass);
    if (fallbackUser) {
      loginUser(fallbackUser, 'demo-token');
      return;
    }
    const message = error.message === 'Failed to fetch'
      ? 'No hay servidor activo. Ejecuta start-backend.ps1 o inicia el backend con npm start dentro de la carpeta server.'
      : error.message;
    showError(message, 'login-error');
  }
}

async function requestPasswordCode() {
  const identifier = document.getElementById('recover-identifier').value.trim();
  if (!identifier) {
    showRecoveryMessage('Escribe tu correo o teléfono para recibir el código.', true);
    return;
  }

  try {
    const result = await apiRequest('/password/forgot', {
      method: 'POST',
      body: JSON.stringify({ identifier })
    });
    showRecoveryMessage(result.message || 'Se envió un código de recuperación a tu correo.', false);
  } catch (error) {
    showRecoveryMessage(error.message, true);
  }
}

async function handlePasswordRecovery(e) {
  e.preventDefault();
  const identifier = document.getElementById('recover-identifier').value.trim();
  const code = document.getElementById('recover-code').value.trim();
  const newPassword = document.getElementById('recover-pass').value.trim();
  showRecoveryMessage('', false);

  if (!identifier || !code || !newPassword) {
    showRecoveryMessage('Completa correo, código y nueva contraseña.', true);
    return;
  }

  try {
    const result = await apiRequest('/password/reset', {
      method: 'POST',
      body: JSON.stringify({ identifier, code, new_password: newPassword })
    });
    showRecoveryMessage(result.message || 'Contraseña actualizada correctamente.', false);
    setTimeout(() => {
      document.getElementById('recover-form').classList.add('hidden');
      document.getElementById('login-form').classList.remove('hidden');
      document.getElementById('login-email').focus();
    }, 1000);
  } catch (error) {
    showRecoveryMessage(error.message, true);
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const pass = document.getElementById('reg-pass').value;
  const accepted = document.getElementById('accept-terms').checked;
  const err = document.getElementById('reg-error');
  err.classList.add('hidden');
  if (!name || !email || !pass) { err.textContent = 'Completa todos los campos.'; err.classList.remove('hidden'); return; }
  if (!accepted) { err.textContent = 'Debes aceptar los términos y condiciones.'; err.classList.remove('hidden'); return; }
  try {
    const data = await apiRequest('/register', { method: 'POST', body: JSON.stringify({ name, email, phone, password: pass, role: STATE.selectedRole }) });
    loginUser(data.user, data.token, true);
  } catch (error) {
    showError(error.message, 'reg-error');
  }
}

async function loginUser(user, token, completeProfile = false) {
  STATE.user = user;
  STATE.token = token;
  localStorage.setItem('servilocal_token', token);
  STATE.activeView = 'dashboard';
  document.getElementById('landing-screen').classList.add('hidden');
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  try { await loadRemoteData(); } catch (error) { console.error(error); }
  buildSidebar();
  navigate(completeProfile ? 'profile' : 'dashboard');
}

function logout() {
  STATE.user = null;
  STATE.token = null;
  localStorage.removeItem('servilocal_token');
  document.getElementById('app').classList.add('hidden');
  document.getElementById('auth-screen').classList.remove('hidden');
  document.getElementById('landing-screen').classList.add('hidden');
}

// ── Sidebar ────────────────────────────────────────────────────


// Exponer explícitamente las acciones usadas por los atributos onclick del HTML.
window.showLogin = showLogin;
window.switchAuthTab = switchAuthTab;
window.selectRole = selectRole;
