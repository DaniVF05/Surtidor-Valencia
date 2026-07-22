# Guía de Configuración — Surtidor Valencia

## 1. Crear la base de datos

```bash
psql -U postgres -c "CREATE DATABASE surtidor_valencia;"
psql -U postgres -d surtidor_valencia -f database/schema.sql
```

## 2. Credenciales por defecto

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| admin@surtidor.com | Admin1234! | Administrador |

> ⚠️ Cambia la contraseña inmediatamente al hacer el primer login.

## 3. Estructura de la API REST

| Método | Endpoint | Descripción |
|--------|---------|-------------|
| POST | /api/auth/login | Iniciar sesión |
| GET | /api/surtidores | Listar surtidores |
| POST | /api/surtidores | Crear surtidor |
| GET | /api/ventas | Listar ventas |
| POST | /api/ventas | Registrar venta |
| GET | /api/ventas/resumen/hoy | Resumen del día |
| GET | /api/inventario | Estado del inventario |
| POST | /api/inventario/reabastecimiento | Reabastecer |
| GET | /api/empleados | Listar empleados |
| POST | /api/empleados | Crear empleado |
| GET | /api/reportes/ventas-diarias | Reporte diario |
| GET | /api/reportes/resumen-mensual | Reporte mensual |

## 4. Roles y permisos

| Recurso | Admin | Supervisor | Operador |
|---------|-------|-----------|---------|
| Ver dashboard | ✅ | ✅ | ✅ |
| Registrar ventas | ✅ | ✅ | ✅ |
| Ver inventario | ✅ | ✅ | ✅ |
| Modificar inventario | ✅ | ✅ | ❌ |
| Gestionar empleados | ✅ | ❌ | ❌ |
| Gestionar surtidores | ✅ | ❌ | ❌ |
| Ver reportes | ✅ | ✅ | ❌ |
