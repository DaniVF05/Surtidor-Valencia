const express = require('express');
const bcrypt  = require('bcryptjs');
const pool    = require('../config/db');
const auth    = require('../middleware/auth');
const router  = express.Router();

router.get('/', auth('admin', 'supervisor'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nombre, email, rol, activo, created_at FROM empleados ORDER BY nombre'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', auth('admin'), async (req, res) => {
  const { nombre, email, password, rol } = req.body;
  try {
    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      'INSERT INTO empleados (nombre, email, password_hash, rol) VALUES ($1,$2,$3,$4) RETURNING id, nombre, email, rol',
      [nombre, email, hash, rol || 'operador']
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', auth('admin'), async (req, res) => {
  const { nombre, email, rol, activo } = req.body;
  try {
    const result = await pool.query(
      'UPDATE empleados SET nombre=$1, email=$2, rol=$3, activo=$4, updated_at=NOW() WHERE id=$5 RETURNING id,nombre,email,rol,activo',
      [nombre, email, rol, activo, req.params.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
