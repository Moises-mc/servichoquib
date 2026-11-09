// Configuración del frontend Servi Choquib.
// - En Vercel: frontend y API comparten dominio; se usa /api automáticamente.
// - En GitHub Pages: no hay backend propio; se conecta al backend desplegado en Vercel.
// - En Localhost (Live Server): se conecta a http://localhost:8000/api.
(function configureServiChoquibApi() {
  const host = window.location.hostname || '';
  const isLocal = host === 'localhost' || host === '127.0.0.1';
  const isGitHubPages = host.endsWith('.github.io');
  const configuredUrl = String(window.SERVI_API_URL || '').trim();

  let defaultUrl = '/api';
  if (isGitHubPages) {
    defaultUrl = 'https://servichoquib.vercel.app/api';
  } else if (isLocal) {
    defaultUrl = `http://${host}:8000/api`;
  }

  window.SERVI_API_URL = (configuredUrl || defaultUrl).replace(/\/+$/, '');
})();
