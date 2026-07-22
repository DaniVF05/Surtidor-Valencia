const express = require('express');
const pool    = require('../config/db');
const auth    = require('../middleware/auth');
const router  = express.Router();

// GET /api/ventas
router.get('/', auth(), async (req, res) => {
  const { desde, hasta, surtidor_id } = req.query;
  let query = `SELECT v.*, s.numero AS surtidor_numero, e.nombre AS empleado_nombre
               FROM ventas v
               JOIN surtidores s ON s.id = v.surtidor_id
               JOIN empleados  e ON e.id = v.empleado_id
               WHERE 1=1`;
  const params = [];
  if (desde)        { params.push(desde);        query += ` AND DATE(v.fecha) >= $${params.length}`; }
  if (hasta)        { params.push(hasta);         query += ` AND DATE(v.fecha) <= $${params.length}`; }
  if (surtidor_id)  { params.push(surtidor_id);   query += ` AND v.surtidor_id = $${params.length}`; }
  query += ' ORDER BY v.fecha DESC LIMIT 500';
  try {
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/ventas
router.post('/', auth(), async (req, res) => {
  const { surtidor_id, litros, precio_unitario, tipo_combustible, metodo_pago } = req.body;
  const total = litros * precio_unitario;
  try {
    const result = await pool.query(
      `INSERT INTO ventas (surtidor_id, empleado_id, litros, precio_unitario, total, tipo_combustible, metodo_pago)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [surtidor_id, req.user.id, litros, precio_unitario, total, tipo_combustible, metodo_pago || 'efectivo']
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/ventas/resumen/hoy
router.get('/resumen/hoy', auth(), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*)                    AS total_transacciones,
        COALESCE(SUM(litros), 0)    AS total_litros,
        COALESCE(SUM(total), 0)     AS total_ingresos,
        tipo_combustible
      FROM ventas
      WHERE DATE(fecha) = CURRENT_DATE
      GROUP BY tipo_combustible
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
