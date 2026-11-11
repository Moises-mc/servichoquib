// Configuración pública del frontend Servi Choquib. No incluir secretos aquí.
(function configureServiChoquibApi() {
  const host = window.location.hostname || '';
  const isLocal = host === 'localhost' || host === '127.0.0.1';
  const configuredUrl = String(window.SERVI_API_URL || '').trim();
  const localDefault = isLocal ? `http://${host}:8000/api` : '';
  // GitHub Pages necesita llamar al dominio de Vercel; en Vercel usamos el mismo origen.
  const isGitHubPages = host.endsWith('.github.io');
  const productionDefault = isGitHubPages
    ? 'https://servichoquib.vercel.app/api'
    : '/api';
  window.SERVI_API_URL = (configuredUrl || localDefault || productionDefault).replace(/\/+$/, '');
})();
