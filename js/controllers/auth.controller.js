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
  clearRecoveryMessages();
  setRecoveryStep(1);
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
  } catch (error) {
    const message = error.message === 'Failed to fetch'
      ? 'No hay conexión con el servidor. Verifica que el backend esté activo.'
      : error.message;
    showError(message, 'login-error');
  }
}

function setRecoveryStep(step) {
  const requestStep = document.getElementById('recover-step-request');
  const verifyStep = document.getElementById('recover-step-verify');
  requestStep?.classList.toggle('hidden', step !== 1);
  verifyStep?.classList.toggle('hidden', step !== 2);
  if (step === 2) document.getElementById('recover-code')?.focus();
  else document.getElementById('recover-identifier')?.focus();
}

function clearRecoveryMessages() {
  ['recover-error', 'recover-success', 'recover-error-step2', 'recover-success-step2'].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = '';
      element.classList.add('hidden');
    }
  });
}

function recoveryMessage(message, isError = false, step = 1) {
  const id = isError
    ? (step === 2 ? 'recover-error-step2' : 'recover-error')
    : (step === 2 ? 'recover-success-step2' : 'recover-success');
  const element = document.getElementById(id);
  if (!element) return;
  element.textContent = message;
  element.classList.remove('hidden');
}

async function requestPasswordCode() {
  const identifier = document.getElementById('recover-identifier').value.trim().toLowerCase();
  const method = document.getElementById('recover-method')?.value || 'email';
  const button = document.getElementById('recover-send-code');
  clearRecoveryMessages();

  if (!identifier) {
    recoveryMessage('Escribe el correo asociado a tu cuenta.', true);
    return;
  }
  if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(identifier)) {
    recoveryMessage('Ingresa un correo electrónico válido.', true);
    return;
  }

  button.disabled = true;
  button.textContent = 'Enviando código…';
  try {
    const result = await apiRequest('/password/forgot', {
      method: 'POST',
      body: JSON.stringify({ identifier, method })
    });
    // El backend usa una respuesta genérica para no revelar si el correo está registrado.
    document.getElementById('recover-destination').textContent =
      method === 'sms'
        ? 'Si tu cuenta tiene un teléfono verificado, recibirás allí el código. Revisa también el correo si no tienes SMS habilitado.'
        : `Si ${identifier} está asociado a una cuenta, recibirás allí el código. Revisa la bandeja de entrada y spam.`;
    setRecoveryStep(2);
    recoveryMessage(result.message || 'Solicitud procesada. Revisa tu correo.', false, 2);
  } catch (error) {
    recoveryMessage(error.message || 'No fue posible enviar el código. Inténtalo nuevamente.', true);
  } finally {
    button.disabled = false;
    button.textContent = 'Enviar código';
  }
}

async function resendPasswordCode() {
  setRecoveryStep(1);
  await requestPasswordCode();
}

function backToRecoveryRequest() {
  clearRecoveryMessages();
  setRecoveryStep(1);
}

async function handlePasswordRecovery(e) {
  e.preventDefault();
  const identifier = document.getElementById('recover-identifier').value.trim().toLowerCase();
  const code = document.getElementById('recover-code').value.trim();
  const newPassword = document.getElementById('recover-pass').value;
  const confirmation = document.getElementById('recover-pass-confirm').value;
  const button = document.getElementById('recover-reset-button');
  clearRecoveryMessages();

  if (!/^\\d{6}$/.test(code)) {
    recoveryMessage('Ingresa el código de 6 dígitos que recibiste.', true, 2);
    return;
  }
  if (newPassword.length < 8) {
    recoveryMessage('La contraseña debe tener al menos 8 caracteres.', true, 2);
    return;
  }
  if (newPassword !== confirmation) {
    recoveryMessage('Las contraseñas no coinciden.', true, 2);
    return;
  }

  button.disabled = true;
  button.textContent = 'Actualizando contraseña…';
  try {
    const result = await apiRequest('/password/reset', {
      method: 'POST',
      body: JSON.stringify({ identifier, code, new_password: newPassword })
    });
    recoveryMessage(result.message || 'Contraseña actualizada correctamente.', false, 2);
    setTimeout(() => {
      document.getElementById('recover-form').classList.add('hidden');
      document.getElementById('login-form').classList.remove('hidden');
      document.getElementById('login-email').value = identifier;
      document.getElementById('login-pass').focus();
    }, 1200);
  } catch (error) {
    recoveryMessage(error.message || 'No fue posible cambiar la contraseña.', true, 2);
  } finally {
    button.disabled = false;
    button.textContent = 'Restablecer contraseña';
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
    document.getElementById('verify-email').value = email;
    document.getElementById('register-code-step').classList.remove('hidden');
    showError(data.message || 'Te enviamos un código a tu correo.', 'reg-error');
  } catch (error) {
    showError(error.message, 'reg-error');
  }
}


async function handleEmailVerification(e) {
  e.preventDefault();
  const email = document.getElementById('verify-email').value.trim();
  const code = document.getElementById('verify-code').value.trim();
  try {
    const data = await apiRequest('/register/verify', { method: 'POST', body: JSON.stringify({ email, code }) });
    loginUser(data.user, data.token, true);
  } catch (error) { showError(error.message, 'verify-error'); }
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
