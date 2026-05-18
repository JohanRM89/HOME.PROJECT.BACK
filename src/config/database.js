require("dotenv").config();
const { Pool } = require("pg");

class Database {
  constructor() {
    if (Database.instance) return Database.instance;

    this.pool = process.env.DATABASE_URL
      ? new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl:
            process.env.NODE_ENV === "production"
              ? { rejectUnauthorized: false }
              : false,
        })
      : new Pool({
          host: process.env.DB_HOST || "localhost",
          port: parseInt(process.env.DB_PORT) || 5434,
          database: process.env.DB_NAME || "home_task",
          user: process.env.DB_USER || "postgres",
          password: process.env.DB_PASSWORD,
        });

    this.pool.on("error", (err) => {
      console.error("[DB] Error inesperado:", err.message);
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
