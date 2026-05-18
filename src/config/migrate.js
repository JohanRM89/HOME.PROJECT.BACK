const fs = require('fs');
const path = require('path');
const db = require('./connection');

async function runMigrations() {
  try {
    console.log('🚀 Ejecutando migraciones...');

    // Crear tabla de control
    await db.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        executed_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    const migrationsPath = path.join(__dirname, '../migrations');

    const files = fs
      .readdirSync(migrationsPath)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of files) {

      const alreadyExecuted = await db.query(
        `SELECT version FROM schema_migrations WHERE version = $1`,
        [file]
      );

      if (alreadyExecuted.rows.length > 0) {
        console.log(`⏭️ ${file} ya ejecutada`);
        continue;
      }

      console.log(`📦 Ejecutando ${file}`);

      const sql = fs.readFileSync(
        path.join(migrationsPath, file),
        'utf8'
      );

      await db.query(sql);

      await db.query(
        `INSERT INTO schema_migrations(version) VALUES($1)`,
        [file]
      );

      console.log(`✅ ${file} completada`);
    }

    console.log('🎉 Migraciones completadas');

  } catch (err) {
    console.error('❌ Error migrando BD:', err);
    throw err;
  }
}

module.exports = runMigrations;