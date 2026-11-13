import { createHash } from 'node:crypto';
import { query, table } from '../database/db.js';
const RESETS = table('password_resets');
const digest = value => createHash('sha256').update(String(value)).digest('hex');
export class PasswordResetModel {
 static async save(email, code, expiresAt, method='email') { await query(`INSERT INTO ${RESETS}(email,code_hash,expires_at,attempts,method) VALUES($1,$2,$3,0,$4) ON CONFLICT(email) DO UPDATE SET code_hash=EXCLUDED.code_hash,expires_at=EXCLUDED.expires_at,attempts=0,method=EXCLUDED.method,created_at=NOW()`,[String(email).toLowerCase(),digest(code),new Date(expiresAt),method]); }
 static async verify(email, code) { const { rows }=await query(`UPDATE ${RESETS} SET attempts=attempts+1 WHERE email=$1 AND expires_at>NOW() AND attempts<5 RETURNING code_hash`,[String(email).toLowerCase()]); return Boolean(rows[0] && rows[0].code_hash === digest(code)); }
 static async delete(email) { await query(`DELETE FROM ${RESETS} WHERE email=$1`,[String(email).toLowerCase()]); }
}
