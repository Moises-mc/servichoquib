import { randomUUID } from 'node:crypto';
import { query, table } from '../database/db.js';
const BOOKINGS = table('bookings');
const SELECT = `id, service_id, client_id, provider_id, title, provider, client, date, note,  status, total, commission, paid, payment_amount, paid_at, created_at, updated_at`;
function mapBooking(row) {
  if (!row) return null;
  return { ...row, total: Number(row.total), commission: Number(row.commission), paid: Number(row.paid), payment_amount: Number(row.payment_amount) };
}
export class BookingModel {
  static async findAll() {
    const { rows } = await query(`SELECT ${SELECT} FROM ${BOOKINGS} ORDER BY created_at DESC`);
    return rows.map(mapBooking);
  }
  static async findById(id) {
    const { rows } = await query(`SELECT ${SELECT} FROM ${BOOKINGS} WHERE id = $1 LIMIT 1`, [String(id)]);
    return mapBooking(rows[0]);
  }
  static async findByUser(user) {
    const { rows } = user.role === 'admin'
      ? await query(`SELECT ${SELECT} FROM ${BOOKINGS} ORDER BY created_at DESC`)
      : await query(`SELECT ${SELECT} FROM ${BOOKINGS} WHERE client_id = $1 OR provider_id = $1 ORDER BY created_at DESC`, [String(user.id)]);
    return rows.map(mapBooking);
  }
  static async create(data) {
    const id = data.id || `b_${randomUUID()}`;
    const fields = ['service_id', 'client_id', 'provider_id', 'title', 'provider', 'client', 'date', 'note', 'status', 'total', 'commission', 'paid', 'payment_amount'];
    // Los campos opcionales deben usar los mismos valores por defecto que el esquema.
    // Enviar NULL explícitamente evita que PostgreSQL aplique DEFAULT ''.
    const defaults = { note: '', commission: 0, paid: 0, payment_amount: 0 };
    const values = fields.map(field => data[field] ?? defaults[field] ?? null);
    const placeholders = values.map((_, index) => `$${index + 1}`);
    const { rows } = await query(
      `INSERT INTO ${BOOKINGS} (id, ${fields.join(', ')}) VALUES ($${values.length + 1}, ${placeholders.join(', ')}) RETURNING ${SELECT}`,
      [...values, id],
    );
    return mapBooking(rows[0]);
  }
  static async update(booking, changes) {
    const allowed = new Map([['status', 'status'], ['paid', 'paid'], ['payment_amount', 'payment_amount'], ['paid_at', 'paid_at']]);
    const entries = Object.entries(changes).filter(([key]) => allowed.has(key));
    if (!entries.length) return this.findById(booking.id);
    const assignments = entries.map(([key], index) => `"${allowed.get(key)}" = $${index + 1}`);
    const values = entries.map(([, value]) => value);
    const { rows } = await query(`UPDATE ${BOOKINGS} SET ${assignments.join(', ')}, updated_at = NOW() WHERE id = $${values.length + 1} RETURNING ${SELECT}`, [...values, String(booking.id)]);
    return mapBooking(rows[0]);
  }
}
