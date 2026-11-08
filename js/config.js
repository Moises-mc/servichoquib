// Configuración del frontend Servi Choquib.
// Desarrollo local: se configura automáticamente http://localhost:8000/api.
// Producción (Vercel): frontend y API comparten dominio; se usa /api automáticamente.
// Para otro hosting, define window.SERVI_API_URL antes de cargar este archivo.
// No pongas aquí credenciales ni la URL privada de PostgreSQL.
(function configureServiChoquibApi() {
  const host = window.location.hostname || '';
  const isLocal = host === 'localhost' || host === '127.0.0.1';
  const configuredUrl = String(window.SERVI_API_URL || '').trim();
  const localDefault = isLocal ? `http://${host}:8000/api` : '';
  const productionDefault = isLocal ? '' : '/api';
  window.SERVI_API_URL = (configuredUrl || localDefault || productionDefault).replace(/\/+$/, '');
})();
