import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { users } from '../store/memory.js';

export function auth(req, res, next) {
  const value = req.headers.authorization || '';
  const token = value.startsWith('Bearer ') ? value.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Autenticación requerida.' });
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = users.find(user => user.id === payload.id);
    if (!req.user) throw new Error('Usuario no encontrado');
    next();
  } catch { res.status(401).json({ error: 'Sesión no válida o vencida.' }); }
}

export function signUser(user) {
  return jwt.sign({ id: user.id, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}
