import multer from 'multer';

export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Ruta no encontrada.' });
}

// Último middleware de Express: normaliza errores y evita filtrar detalles internos.
export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error instanceof multer.MulterError) {
    const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return res.status(status).json({ error: error.code === 'LIMIT_FILE_SIZE' ? 'El archivo supera el límite de 5 MB.' : 'No se pudo procesar el archivo.' });
  }

  const status = Number.isInteger(error.status) ? error.status : 500;
  if (status >= 500) console.error(error);
  return res.status(status).json({
    error: status >= 500 ? 'Error interno del servidor.' : error.message,
    ...(error.details ? { details: error.details } : {}),
  });
}
