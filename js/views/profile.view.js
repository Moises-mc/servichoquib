// Plantilla de presentación del perfil.
function renderProfile() {
  return `
    <div style="max-width:820px">
      <h2 style="font-family:'Outfit',sans-serif;font-size:24px;font-weight:700;margin:0 0 6px">Completa tu perfil</h2>
      <p style="color:#64748b;margin:0 0 24px">Mantén actualizada tu información para que otros usuarios puedan reconocerte y contactarte.</p>
      <div class="profile-layout">
      <div class="card card-p profile-card">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:24px">${avatar(STATE.user.avatar, 56, roleColor(STATE.user.role), STATE.user.profile_image)}<div><p style="font-family:'Outfit',sans-serif;font-weight:600;margin:0">${escapeHtml(STATE.user.email)}</p><p style="color:#64748b;font-size:13px;margin:4px 0;text-transform:capitalize">${escapeHtml(STATE.user.role)}</p></div></div>
        <div class="form-group">
          <label class="form-label">Foto de perfil</label>
          <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
            <input class="input" id="profile-image-input" type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
            ${safeImageUrl(STATE.user.profile_image) ? `<img src="${safeImageUrl(STATE.user.profile_image)}" alt="Foto de perfil" style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:1px solid rgba(34,211,238,0.3)" />` : ''}
          </div>
        </div>
        <div class="form-group"><label class="form-label">Nombre completo</label><input class="input" id="profile-name" value="${escapeHtml(STATE.user.name || '')}" /></div>
        <div class="form-group"><label class="form-label">Ubicación</label><input class="input" id="profile-location" value="${escapeHtml(STATE.user.location || '')}" placeholder="Barrio o ciudad" /></div>
        <div class="form-group"><label class="form-label">Teléfono</label><input class="input" id="profile-phone" value="${escapeHtml(STATE.user.phone || '')}" placeholder="300 000 0000" /></div>
        <div class="form-group"><p style="font-size:13px;color:#94a3b8;margin:0 0 8px">Estado del teléfono: <strong>${STATE.user.phoneVerified ? 'Verificado' : 'Sin verificar'}</strong></p><button type="button" class="btn-outline" onclick="requestProfilePhoneCode()">Enviar código por SMS</button><div style="display:flex;gap:8px;margin-top:8px"><input class="input" id="profile-phone-code" inputmode="numeric" maxlength="6" placeholder="Código de 6 dígitos" /><button type="button" class="btn-outline" onclick="confirmProfilePhoneCode()">Verificar</button></div><p id="phone-verify-message" class="hidden" style="font-size:13px;margin-top:8px"></p></div>
        <div class="form-group"><label class="form-label">Especialidad</label><input class="input" id="profile-specialty" value="${escapeHtml(STATE.user.specialty || '')}" placeholder="Ej: Barbería, diseño, reparación..." /></div>
        <div class="form-group"><label class="form-label">Sobre mí</label><textarea class="input" id="profile-bio" rows="4" placeholder="Cuéntale a la comunidad quién eres y qué ofreces">${escapeHtml(STATE.user.bio || '')}</textarea></div>
        <div class="form-group"><label class="form-label">Disponibilidad</label><select class="input" id="profile-availability"><option ${STATE.user.availability === 'Disponible para solicitudes' ? 'selected' : ''}>Disponible para solicitudes</option><option ${STATE.user.availability === 'Solo con cita previa' ? 'selected' : ''}>Solo con cita previa</option><option ${STATE.user.availability === 'No disponible temporalmente' ? 'selected' : ''}>No disponible temporalmente</option></select></div>
        <p id="profile-error" class="hidden" style="color:#f87171;font-size:13px;margin-bottom:12px"></p>
        <button class="btn-primary" onclick="saveProfile()">Guardar información</button>
      </div>
      <div class="card card-p profile-preview"><p class="profile-preview-label">Vista pública</p>${avatar(STATE.user.avatar, 72, roleColor(STATE.user.role), STATE.user.profile_image)}<h3>${escapeHtml(STATE.user.name)}</h3><p class="profile-role">${escapeHtml(STATE.user.role)}</p><p class="profile-bio">${escapeHtml(STATE.user.bio || 'Tu presentación aparecerá aquí.')}</p><div class="divider"></div><p><strong>Especialidad</strong><br>${escapeHtml(STATE.user.specialty || 'Agrega una especialidad')}</p><p><strong>Ubicación</strong><br>${escapeHtml(STATE.user.location || 'Agrega tu ubicación')}</p><p><strong>Disponibilidad</strong><br>${escapeHtml(STATE.user.availability || 'Disponible para solicitudes')}</p></div>
      </div>
    </div>`;
}
