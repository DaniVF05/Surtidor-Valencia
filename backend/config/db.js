require('dotenv').config();
const { Pool } = require('pg');

// Usar connection pooler de Supabase (IPv4 compatible)
// en lugar de conexión directa (db.xxx.supabase.co — solo IPv6)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL_POOLER || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
  family: 4,  // Forzar IPv4
});

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err.message);
});

module.exports = pool;
