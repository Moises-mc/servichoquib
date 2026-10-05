import { Router } from 'express';
import bcrypt from 'bcrypt';
import { body, validationResult } from 'express-validator';
import { users, publicUser } from '../store/memory.js';
import { auth, signUser } from '../middleware/auth.js';

const router = Router();
const validate = (req, res, next) => { const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg }); next(); };
const rules = [body('email').isEmail().withMessage('Correo inválido.'), body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener mínimo 8 caracteres.')];

router.post('/login', [body('identifier').isEmail().withMessage('Correo inválido.'), body('password').notEmpty().withMessage('Contraseña requerida.'), validate], async (req, res) => {
  const email = req.body.identifier.trim().toLowerCase();
  const user = users.find(item => item.email.toLowerCase() === email);
  if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
  res.json({ user: publicUser(user), token: signUser(user) });
});

router.post('/register', [...rules, body('name').trim().isLength({ min: 2 }).withMessage('Nombre inválido.'), validate], async (req, res) => {
  const email = req.body.email.trim().toLowerCase();
  if (users.some(item => item.email === email)) return res.status(409).json({ error: 'Ese correo ya está registrado.' });
  const user = { id: `u${Date.now()}`, name: req.body.name.trim(), email, phone: req.body.phone || '', role: req.body.role === 'prestador' ? 'prestador' : 'cliente', passwordHash: await bcrypt.hash(req.body.password, 12), avatar: req.body.name.trim().split(/\s+/).map(x => x[0]).join('').slice(0, 2).toUpperCase(), location: 'Quibdó' };
  users.push(user);
  res.status(201).json({ user: publicUser(user), token: signUser(user) });
});

router.get('/me', auth, (req, res) => res.json({ user: publicUser(req.user) }));
router.get('/profile', auth, (req, res) => res.json({ user: publicUser(req.user) }));
router.put('/profile', auth, (req, res) => { Object.assign(req.user, req.body); res.json({ user: publicUser(req.user) }); });
export default router;
