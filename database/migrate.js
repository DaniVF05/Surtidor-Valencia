require('dotenv').config();
const pool = require('../backend/config/db');
const fs   = require('fs');
const path = require('path');

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  try {
    await pool.query(sql);
    console.log('✅  Migración completada correctamente.');
  } catch (err) {
    console.error('❌  Error en migración:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();
