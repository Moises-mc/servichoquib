function readProfileImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve('');
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('No se pudo leer la imagen de perfil.'));
    reader.readAsDataURL(file);
  });
}

async function saveProfile() {
  const name = document.getElementById('profile-name').value.trim();
  const location = document.getElementById('profile-location').value.trim();
  const phone = document.getElementById('profile-phone').value.trim();
  const bio = document.getElementById('profile-bio').value.trim();
  const specialty = document.getElementById('profile-specialty').value.trim();
  const availability = document.getElementById('profile-availability').value;
  const imageInput = document.getElementById('profile-image-input');
  let profileImage = STATE.user.profile_image || '';

  try {
    if (imageInput && imageInput.files && imageInput.files[0]) {
      const imageFile = imageInput.files[0];
      const allowedImageTypes = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
      if (!allowedImageTypes.has(String(imageFile.type).toLowerCase())) {
        throw new Error('La foto debe ser PNG, JPG, WEBP o GIF.');
      }
      if (imageFile.size > 1.2 * 1024 * 1024) {
        throw new Error('La foto de perfil no puede superar 1,2 MB.');
      }
      profileImage = await readProfileImageFile(imageFile);
    }

    const data = await apiRequest('/profile', {
      method: 'PUT',
      body: JSON.stringify({ name, location, phone, bio, specialty, availability, profile_image: profileImage })
    });
    STATE.user = data.user;
    buildSidebar();
    navigate('profile');
  } catch (error) {
    showError(error.message, 'profile-error');
  }
}

async function restoreSession() {
  if (!STATE.token) return;
  try {
    const data = await apiRequest('/me');
    if (data.user) loginUser(data.user, STATE.token);
  } catch {
    localStorage.removeItem('servilocal_token');
    STATE.token = null;
  }
}

restoreSession();


async function requestProfilePhoneCode() {
  const phone = document.getElementById('profile-phone').value.trim();
  if (phone !== String(STATE.user.phone || '')) { showError('Guarda primero el número telefónico y luego solicita el código.', 'profile-error'); return; }
  try { const result = await apiRequest('/phone/verify/request', { method: 'POST' }); const el=document.getElementById('phone-verify-message'); el.textContent=result.message; el.classList.remove('hidden'); el.style.color='#4ade80'; }
  catch(error) { showError(error.message, 'profile-error'); }
}

async function confirmProfilePhoneCode() {
  const code = document.getElementById('profile-phone-code').value.trim();
  try { const result=await apiRequest('/phone/verify', { method:'POST', body:JSON.stringify({code}) }); STATE.user=result.user; navigate('profile'); }
  catch(error) { showError(error.message, 'profile-error'); }
}
