const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.SCHEMA_TO_GO_URL,
  ssl: { rejectUnauthorized: false },
});

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      column_name TEXT NOT NULL DEFAULT 'backlog',
      done BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAll() {
  const { rows } = await pool.query(
    'SELECT id, text, column_name, done FROM todos ORDER BY created_at ASC'
  );
  return rows.map(r => ({ id: r.id, text: r.text, column: r.column_name, done: r.done }));
}

async function create({ id, text, column }) {
  await pool.query(
    'INSERT INTO todos (id, text, column_name) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
    [id, text, column]
  );
}

async function update(id, fields) {
  const sets = [];
  const vals = [];
  let i = 1;
  if (fields.column !== undefined) { sets.push(`column_name = $${i++}`); vals.push(fields.column); }
  if (fields.done !== undefined) { sets.push(`done = $${i++}`); vals.push(fields.done); }
  if (fields.text !== undefined) { sets.push(`text = $${i++}`); vals.push(fields.text); }
  if (sets.length === 0) return;
  sets.push(`updated_at = NOW()`);
  vals.push(id);
  await pool.query(`UPDATE todos SET ${sets.join(', ')} WHERE id = $${i}`, vals);
}

async function remove(id) {
  await pool.query('DELETE FROM todos WHERE id = $1', [id]);
}

module.exports = { init, getAll, create, update, remove };
