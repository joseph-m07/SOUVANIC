# Plan de Ejecución Estricto por Fases — SOUVANIC

Este documento es la **guía operativa obligatoria** para cualquier agente o desarrollador que implemente las mejoras de **SOUVANIC**. Cada fase debe completarse al 100% y validarse antes de pasar a la siguiente. **El endurecimiento de seguridad queda reservado para la Fase 5 (última fase).**

---

## Reglas Estrictas de Cumplimiento para Agentes

Antes de dar por cerrada cualquier fase, el agente **DEBE** cumplir sin excepción:
1. **Esquema Dual (`schema.service.js`)**: Toda tabla o columna nueva debe crearse de forma aditiva tanto en `asegurarEsquemaSqlite()` como en el bloque SQL Server.
2. **Backend Dual (`database.js`)**: Toda consulta debe funcionar en **SQLite** y **SQL Server** usando parámetros `.input(...)` y transacciones en mutaciones compuestas.
3. **Eventos en Neurona (`neurona.js` / `neurona.listeners.js`)**: Toda mutación de negocio debe emitir su evento de dominio (`dominio:accion`).
4. **Estándar UI/UX (`AGENTS.md` + `ui-ux-souvanic`)**:
   - Listados principales con filas clickeables (`tr.socio-fila`), único indicador **`>`** (`.socio-chevron-btn`) y ventana modal de opciones (`.socio-opciones-modal`).
   - Botones de acción en barras/tablas **solo con icono + `title` descriptivo** (`.btn-icono-factura`).
   - Prohibido usar `alert()` o `confirm()` nativos; usar siempre `SouvanicUI`.
5. **Verificación Obligatoria (`qa-playwright-souvanic`)**:
   - `node --check` en todos los `.js` modificados.
   - `cd Backend && npm run seed` sin errores.
   - Prueba E2E con **Playwright** cubriendo los flujos de la fase con `0` `pageErrors`, `0` `consoleErrors` y `0` `badResponses` (`>= 400`).

---

## Fase 1 — Georreferencia en Socios + Operación POS Diaria
**Objetivo**: Permitir ventas ágiles de pulpería y ubicación exacta de socios para delivery.

### Checklist Obligatorio
- [ ] **BD (`Clientes` / Socios)**: Agregar `Latitud`, `Longitud`, `ZonaBarrio`, `ReferenciaUbicacion`.
- [ ] **Backend (`clientes.controller.js`)**: Aceptar, validar y devolver los 4 campos de georreferencia.
- [ ] **Frontend Socios (`clientes.html` / `clientes.js`)**:
  - [ ] Integrar selector de pin en mapa (**Leaflet + OpenStreetMap**) en el modal de Socio.
  - [ ] Agregar botón **"Usar mi ubicación"** (Geolocation API).
  - [ ] Mostrar botón/enlace **"Abrir en mapa"** (Google Maps) en `#socioOpcionesModal`.
- [ ] **Operación POS (`facturas.controller.js` + `productos.controller.js` + `facturas.js`)**:
  - [ ] Seedear socio genérico `CONSUMIDOR-FINAL` (`EsCliente=1`) y preseleccionarlo por defecto en Paso 1 del Wizard.
  - [ ] Permitir cantidades decimales (`> 0`, hasta 3 decimales) en `facturas.controller.js` y carrito POS (para ventas por libra/kilo/litro).
  - [ ] Agregar `CodigoBarras` y `Costo` a `Productos` (BD, controlador, modal de producto y búsqueda en POS).
  - [ ] Cálculo en vivo en Paso 3 (Pagos): al escribir en **Efectivo recibido**, mostrar en tiempo real **Pendiente** o **Vuelto**.
- [ ] **QA Playwright**: Crear/editar socio con coordenadas, emitir factura decimal con `Consumidor Final` y validar cálculo en vivo.

---

## Fase 2 — Caja (Turnos y Arqueo) + Delivery y Logística
**Objetivo**: Controlar el efectivo real en gaveta y gestionar envíos a domicilio.

### Checklist Obligatorio
- [ ] **BD**: Crear tablas `TurnosCaja`, `MovimientosCaja`, `ZonasDelivery` y `Envios`.
- [ ] **Backend Caja**: Endpoints `POST /caja/abrir`, `GET /caja/activa`, `POST /caja/movimientos` (ingresos/egresos), `POST /caja/cerrar` (arqueo).
- [ ] **Backend Delivery**: Endpoints `GET/POST /delivery/zonas`, `POST /delivery/envios`, `PATCH /delivery/envios/:id/estado`, `GET /delivery/envios`.
- [ ] **Frontend Caja (`caja.html` / `caja.js`)**:
  - [ ] Bloquear emisión de facturas en efectivo si no hay turno de caja abierto (o avisar).
  - [ ] Vista de arqueo con comparación `Esperado vs Contado` y diferencia.
- [ ] **Frontend Delivery (`delivery.html` / `delivery.js` + `facturas.html`)**:
  - [ ] Paso opcional en Wizard de Facturación para marcar **"Es Delivery"**, elegir zona/tarifa, dirección/coordenadas del Socio y repartidor (`EsEmpleado=1`).
  - [ ] Listado de envíos estilo lista con `>` y ventana de opciones (cambiar estado: `Pendiente` → `Preparando` → `En camino` → `Entregado`, abrir mapa, liquidar pago contra entrega COD).
- [ ] **Neurona**: Emitir y escuchar `caja:*` y `delivery:*`.
- [ ] **QA Playwright**: Abrir caja → facturar con delivery → cambiar estado de envío → cerrar caja con arqueo.

---

## Fase 3 — Compras, Gastos Operativos y Cuentas por Cobrar (Fiado)
**Objetivo**: Controlar salidas de dinero, reabastecimiento con proveedores y cobros pendientes.

### Checklist Obligatorio
- [ ] **BD**: Crear tablas `Compras`, `DetalleCompra`, `CategoriasGasto`, `Gastos` y `Abonos`.
- [ ] **Backend & Frontend Compras (`compras.html` / `compras.js`)**:
  - [ ] Registrar compras a socios `EsProveedor=1`, sumando stock en `Productos`, actualizando `Costo` y registrando `Entrada` en `MovimientosInventario`.
- [ ] **Backend & Frontend Gastos (`gastos.html` / `gastos.js`)**:
  - [ ] Registrar gastos por categoría (luz, agua, alquiler, combustible delivery, planilla a `EsEmpleado=1`, empaques, mermas).
  - [ ] Descontar automáticamente del turno de caja activo si el gasto se paga en efectivo desde gaveta.
- [ ] **Backend & Frontend Cobranza (`cobranza.html` / `cobranza.js`)**:
  - [ ] Listar facturas con saldo pendiente y estado de cuenta por socio.
  - [ ] Registrar abonos parciales (`POST /cobranza/abonos`), actualizar estado (`Pendiente` → `Pagada`) e imprimir recibo 80mm.
- [ ] **Neurona**: Emitir `compra:registrada`, `gasto:registrado`, `cobranza:abono_registrado`.
- [ ] **QA Playwright**: Registrar compra → registrar gasto en efectivo → registrar abono parcial hasta saldar factura.

---

## Fase 4 — Catálogo Avanzado (Ropa/Pulpería), Devoluciones, Reportes y Admin UI
**Objetivo**: Completar la gestión de variantes de ropa, caducidad en pulpería, devoluciones y analítica de utilidad.

### Checklist Obligatorio
- [ ] **Variantes de Ropa**: Tabla `ProductoVariantes` (`Talla`, `Color`, `SKU`, `Stock`) integrada en Productos y en la lista POS izquierda.
- [ ] **Lotes y Vencimientos (Pulpería)**: Tabla `LotesVencimiento` + alertas en Dashboard e Inventario para productos próximos a vencer.
- [ ] **Cambios y Devoluciones Parciales**: Endpoint `POST /facturas/:id/devoluciones` y acción desde `#modalDetalleFactura` para devolver ítems o cambiar talla sin anular toda la factura.
- [ ] **Reportes Financieros (`reportes.html` / `reportes.js`)**:
  - [ ] Estado de resultados: `Ventas Netas - Costo de Ventas = Utilidad Bruta - Gastos Operativos = Utilidad Neta Real`.
  - [ ] Ventas por vendedor, entregas por repartidor y exportación XLSX.
- [ ] **Administración UI (`configuracion.html`)**: CRUD de usuarios/roles, datos del negocio para el Voucher 80mm y visor de eventos de `Neurona` (`/neurona/eventos`).
- [ ] **QA Playwright**: Venta de variante de ropa → devolución parcial → verificación de reporte de utilidad neta.

---

## Fase 5 (Última) — Endurecimiento y Seguridad Integral
**Objetivo**: Cerrar todas las brechas de seguridad, resiliencia e infraestructura antes de producción (ver detalles en [ANALISIS_FALLAS.md](ANALISIS_FALLAS.md)).

### Checklist Obligatorio
- [ ] **Protección de Endpoints**: Proteger `GET /test-db` con `verificarToken` + `verificarRol("Administrador")` y ocultar `error.message` internos en producción.
- [ ] **CORS y Rate Limiting**: Restringir `cors({ origin: process.env.CORS_ORIGIN })` y aplicar `express-rate-limit` en `POST /login`.
- [ ] **Pool Singleton de BD (`database.js`)**: Reemplazar `sql.connect(config)` por petición por un pool único reutilizable con manejo de reconexión.
- [ ] **Configuración Frontend**: Centralizar `API_URL` (dinámico o configurable) en un único punto; eliminar enlaces muertos (`¿Olvidaste tu contraseña?`) y resolver expiración de JWT sin pérdida de formularios.
- [ ] **Assets Locales**: Empaquetar `bootstrap-icons` localmente para operación sin internet en tienda.
- [ ] **Suite de Tests Automatizados**: Implementar pruebas unitarias/integración (`npm test`) para `pagos.service`, `facturas.controller`, `neurona` y validación de permisos por rol (`Vendedor` vs `Administrador`).
- [ ] **Auditoría Final**: Verificación completa con Playwright en roles `Administrador` y `Vendedor` + revisión de cabeceras HTTP (`helmet`).

