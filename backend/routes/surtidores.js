const express = require('express');
const pool    = require('../config/db');
const auth    = require('../middleware/auth');
const router  = express.Router();

// GET /api/surtidores — Listar todos
router.get('/', auth(), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, COUNT(v.id) AS total_ventas
      FROM surtidores s
      LEFT JOIN ventas v ON v.surtidor_id = s.id AND DATE(v.fecha) = CURRENT_DATE
      GROUP BY s.id ORDER BY s.numero
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/surtidores/:id
router.get('/:id', auth(), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM surtidores WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'No encontrado' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/surtidores
router.post('/', auth('admin'), async (req, res) => {
  const { numero, tipo_combustible, estado } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO surtidores (numero, tipo_combustible, estado) VALUES ($1,$2,$3) RETURNING *',
      [numero, tipo_combustible, estado || 'activo']
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/surtidores/:id
router.put('/:id', auth('admin'), async (req, res) => {
  const { numero, tipo_combustible, estado } = req.body;
  try {
    const result = await pool.query(
      'UPDATE surtidores SET numero=$1, tipo_combustible=$2, estado=$3, updated_at=NOW() WHERE id=$4 RETURNING *',
      [numero, tipo_combustible, estado, req.params.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/surtidores/:id
router.delete('/:id', auth('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM surtidores WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Surtidor eliminado' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
