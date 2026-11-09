import { randomUUID } from 'node:crypto';
import { query, table } from '../database/db.js';
const BOOKINGS = table('bookings');
const SELECT = `id, service_id, client_id, provider_id, title, provider, client, date, note,
  status, total, commission, paid, payment_amount, paid_at, created_at, updated_at`;
function mapBooking(row) {
  if (!row) return null;
  const date = row.date instanceof Date ? row.date.toISOString().slice(0, 10) : String(row.date || '').slice(0, 10);
  return { ...row, date, total: Number(row.total), commission: Number(row.commission), paid: Number(row.paid), payment_amount: Number(row.payment_amount) };
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
    const fields = ['service_id','client_id','provider_id','title','provider','client','date','note','status','total','commission','paid','payment_amount'];
    // Los campos opcionales deben usar los mismos valores por defecto que el esquema.
  // Enviar NULL explícitamente evita que PostgreSQL aplique DEFAULT ''.
  const defaults = { note: '', commission: 0, paid: 0, payment_amount: 0 };
    const values = fields.map(k => (data[k] !== undefined ? data[k] : defaults[k] ?? null));
    const placeholders = fields.map((_, i) => `$${i + 2}`).join(', ');
    const sql = `INSERT INTO ${BOOKINGS} (id, ${fields.join(', ')}) VALUES ($1, ${placeholders}) RETURNING ${SELECT}`;
    const { rows } = await query(sql, [id, ...values]);
    return mapBooking(rows[0]);
  }
  static async updateStatus(id, status, extra = {}) {
    const setClauses = ['status = $2'];
    const params = [String(id), status];
    let idx = 3;
    if (extra.paid !== undefined) { setClauses.push(`paid = $${idx++}`); params.push(extra.paid); }
    if (extra.payment_amount !== undefined) { setClauses.push(`payment_amount = $${idx++}`); params.push(extra.payment_amount); }
    if (extra.paid_at !== undefined) { setClauses.push(`paid_at = $${idx++}`); params.push(extra.paid_at); }
    const { rows } = await query(
      `UPDATE ${BOOKINGS} SET ${setClauses.join(', ')} WHERE id = $1 RETURNING ${SELECT}`,
      params,
    );
    return mapBooking(rows[0]);
  }
}
