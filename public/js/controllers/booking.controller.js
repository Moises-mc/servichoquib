function openServiceDetail(id) {
  const s = findServiceById(id);
  if (!s) return;
  const box = document.getElementById('modal-service-box');
  box.innerHTML = `
    <div style="height:200px;overflow:hidden;position:relative;border-radius:16px 16px 0 0;background:#111b54">
      <img src="https://images.unsplash.com/${s.img}?w=560&h=220&fit=crop&auto=format" alt="${escapeHtml(s.title)}" style="width:100%;height:100%;object-fit:contain;opacity:0.95" />
      <button onclick="closeModal('modal-service')" style="position:absolute;top:14px;right:14px;background:rgba(10,15,46,0.8);border:1px solid rgba(34,211,238,0.2);color:#e2e8f0;border-radius:8px;padding:6px 8px;cursor:pointer;display:flex">${icon('x')}</button>
      <div style="position:absolute;bottom:14px;left:14px">${badge(s.category)}</div>
    </div>
    <div style="padding:24px">
      <h2 style="font-size:22px;font-weight:700;margin:0 0 8px">${escapeHtml(s.title)}</h2>
      <p style="font-size:14px;color:#94a3b8;line-height:1.7;margin-bottom:16px">${escapeHtml(s.desc)}</p>
      <div style="display:flex;gap:16px;margin-bottom:20px;flex-wrap:wrap;align-items:center">
        <div style="display:flex;align-items:center;gap:8px">${avatar(s.avatar, 32)}<div><p style="font-family:'Outfit',sans-serif;font-weight:600;font-size:13px;margin:0">${escapeHtml(s.provider)}</p><div style="display:flex;align-items:center;gap:4px">${stars(s.rating)}<span style="font-size:11px;color:#64748b">${s.rating} (${s.reviews} reseñas)</span></div></div><button class="btn-outline btn-sm" onclick="openPublicProfile('${s.ownerId}')">Ver ficha</button></div>
        <div style="display:flex;align-items:center;gap:5px;color:#64748b;font-size:13px">${smallIcon('location')} ${escapeHtml(s.location)}</div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div><span class="mono" style="font-size:22px;font-weight:700;color:#22d3ee">${COP(s.price)}</span><span style="color:#64748b;font-size:13px"> ${escapeHtml(s.unit)}</span></div>
        <button class="btn-primary" style="padding:11px 24px;font-size:15px" ${s.available ? '' : 'disabled'} onclick="${s.available ? `closeModal('modal-service');requestService('${s.id}')` : ''}">
          ${s.available ? 'Solicitar servicio' : 'No disponible'}
        </button>
      </div>
    </div>`;
  openModal('modal-service');
}

// ── BOOKING MODAL ───────────────────────────────────────────────
function openBooking(id) {
  STATE.currentService = findServiceById(id);
  if (!STATE.currentService) {
    alert('No se pudo cargar el servicio. Actualiza el catálogo e inténtalo de nuevo.');
    return;
  }
  STATE.bookingStep = 'form';
  STATE.bookingDate = '';
  STATE.bookingNote = '';
  STATE.bookingPayMethod = 'nequi';
  STATE.contractAccepted = false;
  renderBookingStep();
  openModal('modal-booking');
}

function renderBookingStep() {
  const s = STATE.currentService;
  const step = STATE.bookingStep;
  const commission = Math.round(s.price * 0.1);
  const steps = ['form', 'contract', 'pay'];
  const stepIdx = steps.indexOf(step);
  const stepBar = steps.map((x, i) => `<div class="step-segment${i <= stepIdx ? ' done' : ''}"></div>`).join('');

  let body = '';
  if (step === 'form') {
    body = `
      <div style="background:rgba(17,27,84,0.5);border-radius:10px;padding:14px 16px;margin-bottom:16px;border:1px solid rgba(34,211,238,0.1)">
        <p style="font-family:'Outfit',sans-serif;font-weight:700;font-size:15px;margin:0 0 2px">${escapeHtml(s.title)}</p>
        <p style="font-size:13px;color:#64748b;margin:0 0 6px">Con ${escapeHtml(s.provider)}</p>
        <span class="mono" style="color:#22d3ee;font-weight:700">${COP(s.price)}</span>
      </div>
      <div class="form-group"><label class="form-label">Fecha preferida</label><input class="input" type="date" id="book-date" value="${escapeHtml(STATE.bookingDate)}" onchange="STATE.bookingDate=this.value" /></div>
      <div class="form-group"><label class="form-label">Nota para el prestador (opcional)</label><textarea class="input" rows="3" id="book-note" placeholder="Describe lo que necesitas..." onchange="STATE.bookingNote=this.value">${escapeHtml(STATE.bookingNote)}</textarea></div>
      <button class="btn-primary btn-full" style="padding:12px;font-size:15px" onclick="if(document.getElementById('book-date').value){STATE.bookingDate=document.getElementById('book-date').value;STATE.bookingStep='contract';renderBookingStep()}">Continuar</button>`;
  } else if (step === 'contract') {
    body = `
      <div style="background:rgba(17,27,84,0.5);border-radius:10px;padding:16px;margin-bottom:16px;border:1px solid rgba(34,211,238,0.15);max-height:240px;overflow-y:auto">
        ${[
        ['Cláusula 1 – Aceptación', 'Al confirmar, el Cliente y el Prestador aceptan formalmente los términos del servicio a través de la plataforma Servi Choquib.'],
        ['Cláusula 2 – Cancelación (40 min)', 'El servicio podrá cancelarse sin penalización en los 40 minutos siguientes a su confirmación.'],
        ['Cláusula 3 – Pagos y Comisión', 'Todo pago debe realizarse dentro de la app. La plataforma retiene automáticamente el 10% de comisión. Prohibido el pago externo.'],
      ].map(([c, t]) => `<div style="margin-bottom:14px"><p style="font-family:'Outfit',sans-serif;font-weight:600;font-size:13px;color:#22d3ee;margin:0 0 4px">${c}</p><p style="font-size:12px;color:#94a3b8;line-height:1.6;margin:0">${t}</p></div>`).join('')}
      </div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
        <input type="checkbox" id="contract-check" style="accent-color:#22d3ee;width:16px;height:16px" ${STATE.contractAccepted ? 'checked' : ''} onchange="STATE.contractAccepted=this.checked" />
        <label for="contract-check" style="font-size:13px;color:#94a3b8">Acepto los términos del contrato digital</label>
      </div>
      <div style="display:flex;gap:10px">
        <button class="btn-outline flex-1" style="padding:11px" onclick="STATE.bookingStep='form';renderBookingStep()">Atrás</button>
        <button class="btn-primary flex-1" style="padding:11px" onclick="if(STATE.contractAccepted){STATE.bookingStep='pay';renderBookingStep()}">Continuar al pago</button>
      </div>`;
  } else if (step === 'pay') {
    const methods = [['nequi', '📱 Nequi'], ['card', '💳 Tarjeta débito/crédito'], ['bancolombia', '🏦 Bancolombia']];
    body = `
      <div style="background:rgba(17,27,84,0.5);border-radius:10px;padding:16px;margin-bottom:16px;border:1px solid rgba(34,211,238,0.1)">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span style="font-size:13px;color:#94a3b8">Servicio</span><span class="mono" style="font-size:13px">${COP(s.price)}</span></div>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span style="font-size:13px;color:#94a3b8">Comisión plataforma (10%)</span><span class="mono" style="font-size:13px;color:#f59e0b">${COP(commission)}</span></div>
        <div class="divider"></div>
        <div style="display:flex;justify-content:space-between"><span style="font-family:'Outfit',sans-serif;font-weight:700">Total</span><span class="mono" style="font-weight:700;color:#22d3ee;font-size:16px">${COP(s.price)}</span></div>
      </div>
      <p style="font-family:'Outfit',sans-serif;font-weight:600;font-size:13px;color:#94a3b8;margin-bottom:10px">Método de pago (Sandbox)</p>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">
        ${methods.map(([m, l]) => `<button id="pay-btn-${m}" onclick="selectPayMethod('${m}')" style="padding:12px 16px;border-radius:10px;border:2px solid ${STATE.bookingPayMethod === m ? '#22d3ee' : 'rgba(34,211,238,0.15)'};background:${STATE.bookingPayMethod === m ? 'rgba(34,211,238,0.08)' : 'transparent'};color:${STATE.bookingPayMethod === m ? '#22d3ee' : '#94a3b8'};font-family:'Outfit',sans-serif;font-size:14px;font-weight:500;cursor:pointer;text-align:left;transition:all 0.15s">${l}</button>`).join('')}
      </div>
      <div class="warn-box" style="margin-bottom:16px">⚠️ Modo Sandbox (Wompi/PayU) — No se realizarán cobros reales.</div>
      <div style="display:flex;gap:10px">
        <button class="btn-outline flex-1" style="padding:11px" onclick="STATE.bookingStep='contract';renderBookingStep()">Atrás</button>
        <button class="btn-primary flex-1" style="padding:11px;font-size:14px" onclick="completeBooking()">Pagar ${COP(s.price)}</button>
      </div>`;
  } else if (step === 'success') {
    document.getElementById('modal-booking-box').innerHTML = `
      <div style="padding:40px;text-align:center">
        <div style="width:64px;height:64px;border-radius:50%;background:rgba(34,197,94,0.15);border:2px solid #4ade80;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;color:#4ade80">${icon('check')}</div>
        <h2 style="font-family:'Outfit',sans-serif;font-size:22px;font-weight:700;margin:0 0 8px">¡Servicio contratado!</h2>
        <p style="color:#94a3b8;margin-bottom:8px">Tu solicitud para <strong style="color:#22d3ee">${escapeHtml(s.title)}</strong> fue enviada con éxito.</p>
        <p style="font-size:12px;color:#64748b;margin-bottom:24px">Recuerda: tienes 40 minutos para cancelar sin penalización.</p>
        <div style="background:rgba(17,27,84,0.6);border-radius:10px;padding:12px 20px;margin-bottom:24px;border:1px solid rgba(34,211,238,0.15)">
          <p class="mono" style="font-size:13px;color:#94a3b8;margin:0 0 4px">Total pagado (sandbox)</p>
          <p class="mono" style="font-size:20px;color:#22d3ee;margin:0 0 2px">${COP(s.price)}</p>
          <p style="font-size:11px;color:#64748b;margin:0">Comisión plataforma: ${COP(commission)} (10%)</p>
        </div>
        <button class="btn-primary" style="padding:11px 32px" onclick="closeModal('modal-booking')">Ir al dashboard</button>
      </div>`;
    return;
  }

  document.getElementById('modal-booking-box').innerHTML = `
    <div style="padding:28px">
      <div class="modal-header">
        <h2 style="font-size:18px;font-weight:700;margin:0">${step === 'form' ? 'Solicitar servicio' : step === 'contract' ? 'Contrato digital' : 'Pago seguro'}</h2>
        <button class="btn-outline btn-sm" onclick="closeModal('modal-booking')">${icon('x')}</button>
      </div>
      <div class="step-bar">${stepBar}</div>
      ${body}
    </div>`;
}

function selectPayMethod(m) {
  STATE.bookingPayMethod = m;
  document.querySelectorAll('[id^="pay-btn-"]').forEach(el => {
    const isActive = el.id === `pay-btn-${m}`;
    el.style.borderColor = isActive ? '#22d3ee' : 'rgba(34,211,238,0.15)';
    el.style.background = isActive ? 'rgba(34,211,238,0.08)' : 'transparent';
    el.style.color = isActive ? '#22d3ee' : '#94a3b8';
  });
}

async function completeBooking() {
  try {
    await apiRequest('/bookings', { method: 'POST', body: JSON.stringify({ serviceId: STATE.currentService.id, date: STATE.bookingDate, note: STATE.bookingNote }) });
    STATE.bookingStep = 'success';
    await loadRemoteData();
    renderBookingStep();
  } catch (error) {
    alert(error.message);
  }
}

// ── PROVIDER VIEWS ──────────────────────────────────────────────
