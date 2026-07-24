-- ═══════════════════════════════════════════════════════
--  Surtidor Valencia — Schema SQL completo
--  Base de datos: Supabase / PostgreSQL 14+
-- ═══════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── empleados ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS empleados (
  id            SERIAL       PRIMARY KEY,
  nombre        VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol           VARCHAR(20)  NOT NULL DEFAULT 'operador'
                CHECK (rol IN ('admin','supervisor','operador')),
  activo        BOOLEAN      NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── surtidores ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS surtidores (
  id               SERIAL       PRIMARY KEY,
  numero           INT          NOT NULL UNIQUE,
  tipo_combustible VARCHAR(50)  NOT NULL,
  estado           VARCHAR(20)  NOT NULL DEFAULT 'activo'
                   CHECK (estado IN ('activo','inactivo','mantenimiento')),
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── ventas ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ventas (
  id               SERIAL          PRIMARY KEY,
  surtidor_id      INT             NOT NULL REFERENCES surtidores(id),
  empleado_id      INT             NOT NULL REFERENCES empleados(id),
  litros           NUMERIC(10,3)   NOT NULL,
  precio_unitario  NUMERIC(10,4)   NOT NULL,
  total            NUMERIC(12,2)   NOT NULL,
  tipo_combustible VARCHAR(50)     NOT NULL,
  metodo_pago      VARCHAR(30)     NOT NULL DEFAULT 'efectivo'
                   CHECK (metodo_pago IN ('efectivo','tarjeta','transferencia')),
  metodo_pago_bits SMALLINT        NOT NULL DEFAULT 1,
  id_binario       BIGINT,
  fecha            TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ─── inventario ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventario (
  id               SERIAL          PRIMARY KEY,
  tipo_combustible VARCHAR(50)     NOT NULL UNIQUE,
  stock_actual     NUMERIC(12,3)   NOT NULL DEFAULT 0,
  stock_minimo     NUMERIC(12,3)   NOT NULL DEFAULT 1000,
  capacidad_maxima NUMERIC(12,3)   NOT NULL DEFAULT 50000,
  updated_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ─── alertas ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alertas (
  id           SERIAL      PRIMARY KEY,
  surtidor_id  INT         REFERENCES surtidores(id) ON DELETE SET NULL,
  tipo         VARCHAR(50) NOT NULL CHECK (tipo IN ('stock_bajo','surtidor_inactivo','mantenimiento','venta_alta','sistema')),
  mensaje      TEXT        NOT NULL,
  estado       VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','revisada','resuelta')),
  fecha        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Datos iniciales ──────────────────────────────────────
INSERT INTO empleados (nombre, email, password_hash, rol)
VALUES ('Administrador', 'admin@surtidor.com',
        '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8.mQGjGKOiW4Sj5l.qu', 'admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO surtidores (numero, tipo_combustible) VALUES
  (1, 'Gasolina 91'), (2, 'Gasolina 95'), (3, 'Gasoil'), (4, 'GLP')
ON CONFLICT (numero) DO NOTHING;

INSERT INTO inventario (tipo_combustible, stock_actual, stock_minimo, capacidad_maxima) VALUES
  ('Gasolina 91', 25000, 3000, 50000),
  ('Gasolina 95', 18000, 2000, 40000),
  ('Gasoil',      30000, 5000, 60000),
  ('GLP',         10000, 1000, 20000)
ON CONFLICT (tipo_combustible) DO NOTHING;
metodo_pago_bits text,
id_binario text