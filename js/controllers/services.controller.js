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
  openModal('modal-new-service');
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

