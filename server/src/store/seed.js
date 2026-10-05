import bcrypt from 'bcrypt';
import { users, services } from './memory.js';

export async function seedDemoData() {
  if (users.length) return;
  const add = async (data, password) => users.push({ ...data, passwordHash: await bcrypt.hash(password, 12) });
  await add({ id:'c1', name:'Ana García', email:'ana@email.com', role:'cliente', avatar:'AG', location:'Centro, Quibdó' }, 'ana12345');
  await add({ id:'p1', name:'Carlos Mena', email:'carlos@email.com', role:'prestador', avatar:'CM', location:'Barrio Huapango', rating:4.9 }, 'carlos12345');
  await add({ id:'p4', name:'Marco Riascos', email:'marco@email.com', role:'prestador', avatar:'MR', location:'Villa del Río', rating:4.6 }, 'marco12345');
  services.push({ id:'s1', ownerId:'p1', provider:'Carlos Mena', avatar:'CM', category:'Barbería', title:'Corte y afeitado clásico', desc:'Corte moderno, afeitado y tratamiento capilar.', price:25000, unit:'por servicio', rating:4.9, reviews:143, location:'Barrio Huapango, Quibdó', available:true });
  services.push({ id:'s4', ownerId:'p4', provider:'Marco Riascos', avatar:'MR', category:'Técnico', title:'Soporte técnico PC y celulares', desc:'Reparación de computadores, software y celulares.', price:50000, unit:'por visita', rating:4.6, reviews:201, location:'Villa del Río', available:true });
}
