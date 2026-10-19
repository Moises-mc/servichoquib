import { Router } from 'express';
import bcrypt from 'bcrypt';
import { body, validationResult } from 'express-validator';
import { users, publicUser } from '../store/memory.js';
import { auth, signUser } from '../middleware/auth.js';

// Un Router agrupa rutas relacionadas. En server.js se monta bajo /api.
const router = Router();

// Lee los resultados de las reglas de validacion antes de ejecutar una ruta.
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
  return next();
};

const userRules = [
  body('email').isEmail().withMessage('Correo invalido.'),
  body('password').isLength({ min: 8 }).withMessage('La contrasena debe tener minimo 8 caracteres.'),
];

// POST /api/login: valida las credenciales y devuelve un token JWT.
router.post('/login', [
  body('identifier').isEmail().withMessage('Correo invalido.'),
  body('password').notEmpty().withMessage('Contrasena requerida.'),
  validate,
], async (req, res) => {
  const email = req.body.identifier.trim().toLowerCase();
  const user = users.find(item => item.email.toLowerCase() === email);

  // bcrypt compara la clave enviada con el hash guardado, nunca texto plano.
  if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) {
    return res.status(401).json({ error: 'Correo o contrasena incorrectos.' });
  }

  return res.json({ user: publicUser(user), token: signUser(user) });
});

// POST /api/register: crea un usuario en el arreglo temporal `users`.
router.post('/register', [...userRules, body('name').trim().isLength({ min: 2 }).withMessage('Nombre invalido.'), validate], async (req, res) => {
  const email = req.body.email.trim().toLowerCase();
  if (users.some(item => item.email === email)) {
    return res.status(409).json({ error: 'Ese correo ya esta registrado.' });
  }

  const name = req.body.name.trim();
  const user = {
    id: `u${Date.now()}`,
    name,
    email,
    phone: req.body.phone || '',
    role: req.body.role === 'prestador' ? 'prestador' : 'cliente',
    passwordHash: await bcrypt.hash(req.body.password, 12),
    avatar: name.split(/\s+/).map(word => word[0]).join('').slice(0, 2).toUpperCase(),
    location: 'Quibdo',
  };

  users.push(user);
  return res.status(201).json({ user: publicUser(user), token: signUser(user) });
});

// `auth` verifica Authorization: Bearer <token> y agrega req.user.
router.get('/me', auth, (req, res) => res.json({ user: publicUser(req.user) }));
router.get('/profile', auth, (req, res) => res.json({ user: publicUser(req.user) }));
router.put('/profile', auth, (req, res) => {
  Object.assign(req.user, req.body);
  res.json({ user: publicUser(req.user) });
});

export default router;
