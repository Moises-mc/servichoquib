import { createHash } from 'node:crypto';
import { query, table } from '../database/db.js';
const RESETS = table('password_resets');
const digest = value => createHash('sha256').update(String(value)).digest('hex');
export class PasswordResetModel {
  static async save(email, code, expiresAt) {
    await query(
      `INSERT INTO ${RESETS} (email, code_hash, expires_at) VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET code_hash = EXCLUDED.code_hash, expires_at = EXCLUDED.expires_at, created_at = NOW()`,
      [String(email).toLowerCase(), digest(code), new Date(expiresAt)],
    );
  }
  static async verify(email, code) {
    const { rows } = await query(`SELECT code_hash, expires_at FROM ${RESETS} WHERE email = $1 LIMIT 1`, [String(email).toLowerCase()]);
    const reset = rows[0];
    return Boolean(reset && new Date(reset.expires_at).getTime() >= Date.now() && reset.code_hash === digest(code));
  }
  static async delete(email) {
    await query(`DELETE FROM ${RESETS} WHERE email = $1`, [String(email).toLowerCase()]);
  }
}
