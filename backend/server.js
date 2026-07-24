require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const path    = require('path');
const pool    = require('./config/db');
const { alertaSubject, StockObserver, VentaAltaObserver } = require('./patterns/AlertaObserver');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Inicializar Observer (registrar observadores) ────────────────
const stockObs   = new StockObserver(pool);
const ventaObs   = new VentaAltaObserver(pool, 300);
alertaSubject.subscribe(stockObs);
alertaSubject.subscribe(ventaObs);

// ── Middlewares ─────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Servir archivos estáticos del frontend ──────────────────────
app.use(express.static(path.join(__dirname, '../frontend')));

// ── Rutas de la API ─────────────────────────────────────────────
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/surtidores', require('./routes/surtidores'));
app.use('/api/ventas',     require('./routes/ventas'));
app.use('/api/empleados',  require('./routes/empleados'));
app.use('/api/inventario', require('./routes/inventario'));
app.use('/api/reportes',   require('./routes/reportes'));
app.use('/api/alertas',    require('./routes/alertas'));

// ── Catch-all → SPA ─────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ── Error handler ────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
  });
});

// ── Start ────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n⛽  Surtidor Valencia → http://localhost:${PORT}`);
  console.log(`🗄️   Supabase PostgreSQL conectado`);
  console.log(`👁️   Observer activo: StockObserver, VentaAltaObserver`);
  console.log(`📅  ${new Date().toLocaleString('es-VE')}\n`);
});

module.exports = app;
