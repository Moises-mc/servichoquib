// URL pública del backend Servi Choquib. GitHub Pages aloja únicamente el frontend.
(function configureServiChoquibApi() {
  const host = window.location.hostname || '';
  const isLocal = host === 'localhost' || host === '127.0.0.1';
  const configuredUrl = String(window.SERVI_API_URL || '').trim();
  const defaultUrl = isLocal
    ? `http://${host}:8000/api`
    : 'https://servichoquib.vercel.app/api';

  window.SERVI_API_URL = (configuredUrl || defaultUrl).replace(/\/+$/, '');
})();
