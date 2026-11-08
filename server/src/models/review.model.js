import { randomUUID } from 'node:crypto';
import { query, table } from '../database/db.js';
const REVIEWS = table('reviews');
export class ReviewModel {
  static async findByBooking(bookingId) {
    const { rows } = await query(`SELECT id, booking_id AS "bookingId", service_id AS "serviceId", provider_id AS "providerId", user_id AS "userId", rating, comment, created_at FROM ${REVIEWS} WHERE booking_id = $1 LIMIT 1`, [String(bookingId)]);
    return rows[0] || null;
  }
  static async create(data) {
    const id = data.id || `r_${randomUUID()}`;
    const { rows } = await query(
      `INSERT INTO ${REVIEWS} (id, booking_id, service_id, provider_id, user_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, booking_id AS "bookingId", service_id AS "serviceId", provider_id AS "providerId", user_id AS "userId", rating, comment, created_at`,
      [id, String(data.bookingId), data.serviceId == null ? null : String(data.serviceId), String(data.providerId), String(data.userId), Number(data.rating), data.comment || ''],
    );
    return rows[0];
  }
}
