require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares ─────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Servir archivos estáticos del frontend ──────────────────
app.use(express.static(path.join(__dirname, '../frontend')));

// ── Rutas de la API ─────────────────────────────────────────
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/surtidores', require('./routes/surtidores'));
app.use('/api/ventas',     require('./routes/ventas'));
app.use('/api/empleados',  require('./routes/empleados'));
app.use('/api/inventario', require('./routes/inventario'));
app.use('/api/reportes',   require('./routes/reportes'));

// ── Ruta catch-all → SPA ────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ── Manejo global de errores ─────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
  });
});

// ── Iniciar servidor ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n⛽  Surtidor Valencia corriendo en http://localhost:${PORT}`);
  console.log(`📅  ${new Date().toLocaleString('es-VE')}\n`);
});

module.exports = app;
