// Plantilla de gestión de servicios del prestador.
function renderProviderServices() {
  const ownServices = SERVICES.filter(service => service.ownerId === STATE.user.id);
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;gap:12px;flex-wrap:wrap">
      <div><h2 style="font-family:'Outfit',sans-serif;font-size:20px;font-weight:700;margin:0">Mis servicios</h2><p style="color:#64748b;font-size:13px;margin:4px 0 0">Publica y administra tu oferta.</p></div>
      <button class="btn-primary" style="padding:9px 18px;font-size:14px;display:flex;align-items:center;gap:8px" onclick="openServiceEditor()">${icon('plus')} Nuevo servicio</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:12px">
      ${ownServices.length ? ownServices.map(service => `
        <div class="card" style="padding:16px;border-radius:12px;display:flex;gap:16px;align-items:center;flex-wrap:wrap">
          <div style="flex:1;min-width:210px"><p style="font-family:'Outfit',sans-serif;font-weight:600;margin:0 0 4px">${escapeHtml(service.title)}</p><p style="font-size:12px;color:#64748b;margin:0">${escapeHtml(service.category)} · ${COP(service.price)} ${escapeHtml(service.unit)}</p><p style="font-size:12px;color:#94a3b8;margin:5px 0 0">${escapeHtml(service.desc)}</p></div>
          <div style="display:flex;gap:8px;align-items:center">${badge(service.available ? 'Activo' : 'Inactivo', service.available ? 'green' : 'red')}<button class="btn-outline btn-sm" onclick="openServiceEditor('${service.id}')">Editar</button><button class="btn-danger" onclick="deleteService('${service.id}')">Eliminar</button></div>
        </div>`).join('') : '<div class="card card-p"><p style="color:#94a3b8;margin:0">Todavía no tienes servicios publicados. Crea el primero.</p></div>'}
    </div>`;
}
