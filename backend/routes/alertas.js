const express = require('express');
const pool    = require('../config/db');
const auth    = require('../middleware/auth');
const router  = express.Router();

// GET /api/alertas
router.get('/', auth(), async (req, res) => {
  const { estado, tipo } = req.query;
  let query = 'SELECT a.*, s.numero AS surtidor_numero FROM alertas a LEFT JOIN surtidores s ON s.id = a.surtidor_id WHERE 1=1';
  const params = [];
  if (estado) { params.push(estado); query += ` AND a.estado = $${params.length}`; }
  if (tipo)   { params.push(tipo);   query += ` AND a.tipo   = $${params.length}`; }
  query += ' ORDER BY a.fecha DESC LIMIT 100';
  try {
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/alertas/pendientes/count
router.get('/pendientes/count', auth(), async (req, res) => {
  try {
    const result = await pool.query("SELECT COUNT(*) AS total FROM alertas WHERE estado = 'pendiente'");
    res.json({ success: true, count: parseInt(result.rows[0].total) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/alertas/:id — actualizar estado
router.put('/:id', auth(), async (req, res) => {
  const { estado } = req.body;
  try {
    const result = await pool.query(
      'UPDATE alertas SET estado = $1 WHERE id = $2 RETURNING *',
      [estado, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Alerta no encontrada' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/alertas — crear alerta manual
router.post('/', auth('admin'), async (req, res) => {
  const { surtidor_id, tipo, mensaje } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO alertas (surtidor_id, tipo, mensaje) VALUES ($1,$2,$3) RETURNING *',
      [surtidor_id || null, tipo, mensaje]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/alertas/:id
router.delete('/:id', auth('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM alertas WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Alerta eliminada' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
