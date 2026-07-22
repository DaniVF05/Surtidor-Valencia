const express = require('express');
const pool    = require('../config/db');
const auth    = require('../middleware/auth');
const router  = express.Router();

// GET /api/reportes/ventas-diarias
router.get('/ventas-diarias', auth('admin', 'supervisor'), async (req, res) => {
  const { desde, hasta } = req.query;
  try {
    const result = await pool.query(`
      SELECT
        DATE(fecha)              AS dia,
        tipo_combustible,
        COUNT(*)                 AS transacciones,
        SUM(litros)              AS litros,
        SUM(total)               AS ingresos
      FROM ventas
      WHERE DATE(fecha) BETWEEN $1 AND $2
      GROUP BY DATE(fecha), tipo_combustible
      ORDER BY dia DESC
    `, [desde || 'now()-30 days', hasta || 'now()']);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reportes/resumen-mensual
router.get('/resumen-mensual', auth('admin', 'supervisor'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        TO_CHAR(fecha, 'YYYY-MM') AS mes,
        SUM(total)                AS ingresos,
        SUM(litros)               AS litros,
        COUNT(*)                  AS transacciones
      FROM ventas
      WHERE fecha >= NOW() - INTERVAL '12 months'
      GROUP BY TO_CHAR(fecha, 'YYYY-MM')
      ORDER BY mes DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
