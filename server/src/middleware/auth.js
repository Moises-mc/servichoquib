import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UserModel } from '../models/user.model.js';
export function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return res.status(401).json({ error: 'Autenticación requerida.' });
  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    return res.status(401).json({ error: 'Sesión no válida o vencida.' });
  }
  UserModel.findById(payload.id).then(user => {
    if (!user) return res.status(401).json({ error: 'Sesión no válida o vencida.' });
    if (user.isActive === false) return res.status(403).json({ error: 'Tu cuenta está suspendida. Comunícate con soporte.' });
    req.auth = payload;
    req.user = user;
    return next();
  }).catch(next);
}
export function signUser(user) {
  return jwt.sign({ id: user.id }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}
