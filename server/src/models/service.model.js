import { randomUUID } from 'node:crypto';
import { query, table } from '../database/db.js';

const SERVICES = table('services');
const SELECT = `id, owner_id AS "ownerId", provider, avatar, category, title, description AS "desc",
  price, unit, rating, reviews, location, img, available, created_at, updated_at`;
const FIELDS = new Map([
  ['ownerId', 'owner_id'], ['provider', 'provider'], ['avatar', 'avatar'], ['category', 'category'],
  ['title', 'title'], ['desc', 'description'], ['price', 'price'], ['unit', 'unit'],
  ['rating', 'rating'], ['reviews', 'reviews'], ['location', 'location'], ['img', 'img'], ['available', 'available'],
]);
function mapService(row) {
  if (!row) return null;
  return { ...row, price: Number(row.price), rating: Number(row.rating || 0), reviews: Number(row.reviews || 0) };
}

export class ServiceModel {
  static async findAll() {
    const { rows } = await query(`SELECT ${SELECT} FROM ${SERVICES} ORDER BY created_at DESC, id`);
    return rows.map(mapService);
  }
  static async findById(id) {
    const { rows } = await query(`SELECT ${SELECT} FROM ${SERVICES} WHERE id = $1 LIMIT 1`, [String(id)]);
    return mapService(rows[0]);
  }
  static async findByOwner(id, ownerId) {
    const { rows } = await query(`SELECT ${SELECT} FROM ${SERVICES} WHERE id = $1 AND owner_id = $2 LIMIT 1`, [String(id), String(ownerId)]);
    return mapService(rows[0]);
  }
  static async findAllByOwner(ownerId) {
    const { rows } = await query(`SELECT ${SELECT} FROM ${SERVICES} WHERE owner_id = $1 ORDER BY created_at DESC`, [String(ownerId)]);
    return rows.map(mapService);
  }
  static async create(data) {
    const id = data.id || `s_${randomUUID()}`;
    const fields = Object.keys(data).filter(key => FIELDS.has(key));
    const columns = fields.map(key => `"${FIELDS.get(key)}"`);
    const values = fields.map(key => data[key]);
    const placeholders = values.map((_, index) => `$${index + 1}`);
    const { rows } = await query(
      `INSERT INTO ${SERVICES} (id, ${columns.join(', ')}) VALUES ($${values.length + 1}, ${placeholders.join(', ')}) RETURNING ${SELECT}`,
      [...values, id],
    );
    return mapService(rows[0]);
  }
  static async update(service, changes) {
    const entries = Object.entries(changes).filter(([key]) => FIELDS.has(key));
    if (!entries.length) return this.findById(service.id);
    const assignments = entries.map(([key], index) => `"${FIELDS.get(key)}" = $${index + 1}`);
    const values = entries.map(([, value]) => value);
    const { rows } = await query(
      `UPDATE ${SERVICES} SET ${assignments.join(', ')}, updated_at = NOW() WHERE id = $${values.length + 1} RETURNING ${SELECT}`,
      [...values, String(service.id)],
    );
    return mapService(rows[0]);
  }
  static async delete(service) {
    const { rowCount } = await query(`DELETE FROM ${SERVICES} WHERE id = $1`, [String(service.id)]);
    return rowCount > 0;
  }
  static async updateRating(serviceId) {
    await query(
      `UPDATE ${SERVICES} SET
       rating = COALESCE((SELECT AVG(rating)::numeric(3,2) FROM ${table('reviews')} WHERE service_id = $1), 0),
       reviews = (SELECT COUNT(*)::int FROM ${table('reviews')} WHERE service_id = $1)
       WHERE id = $1`, [String(serviceId)],
    );
  }
}
