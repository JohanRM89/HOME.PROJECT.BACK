// ============================================================
// Patrón Repository — abstrae el acceso a datos (SOLID: DIP)
// Todas las entidades extienden BaseRepository
// ============================================================
const db = require('../config/database');

class BaseRepository {
  constructor(tableName) {
    if (!tableName) throw new Error('BaseRepository requiere un nombre de tabla');
    this.table = tableName;
    this.db    = db;
  }

  async findById(id, returning = '*') {
    const { rows } = await this.db.query(
      `SELECT ${returning} FROM ${this.table} WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  async findOne(conditions = {}, returning = '*') {
    const keys   = Object.keys(conditions);
    const values = Object.values(conditions);
    const where  = keys.map((k, i) => `${k} = $${i + 1}`).join(' AND ');
    const { rows } = await this.db.query(
      `SELECT ${returning} FROM ${this.table} WHERE ${where} LIMIT 1`,
      values
    );
    return rows[0] || null;
  }

  async findAll(conditions = {}, options = {}) {
    const { orderBy = 'created_at DESC', limit = 50, offset = 0, returning = '*' } = options;
    const keys   = Object.keys(conditions);
    const values = Object.values(conditions);
    const where  = keys.length
      ? `WHERE ${keys.map((k, i) => `${k} = $${i + 1}`).join(' AND ')}`
      : '';
    const { rows } = await this.db.query(
      `SELECT ${returning} FROM ${this.table} ${where}
       ORDER BY ${orderBy} LIMIT ${limit} OFFSET ${offset}`,
      values
    );
    return rows;
  }

  async create(data) {
    const keys        = Object.keys(data);
    const values      = Object.values(data);
    const columns     = keys.join(', ');
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const { rows } = await this.db.query(
      `INSERT INTO ${this.table} (${columns}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    return rows[0];
  }

  async update(id, data) {
    const keys   = Object.keys(data);
    const values = Object.values(data);
    if (!keys.length) return this.findById(id);
    const set = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    values.push(id);
    const { rows } = await this.db.query(
      `UPDATE ${this.table} SET ${set} WHERE id = $${values.length} RETURNING *`,
      values
    );
    return rows[0] || null;
  }

  async delete(id) {
    const { rowCount } = await this.db.query(
      `DELETE FROM ${this.table} WHERE id = $1`,
      [id]
    );
    return rowCount > 0;
  }

  async count(conditions = {}) {
    const keys   = Object.keys(conditions);
    const values = Object.values(conditions);
    const where  = keys.length
      ? `WHERE ${keys.map((k, i) => `${k} = $${i + 1}`).join(' AND ')}`
      : '';
    const { rows } = await this.db.query(
      `SELECT COUNT(*)::int AS total FROM ${this.table} ${where}`,
      values
    );
    return rows[0].total;
  }
}

module.exports = BaseRepository;
