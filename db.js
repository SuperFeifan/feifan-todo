const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const DB_URL = process.env.SCHEMA_TO_GO_URL;

async function query(sql, params = []) {
  const escaped = sql.replace(/\$(\d+)/g, (_, i) => {
    const val = params[parseInt(i) - 1];
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
    return `'${String(val).replace(/'/g, "''")}'`;
  });
  const { stdout } = await execAsync(`psql "${DB_URL}" -t -A -F'	' -c "${escaped.replace(/"/g, '\\"')}"`);
  return stdout;
}

function parseRows(output) {
  const lines = output.trim().split('\n').filter(Boolean);
  return lines.map(line => {
    const parts = line.split('\t');
    return {
      id: parts[0],
      text: parts[1],
      column_name: parts[2],
      done: parts[3] === 't',
    };
  });
}

async function init() {
  await query(`
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
  const out = await query('SELECT id, text, column_name, done FROM todos ORDER BY created_at ASC');
  return parseRows(out).map(r => ({ id: r.id, text: r.text, column: r.column_name, done: r.done }));
}

async function create({ id, text, column }) {
  await query('INSERT INTO todos (id, text, column_name) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [id, text, column || 'backlog']);
}

async function update(id, fields) {
  const sets = [];
  if (fields.column !== undefined) sets.push(`column_name = '${fields.column.replace(/'/g, "''")}'`);
  if (fields.done !== undefined) sets.push(`done = ${fields.done ? 'TRUE' : 'FALSE'}`);
  if (fields.text !== undefined) sets.push(`text = '${fields.text.replace(/'/g, "''")}'`);
  if (sets.length === 0) return;
  sets.push("updated_at = NOW()");
  await query(`UPDATE todos SET ${sets.join(', ')} WHERE id = '${id.replace(/'/g, "''")}'`);
}

async function remove(id) {
  await query(`DELETE FROM todos WHERE id = '${id.replace(/'/g, "''")}'`);
}

module.exports = { init, getAll, create, update, remove };
