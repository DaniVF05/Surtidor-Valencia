# ⛽ Surtidor Valencia

> Sistema de gestión integral para surtidores y estaciones de servicio en Valencia.

<div align="center">

[![GitHub](https://img.shields.io/badge/GitHub-DaniVF05%2FSurtidor--Valencia-181717?style=for-the-badge&logo=github)](https://github.com/DaniVF05/Surtidor-Valencia)
[![Figma](https://img.shields.io/badge/Figma-Prototipo%20UI-F24E1E?style=for-the-badge&logo=figma&logoColor=white)](https://www.figma.com/design/D4svio4I9ps7eLg1d9eG98/PROTOTIPOGASOLINERA?node-id=0-1&t=6c3evqsbTNJ5FcD4-1)
[![Node.js](https://img.shields.io/badge/Node.js-v24-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![License](https://img.shields.io/badge/License-MIT-f59e0b?style=for-the-badge)](LICENSE)

</div>

---

## 📋 Descripción

**Surtidor Valencia** es una aplicación web full-stack para la gestión y monitoreo de estaciones de servicio. Permite controlar inventario de combustibles, ventas, empleados y alertas en tiempo real, con arquitectura basada en patrones de diseño clásicos (GoF).

---

## 🎨 Prototipo UI — Figma

> Accede al prototipo interactivo de todas las pantallas del sistema:

**🔗 [Ver Prototipo en Figma](FIGMA_LINK_AQUI)**

Pantallas incluidas:
- 🔐 Login
- 📊 Dashboard principal
- ⛽ Gestión de surtidores
- 🧾 Registro de ventas
- 📦 Control de inventario
- 🔔 Panel de alertas
- 📈 Reportes y estadísticas

---

## 🚀 Características

| Módulo | Descripción |
|--------|-------------|
| 📊 Dashboard | Métricas en tiempo real: ingresos, litros, transacciones, alertas |
| ⛽ Surtidores | CRUD completo + estado activo/inactivo/mantenimiento |
| 🧾 Ventas | Registro con aritmética binaria (BigInt) + Observer automático |
| 📦 Inventario | Barras de progreso + alertas de stock mínimo automáticas |
| 🔔 Alertas | Sistema Observer: stock bajo, ventas altas, estados por tipo |
| 👥 Empleados | Gestión de roles (admin/supervisor/operador) + JWT auth |
| 📈 Reportes | Reporte diario + por surtidor + exportación JSON con decodificadores |
| 🎙️ Voz | Web Speech API: navegación por comandos de voz (Chrome/Edge) |

---

## 🏗️ Patrones de Diseño (GoF)

```
Patrón Creacional  →  SurtidorFactory     (Factory Method)
Patrón Estructural →  DatabaseAdapter     (Adapter)
Patrón Comportamiento → AlertaObserver    (Observer)
```

### Factory Method — `SurtidorFactory`
Crea instancias de surtidor según tipo de combustible, encapsulando configuración (capacidad, precio base, unidad) por tipo.

### Adapter — `DatabaseAdapter`
Envuelve `pg.Pool` en una interfaz genérica `{ query, findById, create, update, remove }`. Permite cambiar de PostgreSQL a cualquier otra BD sin tocar las rutas.

### Observer — `AlertaObserver`
`AlertaSubject` notifica a `StockObserver` y `VentaAltaObserver` al registrar cada venta. Genera alertas automáticas en BD si el stock cae bajo el mínimo o si la venta supera el umbral definido.

---

## 🔢 Aritmética Binaria

Implementada en `backend/utils/binaryArithmetic.js`:

| Función | Descripción |
|---------|-------------|
| `calcularTotal(litros, precio)` | Usa BigInt en centavos, evita errores de punto flotante |
| `codificarMetodoPago(metodo)` | Mapeo a bitmask: efectivo=`0b001`, tarjeta=`0b010`, transferencia=`0b100` |
| `decodificarMetodoPago(bits)` | Inverso del anterior |
| `generarIdBinario(surtidorId, fecha)` | ID compuesto por shift de bits: `surtidorId << 32 \| timestamp` |
| `decodificarFecha(timestamp)` | Desempaqueta fecha en campos `{ anio, mes, dia, hora, minuto }` |

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML5, CSS3 (Vanilla), JavaScript ES2022 |
| Backend | Node.js v24 + Express 4 |
| Base de datos | Supabase (PostgreSQL 14+) |
| Autenticación | JWT (jsonwebtoken + bcryptjs) |
| Patrones | Factory, Adapter, Observer (GoF) |
| Voz | Web Speech API (SpeechRecognition) |
| Testing | Jest + Supertest |
| CI/CD | GitHub Actions |
| Deploy | Render |

---

## 📁 Estructura del Proyecto

```
Surtidor-Valencia/
├── 📂 backend/
│   ├── config/db.js              # Pool PostgreSQL con SSL (Supabase)
│   ├── middleware/auth.js        # JWT middleware con roles
│   ├── patterns/
│   │   ├── SurtidorFactory.js   # Patrón Factory
│   │   ├── DatabaseAdapter.js   # Patrón Adapter
│   │   └── AlertaObserver.js    # Patrón Observer
│   ├── routes/
│   │   ├── auth.js, surtidores.js, ventas.js
│   │   ├── inventario.js, empleados.js
│   │   ├── alertas.js, reportes.js
│   └── utils/
│       └── binaryArithmetic.js  # Operaciones binarias y BigInt
├── 📂 frontend/
│   ├── index.html               # Login
│   ├── dashboard.html           # SPA principal (7 páginas)
│   ├── css/style.css            # Design system completo
│   └── js/
│       ├── login.js
│       └── dashboard.js         # SPA + Web Speech API
├── 📂 database/
│   ├── schema.sql               # Tablas: empleados, surtidores, ventas, inventario, alertas
│   ├── migrate.js               # Script de migración
│   └── fix_password.js          # Utilidad de mantenimiento
├── 📂 tests/
│   ├── patterns.test.js         # 15 tests (Factory, Adapter, Observer)
│   └── binaryArithmetic.test.js # 20 tests de aritmética binaria
├── 📂 .github/workflows/
│   └── ci.yml                   # Pipeline: test → sonar → deploy
├── .env.example
├── render.yaml                  # Config deploy Render
├── sonar-project.properties     # Config SonarQube
└── package.json
```

---

## ⚙️ Instalación

### Prerrequisitos
- Node.js v18+
- Cuenta en [Supabase](https://supabase.com)

### Pasos

```bash
# 1. Clonar
git clone https://github.com/DaniVF05/Surtidor-Valencia.git
cd Surtidor-Valencia

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Supabase

# 4. Migrar base de datos
node database/migrate.js

# 5. Iniciar servidor
npm run dev
# → http://localhost:3000
```

### Credenciales por defecto
```
Email:    admin@surtidor.com
Password: Admin1234!
```

---

## 🔑 Variables de Entorno

```env
DATABASE_URL=postgresql://postgres:PASSWORD@db.XXXX.supabase.co:5432/postgres
SUPABASE_URL=https://XXXX.supabase.co
SUPABASE_ANON_KEY=tu_anon_key
PORT=3000
NODE_ENV=development
JWT_SECRET=tu_secret_seguro
JWT_EXPIRES_IN=8h
```

---

## 🧪 Tests

```bash
npm test                # Suite completa (35 tests)
npm run test:coverage   # Con reporte de cobertura
```

```
Tests: patterns.test.js        — Factory, Adapter, Observer (15 tests)
       binaryArithmetic.test.js — BigInt, bitmask, round-trip (20 tests)
```

---

## 🎙️ Comandos de Voz (Web Speech API)

> Solo Chrome y Edge. Haz clic en el botón 🎙️ en el topbar.

| Comando | Acción |
|---------|--------|
| "ir a ventas" / "ventas" | Navega a ventas |
| "dashboard" / "inicio" | Navega al dashboard |
| "alertas" / "mostrar alertas" | Navega a alertas |
| "surtidores" | Navega a surtidores |
| "reportes" | Navega a reportes |
| "actualizar" | Recarga la página actual |
| "cerrar sesión" | Logout |

---

## 🚀 Deploy

### Render (recomendado)
El archivo `render.yaml` configura automáticamente el servicio. Conecta el repo en [render.com](https://render.com) y agrega las variables de entorno.

### GitHub Actions (CI/CD)
Pipeline en `.github/workflows/ci.yml`:
1. ✅ Tests con cobertura
2. ✅ SonarQube scan
3. ✅ Deploy automático a Render en push a `main`

Secrets requeridos: `DATABASE_URL`, `JWT_SECRET`, `RENDER_DEPLOY_HOOK`, `SONAR_TOKEN`, `SONAR_HOST_URL`

---

## 👤 Autor

**DaniVF05**
- GitHub: [@DaniVF05](https://github.com/DaniVF05)

---

<div align="center">
  <strong>⛽ Surtidor Valencia — Gestión Inteligente de Estaciones de Servicio</strong><br/>
  <sub>Node.js · Supabase · Factory · Adapter · Observer · Web Speech API</sub>
</div>
