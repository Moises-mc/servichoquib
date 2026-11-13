import { createHash } from 'node:crypto';
import { query, table } from '../database/db.js';
const PENDING = table('pending_registrations');
const RESETS = table('password_resets');
const PHONES = table('phone_verifications');
const digest = value => createHash('sha256').update(String(value)).digest('hex');
export class VerificationModel {
 static async saveRegistration(data, code, expiresAt) {
  await query(`INSERT INTO ${PENDING} (email,name,phone,role,password_hash,code_hash,expires_at,attempts,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,0,NOW()) ON CONFLICT(email) DO UPDATE SET name=EXCLUDED.name,phone=EXCLUDED.phone,role=EXCLUDED.role,password_hash=EXCLUDED.password_hash,code_hash=EXCLUDED.code_hash,expires_at=EXCLUDED.expires_at,attempts=0,created_at=NOW()`, [data.email,data.name,data.phone,data.role,data.passwordHash,digest(code),new Date(expiresAt)]);
 }
 static async getRegistration(email, code) {
  const { rows } = await query(`UPDATE ${PENDING} SET attempts=attempts+1 WHERE email=$1 AND expires_at>NOW() AND attempts<5 RETURNING *`, [email]);
  const pending = rows[0];
  return pending && pending.code_hash === digest(code) ? pending : null;
 }
 static async deleteRegistration(email) { await query(`DELETE FROM ${PENDING} WHERE email=$1`,[email]); }
 static async savePhone(userId, code, expiresAt) { await query(`INSERT INTO ${PHONES}(user_id,code_hash,expires_at,attempts) VALUES($1,$2,$3,0) ON CONFLICT(user_id) DO UPDATE SET code_hash=EXCLUDED.code_hash,expires_at=EXCLUDED.expires_at,attempts=0,created_at=NOW()`,[userId,digest(code),new Date(expiresAt)]); }
 static async verifyPhone(userId, code) { const { rows }=await query(`UPDATE ${PHONES} SET attempts=attempts+1 WHERE user_id=$1 AND expires_at>NOW() AND attempts<5 RETURNING code_hash`,[userId]); return Boolean(rows[0] && rows[0].code_hash === digest(code)); }
 static async deletePhone(userId) { await query(`DELETE FROM ${PHONES} WHERE user_id=$1`,[userId]); }
 static hash(value) { return digest(value); }
}
