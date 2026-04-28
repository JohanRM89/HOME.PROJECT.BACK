require('dotenv').config();
const { Pool } = require('pg');

// Singleton pattern: una sola instancia del pool en toda la app
class Database {
  constructor() {
    if (Database.instance) return Database.instance;

    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5434,
      database: process.env.DB_NAME || 'home_task',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      console.error('[DB] Error inesperado en cliente idle:', err.message);
    });

    Database.instance = this;
  }

  async query(text, params = []) {
    const start = Date.now();
    const res = await this.pool.query(text, params);
    if (process.env.NODE_ENV === 'development') {
      const ms = Date.now() - start;
      console.log(`[DB] ${ms}ms | ${res.rowCount} filas | ${text.slice(0, 60)}...`);
    }
    return res;
  }

  async getClient() {
    return this.pool.connect();
  }

  async end() {
    return this.pool.end();
  }
}

module.exports = new Database();
