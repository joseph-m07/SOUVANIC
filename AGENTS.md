# AGENTS.md — Guía de Ingeniería para SOUVANIC

Este archivo define las reglas y convenciones obligatorias para cualquier agente o desarrollador que trabaje en **SOUVANIC** (Sistema de Facturación, Inventario y Socios para pulpería, tienda de ropa y delivery).

---

## 1. Arquitectura del Proyecto
- **Frontend (`frontend/`)**: HTML5 + CSS3 + JavaScript vanilla (`"use strict"`).
  - Páginas en `frontend/pages/` (`index.html`, `dashboard.html`, `productos.html`, `clientes.html`, `facturas.html`, `inventario.html`).
  - Núcleo en `frontend/js/core/` (`neurona.js`, `auth.js`, `sidebar.js`, `notificaciones.js`, `ui-estados.js`).
  - Módulos en `frontend/js/modules/` y utilidades en `frontend/js/utils/`.
- **Backend (`Backend/src/`)**: Node.js 24 + Express 5 + CommonJS.
  - `config/database.js`: Adaptador dual (**SQLite** con `node:sqlite` o **SQL Server** con `mssql/msnodesqlv8`).
  - `core/neurona.js`: Event Bus / Orquestador central de eventos de dominio.
  - `middlewares/auth.middleware.js`: `verificarToken` (JWT HS256) y `verificarRol(...)`.
  - `services/`: `schema.service.js`, `pagos.service.js`, `neurona.listeners.js`.
  - `controllers/` y `routes/`: Separación por dominio (`auth`, `productos`, `clientes`/`socios`, `facturas`, `dashboard`, `inventario`, `neurona`).
- **Documentación (`docs/`)**: `PRD.md`, `UI_UX.md`, `FLUJO_DE_TRABAJO.md`, `ANALISIS_FALLAS.md`.

---

## 2. Reglas de Desarrollo Obligatorias
1. **Compatibilidad Dual de Base de Datos**:
   - Toda consulta SQL debe funcionar tanto en **SQLite** como en **SQL Server**.
   - Usa consultas parametrizadas con `.input("nombre", sql.Tipo, valor)`.
   - Evita funciones exclusivas de T-SQL sin adaptación; para diferencias puntuales (`OUTPUT` vs `RETURNING`, `IdDeatlle` vs `IdDetalle`, `GROUP_CONCAT` vs `FOR XML PATH`), usa `isSqlite` desde `Backend/src/config/database.js`.
   - Toda nueva tabla o columna debe agregarse de forma **aditiva y no destructiva** en `Backend/src/services/schema.service.js` (tanto en `asegurarEsquemaSqlite` como en el bloque SQL Server).
2. **Integración con Neurona**:
   - Las mutaciones de negocio (`POST`, `PUT`, `PATCH`, `DELETE`) deben emitir su evento de dominio en `neurona.emitir("dominio:accion", payload, { origen, idUsuario })`.
   - Los listeners en `neurona.listeners.js` nunca deben lanzar excepciones sin control ni bloquear transacciones HTTP.
3. **Seguridad y Permisos**:
   - Todas las rutas de negocio requieren `verificarToken`.
   - Operaciones destructivas o administrativas (crear/editar productos, anular facturas, ajustes de inventario, eliminar socios, consultar `/neurona/eventos`) requieren `verificarRol("Administrador")`.
   - Nunca guardar secretos, `.env` ni bases `.db` en Git.
4. **Convenciones Frontend**:
   - Usar `fetchAutenticado(ruta, opciones)` de `frontend/js/core/auth.js` para llamadas al API.
   - Usar `SouvanicUI.notificar(...)` y `SouvanicUI.confirmar(...)` en lugar de `alert()` o `confirm()`.
   - Mantener los estados de tabla con `mostrarEstadoTabla` y `actualizarSinResultados` (`ui-estados.js`).
   - **Estándar de Listados**: Todo listado principal (Socios, Productos, Historial de Facturas, Inventario) debe usar filas estilo lista (`tr.socio-fila` dentro de `table.tabla-socios-lista`) con un único indicador **`>`** (`.socio-chevron-btn`) en la última columna (`.col-chevron`) sin botones inline repetidos; al hacer clic en la fila o en `>`, se abre una ventana modal de detalle y opciones (`.socio-opciones-modal`).

---

## 3. Comandos de Verificación
- **Sembrar datos de prueba (SQLite)**: `cd Backend && npm run seed`
- **Iniciar Backend**: `cd Backend && npm start` (puerto `3000`)
- **Validar sintaxis JS**: `node --check <archivo.js>`

---

## 4. Skills Disponibles en el Workspace
- `ui-ux-souvanic`: Diseño de interfaces, paleta, componentes, modales y accesibilidad.
- `backend-dual-db`: Creación de rutas/controladores compatibles con SQLite y SQL Server + Neurona.
- `frontend-modulo-souvanic`: Construcción de pantallas y módulos JS conectados al App Shell.
- `qa-playwright-souvanic`: Pruebas de arranque, verificación E2E con Playwright y validación de regresiones.
