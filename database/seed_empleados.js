require('dotenv').config();
const { Pool }  = require('pg');
const bcrypt    = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL_POOLER || process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const empleados = [
  { nombre: 'Carlos Mendoza',    email: 'supervisor@surtidor.com',  password: 'Super1234!',  rol: 'supervisor' },
  { nombre: 'María González',    email: 'operador1@surtidor.com',   password: 'Oper1234!',   rol: 'operador'   },
  { nombre: 'Luis Rodríguez',    email: 'operador2@surtidor.com',   password: 'Oper1234!',   rol: 'operador'   },
  { nombre: 'Ana Martínez',      email: 'operador3@surtidor.com',   password: 'Oper1234!',   rol: 'operador'   },
  { nombre: 'Pedro Castillo',    email: 'operador4@surtidor.com',   password: 'Oper1234!',   rol: 'operador'   },
];

async function seed() {
  for (const emp of empleados) {
    const hash = await bcrypt.hash(emp.password, 12);
    await pool.query(
      `INSERT INTO empleados (nombre, email, password_hash, rol)
       VALUES ($1,$2,$3,$4) ON CONFLICT (email) DO UPDATE SET nombre=$1, password_hash=$3, rol=$4`,
      [emp.nombre, emp.email, hash, emp.rol]
    );
    console.log(`✅ ${emp.rol.padEnd(11)} — ${emp.nombre} (${emp.email})`);
  }
  console.log('\n🎉 Empleados de simulación creados correctamente.\n');
  await pool.end();
}

seed().catch(e => { console.error('❌', e.message); pool.end(); });
