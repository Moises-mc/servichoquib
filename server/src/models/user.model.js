import { randomUUID } from 'node:crypto';
import { query, table } from '../database/db.js';

const USERS = table('users');
const FIELDS = new Map([
  ['name', 'name'], ['email', 'email'], ['phone', 'phone'], ['role', 'role'],
  ['passwordHash', 'password_hash'], ['avatar', 'avatar'], ['location', 'location'],
  ['rating', 'rating'], ['bio', 'bio'], ['specialty', 'specialty'],
  ['availability', 'availability'], ['profile_image', 'profile_image'], ['emailVerified', 'email_verified'], ['phoneVerified', 'phone_verified'],
]);
const SELECT = `id, name, email, phone, role, password_hash AS "passwordHash", avatar, location,
  rating, bio, specialty, availability, profile_image, email_verified AS "emailVerified", phone_verified AS "phoneVerified", created_at, updated_at`;

function mapUser(row) {
  if (!row) return null;
  return { ...row, rating: Number(row.rating || 0) };
}

export class UserModel {
  static async findAll() {
    const { rows } = await query(`SELECT ${SELECT} FROM ${USERS} ORDER BY name`);
    return rows.map(mapUser);
  }

  static async findById(id) {
    const { rows } = await query(`SELECT ${SELECT} FROM ${USERS} WHERE id = $1 LIMIT 1`, [String(id)]);
    return mapUser(rows[0]);
  }

  static async findByEmail(email) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const { rows } = await query(`SELECT ${SELECT} FROM ${USERS} WHERE email = $1 LIMIT 1`, [normalizedEmail]);
    return mapUser(rows[0]);
  }

  static async create(data) {
    const id = data.id || `u_${randomUUID()}`;
    const keys = Object.keys(data).filter(key => FIELDS.has(key));
    const columns = keys.map(key => `"${FIELDS.get(key)}"`);
    const values = keys.map(key => data[key]);
    const placeholders = values.map((_, index) => `$${index + 1}`);
    const { rows } = await query(
      `INSERT INTO ${USERS} (id, ${columns.join(', ')}) VALUES ($${values.length + 1}, ${placeholders.join(', ')}) RETURNING ${SELECT}`,
      [...values, id],
    );
    return mapUser(rows[0]);
  }

  static async update(user, changes) {
    const entries = Object.entries(changes).filter(([key]) => FIELDS.has(key));
    if (!entries.length) return this.findById(user.id);
    const assignments = entries.map(([key], index) => `"${FIELDS.get(key)}" = $${index + 1}`);
    const values = entries.map(([, value]) => value);
    const { rows } = await query(
      `UPDATE ${USERS} SET ${assignments.join(', ')}, updated_at = NOW() WHERE id = $${values.length + 1} RETURNING ${SELECT}`,
      [...values, String(user.id)],
    );
    return mapUser(rows[0]);
  }

  static toPublic(user) {
    if (!user) return null;
    const { passwordHash, ...publicUser } = user;
    return publicUser;
  }
}
