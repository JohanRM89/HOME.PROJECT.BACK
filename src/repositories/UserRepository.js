const BaseRepository = require('./BaseRepository');
const db = require('../config/database');

class UserRepository extends BaseRepository {
  constructor() { super('users'); }

  async findByEmail(email) {
    const { rows } = await db.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email.toLowerCase()]
    );
    return rows[0] || null;
  }

  async findPublic(id) {
    return this.findById(id, 'id, name, email, is_active, created_at, updated_at');
  }

  async setResetToken(email, token, expiresAt) {
    const { rows } = await db.query(
      `UPDATE users SET reset_token = $1, reset_token_expires = $2
       WHERE email = $3 AND is_active = true RETURNING id`,
      [token, expiresAt, email.toLowerCase()]
    );
    return rows[0] || null;
  }

  async findByResetToken(token) {
    const { rows } = await db.query(
      `SELECT * FROM users WHERE reset_token = $1
       AND reset_token_expires > NOW() AND is_active = true`,
      [token]
    );
    return rows[0] || null;
  }

  async clearResetToken(id, passwordHash) {
    await db.query(
      `UPDATE users SET password_hash = $1, reset_token = NULL,
       reset_token_expires = NULL WHERE id = $2`,
      [passwordHash, id]
    );
  }
}

module.exports = new UserRepository();
