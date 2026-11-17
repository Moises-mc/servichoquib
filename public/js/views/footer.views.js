// Pie de página y documentos legales. Única fuente de datos de contacto.
const SITE_CONTACT = {
  email: 'servichoquib.app@gmail.com',
  whatsappDisplay: '+57 322 668 0768',
  whatsappLink: 'https://wa.me/573226680768?text=' + encodeURIComponent('Hola Servi Choquib, necesito ayuda.'),
  address: 'Quibdó, Chocó, Colombia',
};

function siteFooterHtml(variant = 'landing') {
  const c = SITE_CONTACT;
  const year = new Date().getFullYear();
  const quickLinks = variant === 'landing'
    ? '<a href="#como-funciona">Cómo funciona</a><a href="#beneficios">Beneficios</a>'
    : '';
  return `
  <footer class="site-footer site-footer--${variant}" aria-label="Información de Servi Choquib">
    <div class="site-footer-grid">
      <section class="site-footer-brand">
        <img src="/assets/servi-choquib-logo.png" alt="Servi Choquib" class="site-footer-logo" loading="lazy" />
        <p>Conecta, encuentra y resuelve. La red local de servicios en Quibdó.</p>
        <p class="site-footer-pay">🔒 Pagos seguros con Rapyd · Precios en pesos colombianos (COP)</p>
      </section>
      <nav class="site-footer-col" aria-label="Contacto">
        <h3>Contacto</h3>
        <a href="mailto:${c.email}">✉️ ${c.email}</a>
        <a href="${c.whatsappLink}" target="_blank" rel="noopener noreferrer">💬 WhatsApp ${c.whatsappDisplay}</a>
        <span>📍 ${c.address}</span>
      </nav>
      <nav class="site-footer-col" aria-label="Información legal">
        <h3>Información</h3>
        ${quickLinks}
        <a href="#" onclick="openTerms();return false">Términos y condiciones</a>
        <a href="#" onclick="openPrivacy();return false">Política de privacidad</a>
        <a href="#" onclick="openCookies();return false">Política de cookies</a>
      </nav>
      <nav class="site-footer-col" aria-label="Ayuda">
        <h3>Ayuda</h3>
        <a href="mailto:${c.email}?subject=${encodeURIComponent('Petición, queja o reclamo')}">Peticiones, quejas y reclamos</a>
        <a href="https://www.sic.gov.co" target="_blank" rel="noopener noreferrer">Derechos del consumidor (SIC)</a>
      </nav>
    </div>
    <div class="site-footer-bottom">
      <span>© ${year} Servi Choquib. Todos los derechos reservados.</span>
      <span>Hecho con 💙 en Quibdó, Chocó</span>
      <a href="#" onclick="window.scrollTo({top:0,behavior:'smooth'});document.getElementById('main-content')?.scrollTo({top:0,behavior:'smooth'});return false">Volver arriba ↑</a>
    </div>
  </footer>`;
}

function openLegal(title, sections) {
  document.getElementById('legal-title').textContent = title;
  document.getElementById('legal-content').innerHTML = sections.map(([heading, text]) =>
    `<div style="margin-bottom:16px"><p style="font-family:'Outfit',sans-serif;font-weight:600;font-size:14px;color:#22d3ee;margin:0 0 4px">${heading}</p><p style="font-size:13px;color:#94a3b8;line-height:1.6;margin:0">${text}</p></div>`).join('')
    + '<p style="font-size:12px;color:#64748b;margin:8px 0 0">Última actualización: noviembre de 2026.</p>';
  openModal('modal-legal');
}

function openPrivacy() {
  const c = SITE_CONTACT;
  openLegal('Política de privacidad', [
    ['1. Responsable del tratamiento', `Servi Choquib, con domicilio en ${c.address}. Contacto: ${c.email} · WhatsApp ${c.whatsappDisplay}.`],
    ['2. Datos que recolectamos', 'Datos de registro (nombre, correo, teléfono, rol, ubicación y foto de perfil), tu actividad en la plataforma (servicios, reservas, reseñas y mensajes) y datos técnicos básicos para el funcionamiento y la seguridad del servicio. Los datos de tu tarjeta o medio de pago los procesa Rapyd en su página de pago; Servi Choquib no los almacena.'],
    ['3. Finalidades', 'Crear y administrar tu cuenta, conectar clientes y prestadores, gestionar reservas y pagos, calcular comisiones, enviarte notificaciones por correo o mensaje, brindar soporte y prevenir fraudes.'],
    ['4. Con quién compartimos tus datos', 'Con el otro usuario de la reserva (lo necesario para prestar el servicio), con Rapyd para procesar pagos, con proveedores de correo y mensajería para enviarte notificaciones, y con autoridades cuando la ley lo exija. No vendemos tus datos.'],
    ['5. Tus derechos (Ley 1581 de 2012)', 'Puedes conocer, actualizar y rectificar tus datos, solicitar prueba de la autorización, ser informado del uso que les damos, revocar la autorización o solicitar la supresión de tus datos cuando proceda, y presentar quejas ante la Superintendencia de Industria y Comercio. Para ejercerlos escribe a ' + c.email + '.'],
    ['6. Seguridad y conservación', 'Protegemos tu información con medidas técnicas y organizativas; las contraseñas se almacenan cifradas. Conservamos los datos mientras tu cuenta esté activa y durante el tiempo que exijan obligaciones legales o contables.'],
    ['7. Cambios', 'Podemos actualizar esta política; publicaremos la versión vigente en esta página.'],
  ]);
}

function openCookies() {
  openLegal('Política de cookies', [
    ['1. ¿Qué son?', 'Son pequeños archivos o registros que tu navegador guarda para recordar información entre visitas. También existe el almacenamiento local del navegador, que cumple una función parecida.'],
    ['2. Lo que usamos', 'Usamos almacenamiento local del navegador únicamente para mantener tu sesión iniciada. Es estrictamente necesario para que la plataforma funcione y se elimina cuando cierras sesión.'],
    ['3. Lo que no usamos', 'Servi Choquib no usa cookies publicitarias ni herramientas propias de analítica o seguimiento.'],
    ['4. Servicios de terceros', 'Para mostrar la página se cargan tipografías de Google Fonts e iconos desde unpkg, lo que implica que esos proveedores reciban datos técnicos como tu dirección IP. Al pagar, Rapyd aplica sus propias políticas de privacidad y cookies en su página.'],
    ['5. Cómo gestionarlas', 'Puedes borrar o bloquear cookies y datos del sitio desde la configuración de tu navegador. Si borras el almacenamiento local, deberás iniciar sesión de nuevo.'],
    ['6. Contacto', `Si tienes dudas, escríbenos a ${SITE_CONTACT.email}.`],
  ]);
}

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('landing-footer');
  if (mount) mount.innerHTML = siteFooterHtml('landing');
});
