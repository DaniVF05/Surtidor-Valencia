const express = require('express');
const pool    = require('../config/db');
const auth    = require('../middleware/auth');
const router  = express.Router();
const { decodificarFecha, decodificarMetodoPago, decodificarIdBinario } = require('../utils/binaryArithmetic');

// GET /api/reportes/diario — reporte del día con decodificadores binarios
router.get('/diario', auth(), async (req, res) => {
  const fecha = req.query.fecha || new Date().toISOString().split('T')[0];
  try {
    const [ventasRes, surtidoresRes, inventarioRes] = await Promise.all([
      pool.query(`
        SELECT v.*, s.numero AS surtidor_numero, e.nombre AS empleado_nombre
        FROM ventas v
        JOIN surtidores s ON s.id = v.surtidor_id
        JOIN empleados  e ON e.id = v.empleado_id
        WHERE DATE(v.fecha) = $1
        ORDER BY v.fecha
      `, [fecha]),
      pool.query('SELECT * FROM surtidores ORDER BY numero'),
      pool.query('SELECT * FROM inventario'),
    ]);

    const ventas = ventasRes.rows.map(v => ({
      ...v,
      fecha_decodificada:  decodificarFecha(v.fecha),
      metodo_decodificado: decodificarMetodoPago(v.metodo_pago_bits || 1),
      id_binario_info:     v.id_binario ? decodificarIdBinario(BigInt(v.id_binario)) : null,
      total:               parseFloat(v.total),
      litros:              parseFloat(v.litros),
    }));

    const totalIngresos      = ventas.reduce((s, v) => s + v.total, 0);
    const totalLitros        = ventas.reduce((s, v) => s + v.litros, 0);
    const porMetodo          = {};
    ventas.forEach(v => {
      const m = v.metodo_decodificado;
      porMetodo[m] = (porMetodo[m] || 0) + v.total;
    });

    const porCombustible = {};
    ventas.forEach(v => {
      if (!porCombustible[v.tipo_combustible]) {
        porCombustible[v.tipo_combustible] = { litros: 0, total: 0, transacciones: 0 };
      }
      porCombustible[v.tipo_combustible].litros        += v.litros;
      porCombustible[v.tipo_combustible].total         += v.total;
      porCombustible[v.tipo_combustible].transacciones += 1;
    });

    res.json({
      success: true,
      data: {
        fecha,
        resumen: {
          total_ingresos:      totalIngresos.toFixed(2),
          total_litros:        totalLitros.toFixed(3),
          total_transacciones: ventas.length,
          por_metodo_pago:     porMetodo,
          por_combustible:     porCombustible,
        },
        surtidores:  surtidoresRes.rows,
        inventario:  inventarioRes.rows,
        ventas,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reportes/surtidor/:id
router.get('/surtidor/:id', auth(), async (req, res) => {
  const { id } = req.params;
  const { desde, hasta } = req.query;
  const d = desde || new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const h = hasta || new Date().toISOString().split('T')[0];
  try {
    const result = await pool.query(`
      SELECT DATE(v.fecha) AS dia,
             COUNT(*)      AS transacciones,
             SUM(litros)   AS litros,
             SUM(total)    AS ingresos
      FROM ventas v
      WHERE v.surtidor_id = $1 AND DATE(v.fecha) BETWEEN $2 AND $3
      GROUP BY dia ORDER BY dia
    `, [id, d, h]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reportes/export — JSON estructurado para descarga
router.get('/export', auth(), async (req, res) => {
  const { desde, hasta } = req.query;
  const d = desde || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  const h = hasta || new Date().toISOString().split('T')[0];
  try {
    const result = await pool.query(`
      SELECT v.id, v.fecha, v.tipo_combustible, v.litros, v.precio_unitario,
             v.total, v.metodo_pago, v.metodo_pago_bits, v.id_binario,
             s.numero AS surtidor, e.nombre AS empleado
      FROM ventas v
      JOIN surtidores s ON s.id = v.surtidor_id
      JOIN empleados  e ON e.id = v.empleado_id
      WHERE DATE(v.fecha) BETWEEN $1 AND $2
      ORDER BY v.fecha
    `, [d, h]);

    const exportData = {
      generado: new Date().toISOString(),
      periodo:  { desde: d, hasta: h },
      total_registros: result.rows.length,
      ventas: result.rows.map(v => ({
        ...v,
        fecha_decodificada:  decodificarFecha(v.fecha),
        metodo_decodificado: decodificarMetodoPago(v.metodo_pago_bits || 1),
      })),
    };

    res.setHeader('Content-Disposition', `attachment; filename="reporte_${d}_${h}.json"`);
    res.json(exportData);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
