require('dotenv').config();
const { Pool } = require('pg');

class Database {
  constructor() {
    if (Database.instance) return Database.instance;

    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    this.pool.on('error', (err) => {
      console.error('[DB] Error inesperado:', err.message);
    });

    Database.instance = this;
  }

  async query(text, params = []) {
    return this.pool.query(text, params);
  }

  async getClient() {
    return this.pool.connect();
  }

  async end() {
    return this.pool.end();
  }
}

module.exports = new Database();