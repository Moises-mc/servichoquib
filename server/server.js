// Punto de entrada legado conservado por compatibilidad.
// La implementación oficial y única vive en src/server.js.
import { startServer } from './src/server.js';

startServer().catch(error => {
  console.error('No se pudo iniciar Servi Choquib API:', error);
  process.exitCode = 1;
});
