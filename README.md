# SOUVANIC — Sistema de Facturación, Inventario y Socios

Sistema web para la gestión comercial de inventario, socios de negocio (clientes, proveedores y empleados), facturación multipago e indicadores operativos, con arquitectura modular y núcleo central de eventos (**Neurona**).

---

## Estructura del Proyecto

```text
SOUVANIC/
├── Backend/
│   ├── package.json
│   └── src/
│       ├── server.js                  # Punto de entrada Express + Neurona
│       ├── config/database.js         # Adaptador dual (SQLite / SQL Server)
│       ├── core/neurona.js            # Event Bus / Orquestador Backend
│       ├── middlewares/auth.middleware.js
│       ├── services/
│       │   ├── schema.service.js      # Migraciones aditivas y esquema SQLite
│       │   ├── pagos.service.js       # Validación manual de pagos
│       │   └── neurona.listeners.js   # Sinapsis de stock bajo y auditoría
│       ├── controllers/               # auth, productos, clientes/socios, facturas, dashboard, inventario
│       ├── routes/                    # Rutas REST + /neurona/estado y /neurona/eventos
│       └── scripts/                   # seed.js, crear-admin.js, crear-vendedor.js
├── frontend/
│   ├── assets/                        # Logo.png, paisaje.jpg
│   ├── css/style.css
│   ├── js/
│   │   ├── core/                      # neurona.js, auth.js, sidebar.js, notificaciones.js, ui-estados.js
│   │   ├── modules/                   # login.js, dashboard.js, productos.js, clientes.js, facturas.js, inventario.js
│   │   └── utils/                     # categorias.js, xlsx-export.js
│   └── pages/                         # index.html, dashboard.html, productos.html, clientes.html, facturas.html, inventario.html
└── docs/
    ├── PRD.md                         # Requerimientos del producto
    ├── UI_UX.md                       # Sistema de diseño y UX
    ├── FLUJO_DE_TRABAJO.md            # Diagramas de flujo y operación
    └── ANALISIS_FALLAS.md             # Análisis de fallas y riesgos
```

---

## Requisitos
- **Node.js 24+** (incluye `node:sqlite` nativo para ejecutar sin SQL Server).
- *(Opcional)* **SQL Server** + ODBC Driver 18 si se utiliza en modo `sqlserver`.

---

## Puesta en Marcha Rápida (Modo SQLite)

1. **Instalar dependencias del Backend**:
   ```powershell
   cd Backend
   npm install
   ```

2. **Configurar `Backend/.env`**:
   ```env
   DB_CLIENT=sqlite
   PORT=3000
   JWT_SECRET=cambia-esta-clave-secreta
   ```
   > Para usar SQL Server en lugar de SQLite, configura `DB_CLIENT=sqlserver`, `DB_DATABASE=TuBaseDeDatos`, `DB_SERVER` y `DB_PORT`.

3. **Cargar datos de prueba (opcional)**:
   ```powershell
   npm run seed
   ```

4. **Iniciar el servidor Backend**:
   ```powershell
   npm start
   ```
   El API quedará disponible en `http://localhost:3000`.

5. **Abrir el Frontend**:
   Sirve la carpeta raíz del proyecto en un servidor estático (por ejemplo Live Server en el puerto `8080`) y abre:
   `http://localhost:8080/frontend/pages/index.html`

### Credenciales de Prueba (tras ejecutar `npm run seed`)
| Rol | Usuario | Contraseña |
| :--- | :--- | :--- |
| **Administrador** | `admin` | `admin123456` |
| **Vendedor** | `vendedor` | `vendedor123` |

---

## Módulos Principales
- **Dashboard**: KPIs diarios y mensuales, productos más vendidos, tendencia de 7 días y alertas de inventario.
- **Productos**: Catálogo con categorías, control de estado activo/inactivo y `StockMinimo`.
- **Socios (`/socios` y `/clientes`)**: Gestión unificada con clasificación múltiple (**Cliente**, **Proveedor**, **Empleado**).
- **Facturación**: Emisión transaccional con idempotencia, pagos combinados (`Efectivo`, `Tarjeta`, `Transferencia`), anulación con restauración de stock y exportación a `.xlsx`.
- **Inventario**: Alertas de stock bajo/agotado y kardex de movimientos.
- **Neurona**: Bus de eventos desacoplado (`GET /neurona/estado` y `GET /neurona/eventos` para Administrador).

---

## Documentación Técnica
- [PRD.md](docs/PRD.md)
- [UI_UX.md](docs/UI_UX.md)
- [FLUJO_DE_TRABAJO.md](docs/FLUJO_DE_TRABAJO.md)
- [ANALISIS_FALLAS.md](docs/ANALISIS_FALLAS.md)
