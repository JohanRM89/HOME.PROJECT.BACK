const BaseRepository = require('./BaseRepository');
const db  = require('../config/database');
const crypto = require('crypto');

class SessionRepository extends BaseRepository {
  constructor() { super('sessions'); }

  _hash(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async createSession(userId, token, expiresAt, meta = {}) {
    return this.create({
      user_id:    userId,
      token_hash: this._hash(token),
      expires_at: expiresAt,
      ip_address: meta.ip   || null,
      user_agent: meta.ua   || null,
    });
  }

  async findByToken(token) {
    const { rows } = await db.query(
      `SELECT s.*, u.name, u.email, u.is_active
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.token_hash = $1
         AND s.expires_at > NOW()
         AND s.revoked_at IS NULL
         AND u.is_active = true`,
      [this._hash(token)]
    );
    return rows[0] || null;
  }

  async revoke(token) {
    await db.query(
      'UPDATE sessions SET revoked_at = NOW() WHERE token_hash = $1',
      [this._hash(token)]
    );
  }

  async revokeAllForUser(userId) {
    await db.query(
      'UPDATE sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
      [userId]
    );
  }

  async cleanExpired() {
    const { rowCount } = await db.query(
      `DELETE FROM sessions WHERE expires_at < NOW() OR revoked_at IS NOT NULL`
    );
    return rowCount;
  }
}

module.exports = new SessionRepository();
