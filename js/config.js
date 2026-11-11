// Configuración pública del frontend Servi Choquib. No incluir secretos aquí.
(function configureServiChoquibApi() {
  const host = window.location.hostname || '';
  const isLocal = host === 'localhost' || host === '127.0.0.1';
  const configuredUrl = String(window.SERVI_API_URL || '').trim();
  const localDefault = isLocal ? `http://${host}:8000/api` : '';
  // El frontend de GitHub Pages y la API de Vercel están en dominios distintos.
  const productionDefault = 'https://servichoquib.vercel.app/api';
  window.SERVI_API_URL = (configuredUrl || localDefault || productionDefault).replace(/\/+$/, '');
})();
