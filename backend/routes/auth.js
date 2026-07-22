const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool     = require('../config/db');
const router   = express.Router();

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Contraseña requerida'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  const { email, password } = req.body;
  try {
    const result = await pool.query(
      'SELECT * FROM empleados WHERE email = $1 AND activo = true', [email]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }
    const empleado = result.rows[0];
    const valid = await bcrypt.compare(password, empleado.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }
    const token = jwt.sign(
      { id: empleado.id, rol: empleado.rol, nombre: empleado.nombre },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    res.json({ success: true, token, empleado: { id: empleado.id, nombre: empleado.nombre, rol: empleado.rol } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Sesión cerrada' });
});

module.exports = router;
