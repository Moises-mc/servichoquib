// Configuración del frontend Servi Choquib.
(function configureServiChoquibApi() {
  const host = window.location.hostname || '';
  const isLocal = host === 'localhost' || host === '127.0.0.1';
  const isVercel = host.endsWith('.vercel.app');
  const configuredUrl = String(window.SERVI_API_URL || '').trim();

  let defaultUrl = 'https://servichoquib.vercel.app/api';
  if (isLocal) {
    defaultUrl = `http://${host}:8000/api`;
  } else if (isVercel) {
    defaultUrl = '/api';
  }

  window.SERVI_API_URL = (configuredUrl || defaultUrl).replace(/\/+$/, '');
})();
