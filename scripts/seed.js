require('dotenv').config();
const { Pool }  = require('pg');
const bcrypt    = require('bcryptjs');

const pool = new Pool({
  host:     process.env.DB_HOST || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'task_manager_db',
  user:     process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function seed() {
  const client = await pool.connect();
  console.log('\n🌱  Ejecutando seed de desarrollo...\n');
  try {
    await client.query('BEGIN');

    const hash = await bcrypt.hash('Password1!', 12);

    // Usuarios
    const { rows: users } = await client.query(`
      INSERT INTO users (name, email, password_hash) VALUES
        ('Ana García',   'ana@demo.com',   $1),
        ('Luis Pérez',   'luis@demo.com',  $1),
        ('María López',  'maria@demo.com', $1)
      ON CONFLICT (email) DO NOTHING
      RETURNING id, name, email
    `, [hash]);

    console.log(`✓ ${users.length} usuario(s) creados`);
    if (!users.length) { console.log('  (Ya existían, saltando seed)'); await client.query('ROLLBACK'); return; }

    const [ana, luis, maria] = users;

    // Grupo familiar
    const { rows: [group] } = await client.query(`
      INSERT INTO family_groups (name, created_by) VALUES ('Casa García', $1) RETURNING id
    `, [ana.id]);

    await client.query(`
      INSERT INTO user_groups (user_id, group_id, role) VALUES
        ($1, $3, 'admin'), ($2, $3, 'member')
    `, [ana.id, luis.id, group.id]);

    // Tareas
    await client.query(`
      INSERT INTO tasks (title, description, priority, status, due_date, group_id, created_by, assigned_to) VALUES
        ('Limpiar cocina',      'Limpiar estufa y lavaplatos',  'high',   'pending',     NOW() + interval '1 day',  $3, $1, $2),
        ('Comprar mercado',     'Lista en la nota del teléfono','medium', 'in_progress', NOW() + interval '2 days', $3, $1, $1),
        ('Pagar servicios',     'Agua, luz e internet',         'high',   'pending',     NOW() - interval '1 day',  $3, $2, $2),
        ('Sacar la basura',     NULL,                           'low',    'completed',   NOW() - interval '3 days', $3, $1, $2),
        ('Revisar jardín',      'Cortar el pasto',              'medium', 'pending',     NOW() + interval '5 days', $3, $2, $1)
    `, [ana.id, luis.id, group.id]);

    await client.query('COMMIT');
    console.log('✓ Grupo y tareas creados');
    console.log('\n📋  Credenciales de prueba:');
    console.log('   ana@demo.com   / Password1!');
    console.log('   luis@demo.com  / Password1!');
    console.log('   maria@demo.com / Password1!\n');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('✗ Seed falló:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(() => process.exit(1));
