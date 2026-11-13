// ── Persistent service management ─────────────────────────────

function openServiceEditor(serviceId = null) {
  STATE.editingServiceId = serviceId;
  const service = SERVICES.find(item => item.id === serviceId);
  document.querySelector('#modal-new-service h3').textContent = service ? 'Editar servicio' : 'Publicar nuevo servicio';
  document.getElementById('service-title').value = service?.title || '';
  document.getElementById('service-price').value = service?.price || '';
  document.getElementById('service-category').value = service?.category || '';
  document.getElementById('service-desc').value = service?.desc || '';
  document.getElementById('service-unit').value = service?.unit || 'por servicio';
  document.getElementById('service-location').value = service?.location || 'Quibdó';
  const imageInput = document.getElementById('service-image-input');
  if (imageInput) imageInput.value = '';
  const previewWrap = document.getElementById('service-image-preview-wrap');
  const preview = document.getElementById('service-image-preview');
  if (preview && previewWrap) {
    const currentImage = service ? serviceImageUrl(service) : '';
    preview.src = service?.img ? currentImage : '';
    previewWrap.hidden = !service?.img;
  }
  const removeFlag = document.getElementById('service-image-remove');
  if (removeFlag) removeFlag.value = '0';
  openModal('modal-new-service');
}

function readServiceImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('No se pudo leer la fotografía del servicio.'));
    reader.readAsDataURL(file);
  });
}

function previewServiceImage(input) {
  const file = input?.files?.[0];
  if (!file) return;
  const allowed = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
  if (!allowed.has(String(file.type).toLowerCase())) {
    input.value = '';
    alert('La fotografía debe ser PNG, JPG, WEBP o GIF.');
    return;
  }
  if (file.size > 1.2 * 1024 * 1024) {
    input.value = '';
    alert('La fotografía no puede superar 1,2 MB.');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const preview = document.getElementById('service-image-preview');
    const wrap = document.getElementById('service-image-preview-wrap');
    if (preview && wrap) { preview.src = String(reader.result || ''); wrap.hidden = false; }
    const removeFlag = document.getElementById('service-image-remove');
    if (removeFlag) removeFlag.value = '0';
  };
  reader.onerror = () => alert('No se pudo abrir la fotografía seleccionada.');
  reader.readAsDataURL(file);
}

function removeServiceImage() {
  const input = document.getElementById('service-image-input');
  const preview = document.getElementById('service-image-preview');
  const wrap = document.getElementById('service-image-preview-wrap');
  const removeFlag = document.getElementById('service-image-remove');
  if (input) input.value = '';
  if (preview) preview.src = '';
  if (wrap) wrap.hidden = true;
  if (removeFlag) removeFlag.value = '1';
}

async function saveServiceFromModal() {
  const payload = {
    title: document.getElementById('service-title').value.trim(),
    price: Number(document.getElementById('service-price').value),
    category: document.getElementById('service-category').value,
    desc: document.getElementById('service-desc').value.trim(),
    unit: document.getElementById('service-unit').value.trim(),
    location: document.getElementById('service-location').value.trim(),
    available: true,
  };
  try {
    const imageInput = document.getElementById('service-image-input');
    const removeFlag = document.getElementById('service-image-remove');
    if (imageInput?.files?.[0]) {
      const file = imageInput.files[0];
      if (file.size > 1.2 * 1024 * 1024) throw new Error('La fotografía no puede superar 1,2 MB.');
      payload.img = await readServiceImageFile(file);
    } else if (removeFlag?.value === '1') {
      payload.img = '';
    }

    const path = STATE.editingServiceId ? `/services/${STATE.editingServiceId}` : '/services';
    await apiRequest(path, { method: STATE.editingServiceId ? 'PUT' : 'POST', body: JSON.stringify(payload) });
    closeModal('modal-new-service');
    await loadRemoteData();
    navigate('my-services');
  } catch (error) {
    alert(error.message);
  }
}

async function deleteService(serviceId) {
  if (!confirm('¿Eliminar este servicio?')) return;
  try {
    await apiRequest(`/services/${serviceId}`, { method: 'DELETE' });
    await loadRemoteData();
    navigate('my-services');
  } catch (error) {
    alert(error.message);
  }
}

