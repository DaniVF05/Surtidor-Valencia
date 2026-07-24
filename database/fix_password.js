require('dotenv').config();
const { Pool }   = require('pg');
const bcrypt     = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function fixPassword() {
  const hash = await bcrypt.hash('Admin1234!', 12);
  const result = await pool.query(
    'UPDATE empleados SET password_hash = $1 WHERE email = $2 RETURNING email, rol',
    [hash, 'admin@surtidor.com']
  );
  console.log('✅ Password actualizado:', result.rows[0]);
  await pool.end();
}

fixPassword().catch(e => { console.error('❌', e.message); pool.end(); });
