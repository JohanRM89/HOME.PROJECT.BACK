#!/usr/bin/env node
// ============================================================
// scripts/migrate.js
// Uso:
//   npm run migrate          → ejecuta migraciones pendientes
//   npm run migrate:undo     → muestra migraciones aplicadas
// ============================================================
require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'task_manager_db',
  user:     process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

const MIGRATIONS_DIR = path.join(__dirname, '../src/migrations');

const c = {
  reset:  '\x1b[0m',
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  bold:   '\x1b[1m',
};

const log = {
  info:    (m) => console.log(`${c.cyan}  ℹ  ${c.reset}${m}`),
  success: (m) => console.log(`${c.green}  ✓  ${c.reset}${m}`),
  error:   (m) => console.log(`${c.red}  ✗  ${c.reset}${m}`),
  warn:    (m) => console.log(`${c.yellow}  ⚠  ${c.reset}${m}`),
  title:   (m) => console.log(`\n${c.bold}${c.cyan}${m}${c.reset}\n`),
  divider: ()  => console.log(`${c.cyan}${'─'.repeat(50)}${c.reset}`),
};

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version     VARCHAR(100) PRIMARY KEY,
      executed_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

async function getExecutedMigrations(client) {
  const { rows } = await client.query(
    'SELECT version FROM schema_migrations ORDER BY version'
  );
  return rows.map(r => r.version);
}

async function runMigrations() {
  log.title('🗄️   Task Manager — Migraciones de Base de Datos');
  log.divider();

  const client = await pool.connect();
  try {
    await ensureMigrationsTable(client);
    const executed = await getExecutedMigrations(client);

    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (!files.length) {
      log.warn('No se encontraron archivos .sql en /src/migrations');
      return;
    }

    let ran = 0;

    for (const file of files) {
      const version = path.basename(file, '.sql');

      if (executed.includes(version)) {
        log.info(`Omitida (ya aplicada): ${file}`);
        continue;
      }

      log.info(`Aplicando: ${file}`);
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT DO NOTHING',
          [version]
        );
        await client.query('COMMIT');
        log.success(`Completada: ${file}`);
        ran++;
      } catch (err) {
        await client.query('ROLLBACK');
        log.error(`Falló en: ${file}`);
        log.error(err.message);
        throw err;
      }
    }

    log.divider();
    if (ran === 0) {
      log.success('La base de datos ya está actualizada. Sin migraciones pendientes.');
    } else {
      log.success(`${ran} migración(es) aplicada(s) exitosamente. ✨`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

async function showMigrations() {
  log.title('📋  Migraciones aplicadas');
  log.divider();
  const client = await pool.connect();
  try {
    await ensureMigrationsTable(client);
    const { rows } = await client.query(
      'SELECT version, executed_at FROM schema_migrations ORDER BY version'
    );
    if (!rows.length) {
      log.warn('Ninguna migración ha sido ejecutada aún.');
    } else {
      rows.forEach(r =>
        log.success(`${r.version}  →  ${new Date(r.executed_at).toLocaleString()}`)
      );
    }
    log.divider();
  } finally {
    client.release();
    await pool.end();
  }
}

const cmd = process.argv[2];
const fn  = cmd === 'undo' ? showMigrations : runMigrations;

fn().catch(err => {
  log.error(err.message);
  process.exit(1);
});
