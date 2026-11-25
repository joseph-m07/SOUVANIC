# Análisis de Posibles Fallas y Riesgos — SOUVANIC

Este análisis se basa en la inspección directa del código fuente actual del proyecto tras su modularización.

---

## 1. Fallas Críticas / Altas (Prioridad Inmediata)

### 1.1 Gestión de Conexiones SQL Server (`sql.connect(config)` por petición)
- **Dónde**: `Backend/src/controllers/*.js`, `Backend/src/middlewares/auth.middleware.js`, `Backend/src/services/schema.service.js`.
- **Problema**: Cada controlador y el middleware `verificarToken` llaman a `await sql.connect(config)` en cada request. Aunque `mssql` intenta reutilizar el pool global, llamar `connect()` repetidamente bajo concurrencia o tras una caída momentánea de SQL Server puede provocar errores de estado del pool o latencia extra en cada endpoint.
- **Mitigación**: Crear un singleton `getPool()` en `Backend/src/config/database.js` que inicialice `new sql.ConnectionPool(config).connect()` una sola vez y maneje reconexión controlada.

### 1.2 Configuración de Servidor SQL Hardcodeada
- **Dónde**: `Backend/src/config/database.js` (`Server=tcp:127.0.0.1,56238;`).
- **Problema**: El host y puerto (`56238`) están fijos en código. Si cambia la instancia de SQL Server o se despliega en otro equipo, la aplicación fallará al conectar.
- **Mitigación**: Mover `DB_SERVER`, `DB_PORT` y `DB_TRUSTED_CONNECTION` a variables de entorno en `.env` con valores por defecto.

### 1.3 URL del Backend Hardcodeada en Frontend
- **Dónde**: `frontend/js/core/auth.js` (`const API_URL = "http://localhost:3000"`) y `frontend/js/modules/login.js` (`fetch("http://localhost:3000/login")`).
- **Problema**: Si el frontend se abre desde otro dispositivo en la red local (ej. una tablet o caja secundaria) o detrás de un dominio/puerto distinto, todas las peticiones fallarán apuntando al `localhost` del cliente. Además, `login.js` no reutiliza la constante central de `auth.js`.
- **Mitigación**: Centralizar `API_URL` en un único archivo de configuración frontend (o derivarlo dinámicamente de `window.location.hostname`).

### 1.4 Endpoint `/test-db` Expuesto Sin Autenticación
- **Dónde**: `Backend/src/routes/auth.routes.js` -> `GET /test-db`.
- **Problema**: Cualquier usuario no autenticado puede consultar el nombre de la base de datos y, en caso de fallo, recibir `error.message` con detalles internos de infraestructura/ODBC.
- **Mitigación**: Proteger `/test-db` con `verificarToken` y `verificarRol("Administrador")`, o devolver solo estado `"ok"`/`"error"` sin detalles internos en producción.

---

## 2. Fallas Medias (Seguridad, Rendimiento y Resiliencia)

### 2.1 Falta de Rate Limiting en `/login` y CORS Abierto
- **Dónde**: `Backend/src/server.js` (`app.use(cors())`) y `Backend/src/routes/auth.routes.js`.
- **Problema**: `POST /login` no tiene límite de intentos, lo que permite ataques de fuerza bruta. `cors()` sin `origin` restringido permite peticiones desde cualquier dominio web si el usuario tiene sesión/red local expuesta.
- **Mitigación**: Agregar `express-rate-limit` en `/login` y configurar `CORS_ORIGIN` desde `.env`.

### 2.2 Arranque Silencioso ante Fallo de `asegurarEsquemaIntegral()`
- **Dónde**: `Backend/src/services/schema.service.js`.
- **Problema**: El bloque `try/catch` captura cualquier error de SQL Server y solo imprime `console.error(...)`, permitiendo que Express levante el puerto `3000` aunque la base de datos no esté accesible o falten columnas críticas.
- **Mitigación**: Propagar el error en arranque (o marcar el servicio como `degraded` en `/`) para detectar fallos de infraestructura inmediatamente.

### 2.3 Ausencia de Paginación en Consultas de Listado
- **Dónde**: `GET /productos`, `GET /clientes`, `GET /facturas`, `GET /inventario/movimientos`.
- **Problema**: Las consultas devuelven todos los registros históricos sin `OFFSET/FETCH` ni límite máximo. Con miles de facturas o movimientos, aumentará el consumo de RAM en Node.js y el tiempo de renderizado en el navegador.
- **Mitigación**: Implementar paginación (`page`, `limit`) y filtros en SQL Server.

### 2.4 Inconsistencia de Scripts en `dashboard.html` y Enlace Huérfano en `index.html`
- **Dónde**: `frontend/pages/dashboard.html` y `frontend/pages/index.html`.
- **Problema**:
  - `dashboard.html` no carga `notificaciones.js` ni `ui-estados.js`, por lo que `window.SouvanicUI` no estará disponible si `Neurona` o `dashboard.js` intentan mostrar un toast allí.
  - `index.html` tiene `<a href="#">¿Olvidaste tu contraseña?</a>` sin acción implementada, lo que genera confusión al usuario.

### 2.5 Dependencia de CDNs Externos y Expiración de Sesión
- **Dónde**: `frontend/pages/*.html` (Google Fonts y `cdn.jsdelivr.net`), `Backend/src/controllers/auth.controller.js` (`expiresIn: "2h"`).
- **Problema**:
  - Si el punto de venta pierde acceso a internet, los íconos de Bootstrap Icons no cargarán.
  - Si un vendedor tarda más de 2 horas con la pestaña abierta sin recargar, al intentar emitir una factura recibirá `401` y perderá el formulario actual al ser redirigido a `index.html`.

---

## 3. Fallas Bajas / Deuda Técnica

| Área | Hallazgo | Impacto | Acción Recomendada |
| :--- | :--- | :--- | :--- |
| **Testing** | No existen pruebas unitarias ni de integración (`npm test` falla intencionalmente). | Alto riesgo de regresiones en cálculos de impuestos, descuentos y stock. | Agregar tests con `node:test` o `vitest` para `pagos.service.js`, `neurona.js` y controladores. |
| **Historial Neurona** | `Neurona` almacena eventos en memoria (`MAX_HISTORIAL = 200`). | Al reiniciar Node.js se pierde el historial reciente de eventos. | Persistir eventos críticos en una tabla `EventosAuditoria` si se requiere auditoría histórica. |
| **Conciliación Bancaria** | `pagos.service.js` tiene BAC/LAFISE/BANPRO desactivados. | Validación manual sujeta a error humano en referencias de tarjeta/transferencia. | Mantener validación de referencia única (`UX_Pagos_Referencia`) hasta integrar APIs bancarias. |

