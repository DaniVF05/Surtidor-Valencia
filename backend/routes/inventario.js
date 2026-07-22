const express = require('express');
const pool    = require('../config/db');
const auth    = require('../middleware/auth');
const router  = express.Router();

router.get('/', auth(), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inventario ORDER BY tipo_combustible');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:tipo', auth('admin', 'supervisor'), async (req, res) => {
  const { stock_actual, stock_minimo, capacidad_maxima } = req.body;
  try {
    const result = await pool.query(
      `UPDATE inventario
       SET stock_actual=$1, stock_minimo=$2, capacidad_maxima=$3, updated_at=NOW()
       WHERE tipo_combustible=$4 RETURNING *`,
      [stock_actual, stock_minimo, capacidad_maxima, req.params.tipo]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/inventario/reabastecimiento
router.post('/reabastecimiento', auth('admin', 'supervisor'), async (req, res) => {
  const { tipo_combustible, cantidad } = req.body;
  try {
    const result = await pool.query(
      `UPDATE inventario
       SET stock_actual = LEAST(stock_actual + $1, capacidad_maxima), updated_at=NOW()
       WHERE tipo_combustible = $2 RETURNING *`,
      [cantidad, tipo_combustible]
    );
    res.json({ success: true, data: result.rows[0], message: 'Reabastecimiento registrado' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
