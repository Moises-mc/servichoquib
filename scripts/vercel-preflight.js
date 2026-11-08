import fs from 'node:fs';
import path from 'node:path';

const required = [
  'index.js',
  'vercel.json',
  'package.json',
  'public/index.html',
  'public/style.css',
  'public/js/config.js',
  'server/src/database/migrations/001_initial.sql',
];
const missing = required.filter(file => !fs.existsSync(path.resolve(file)));
if (missing.length) {
  console.error('Faltan archivos para desplegar en Vercel:', missing.join(', '));
  process.exit(1);
}
console.log('Preflight Vercel correcto: frontend, Express y migración SQL presentes.');
