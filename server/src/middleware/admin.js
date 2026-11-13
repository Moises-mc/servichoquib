import { HttpError } from '../utils/http-error.js';

export function requireAdmin(req, _res, next) {
  if (req.user?.role !== 'admin') return next(new HttpError(403, 'No tienes permisos para acceder al panel administrativo.'));
  return next();
}
