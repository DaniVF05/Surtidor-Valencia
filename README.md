# ⛽ Surtidor Valencia

Sistema de gestión integral para surtidores y estaciones de servicio en Valencia.

## 📋 Descripción

**Surtidor Valencia** es una aplicación web diseñada para la gestión y monitoreo de estaciones de servicio (gasolineras) en la región de Valencia. Permite controlar inventario de combustibles, ventas, turnos de empleados y reportes en tiempo real.

## 🚀 Características

- 📊 **Dashboard en tiempo real** — Monitoreo de ventas y stock de combustibles
- ⛽ **Gestión de surtidores** — Control individual de cada surtidor/bomba
- 👥 **Gestión de empleados** — Turnos, permisos y asignaciones
- 📦 **Control de inventario** — Alertas de stock mínimo y reabastecimiento
- 🧾 **Reportes y estadísticas** — Exportación a PDF/Excel
- 🔐 **Sistema de autenticación** — Roles de administrador, supervisor y operador
- 📱 **Diseño responsivo** — Compatible con móviles y tablets

## 🛠️ Tecnologías

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML5, CSS3, JavaScript (Vanilla) |
| Backend | Node.js / Express |
| Base de datos | PostgreSQL |
| Autenticación | JWT |
| Reportes | PDFKit, ExcelJS |

## 📁 Estructura del Proyecto

```
Surtidor-Valencia/
├── 📂 frontend/          # Interfaz de usuario
│   ├── index.html        # Página principal / Login
│   ├── dashboard.html    # Panel de control
│   ├── css/              # Estilos
│   └── js/               # Lógica del cliente
├── 📂 backend/           # Servidor y API REST
│   ├── server.js         # Punto de entrada
│   ├── routes/           # Rutas de la API
│   ├── models/           # Modelos de datos
│   └── middleware/       # Middlewares (auth, logs)
├── 📂 database/          # Scripts SQL y migraciones
├── 📂 docs/              # Documentación adicional
├── .gitignore
├── package.json
└── README.md
```

## ⚙️ Instalación y Configuración

### Prerrequisitos

- Node.js v18+
- PostgreSQL 14+
- npm o yarn

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/DaniVF05/Surtidor-Valencia.git
cd Surtidor-Valencia

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de base de datos

# 4. Ejecutar migraciones
npm run db:migrate

# 5. Iniciar el servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🔑 Variables de Entorno

Crea un archivo `.env` basado en `.env.example`:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=surtidor_valencia
DB_USER=postgres
DB_PASSWORD=tu_password
JWT_SECRET=tu_jwt_secret_muy_seguro
NODE_ENV=development
```

## 📸 Capturas de Pantalla

> *Próximamente...*

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Haz un **Fork** del proyecto
2. Crea tu rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commitea tus cambios (`git commit -m 'Add: nueva funcionalidad'`)
4. Haz push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un **Pull Request**

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

## 👤 Autor

**DaniVF05**
- GitHub: [@DaniVF05](https://github.com/DaniVF05)

---

<div align="center">
  <strong>⛽ Surtidor Valencia — Gestión Inteligente de Estaciones de Servicio</strong>
</div>
