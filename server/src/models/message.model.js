import { randomUUID } from 'node:crypto';
import { query, table } from '../database/db.js';
const MESSAGES = table('messages');
const SELECT = `id, sender_id, receiver_id, sender_name, text, attachment, created_at, edited_at`;
function mapMessage(row) { return row || null; }
export class MessageModel {
  static async findById(id) {
    const { rows } = await query(`SELECT ${SELECT} FROM ${MESSAGES} WHERE id = $1 LIMIT 1`, [String(id)]);
    return mapMessage(rows[0]);
  }
  static async findForUser(userId, partnerId = '') {
    const params = [String(userId)];
    let where = '(sender_id = $1 OR receiver_id = $1)';
    if (partnerId) {
      params.push(String(partnerId));
      where += ' AND ((sender_id = $1 AND receiver_id = $2) OR (receiver_id = $1 AND sender_id = $2))';
    }
    const { rows } = await query(`SELECT ${SELECT} FROM ${MESSAGES} WHERE ${where} ORDER BY created_at ASC`, params);
    return rows;
  }
  static async create(data) {
    const id = data.id || `m_${randomUUID()}`;
    const { rows } = await query(
      `INSERT INTO ${MESSAGES} (id, sender_id, receiver_id, sender_name, text, attachment)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb) RETURNING ${SELECT}`,
      [id, String(data.sender_id), String(data.receiver_id), data.sender_name, data.text || '', data.attachment ? JSON.stringify(data.attachment) : null],
    );
    return mapMessage(rows[0]);
  }
  static async update(message, changes) {
    const { rows } = await query(`UPDATE ${MESSAGES} SET text = $1, edited_at = NOW() WHERE id = $2 RETURNING ${SELECT}`,
      [changes.text, String(message.id)]);
    return mapMessage(rows[0]);
  }
  static async delete(message) {
    const { rowCount } = await query(`DELETE FROM ${MESSAGES} WHERE id = $1`, [String(message.id)]);
    return rowCount > 0;
  }
  static async deleteConversation(userId, contactId) {
    const { rowCount } = await query(
      `DELETE FROM ${MESSAGES} WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)`,
      [String(userId), String(contactId)],
    );
    return rowCount;
  }
}
