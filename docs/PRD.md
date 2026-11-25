# PRD — Sistema de Facturación e Inventario SOUVANIC

## 1. Resumen Ejecutivo
**SOUVANIC** (Nicaragua Souvenir) es una aplicación web integral para la gestión comercial de inventario, clientes, facturación multipago e indicadores operativos. El sistema combina una arquitectura modular en Node.js/Express conectada a SQL Server con un núcleo central de eventos (**Neurona**) tanto en backend como en frontend.

---

## 2. Objetivos del Producto
1. **Agilizar la emisión de facturas** con soporte para múltiples métodos de pago (Efectivo, Tarjeta, Transferencia y pagos combinados) y cálculo automático de subtotal, descuentos, impuestos, saldo y vuelto.
2. **Garantizar la integridad del inventario** mediante deducción automática al facturar, restauración automática al anular facturas y trazabilidad completa en `MovimientosInventario`.
3. **Centralizar el catálogo de productos y clientes** con validaciones estrictas, control de estado activo/inactivo y umbrales de `StockMinimo`.
4. **Proveer visibilidad operativa** mediante un Dashboard ejecutivo y alertas tempranas de stock bajo/agotado orquestadas por **Neurona**.

---

## 3. Roles y Permisos

| Rol | Capacidades Principales | Restricciones |
| :--- | :--- | :--- |
| **Administrador** | Acceso total: CRUD de productos, ajuste de stock mínimo, activación/desactivación, eliminación de clientes, emisión y **anulación** de facturas, registro de movimientos de inventario, consulta de historial de eventos de Neurona. | N/A |
| **Vendedor** | Consulta de dashboard, consulta de catálogo de productos, registro y edición de clientes, emisión y consulta de facturas, consulta de alertas y movimientos de inventario. | No puede crear/editar/eliminar productos, no puede eliminar clientes, no puede anular facturas ni registrar ajustes manuales de inventario. |

---

## 4. Requisitos Funcionales por Módulo

### 4.1 Autenticación y Sesión (`auth`)
- **RF-01**: Inicio de sesión mediante usuario y contraseña verificados con `bcrypt` contra `Usuarios.PasswordHash`.
- **RF-02**: Emisión de token JWT (`HS256`, expiración de `2h`) y almacenamiento en `sessionStorage`.
- **RF-03**: Validación en cada petición protegida (`verificarToken`) verificando que el usuario exista y siga `Activo = 1` en SQL Server.

### 4.2 Productos (`productos`)
- **RF-04**: Listado de productos con código, nombre, categoría, precio, stock actual, stock mínimo, descripción y estado.
- **RF-05**: Alta, edición, cambio de estado (`Activo`), configuración de `StockMinimo` y eliminación lógica/física según integridad referencial.

### 4.3 Clientes (`clientes`)
- **RF-06**: Listado, búsqueda, creación y actualización de clientes (`IdCliente`, `Nombre`, `Telefono`, `Correo`, `Direccion`).
- **RF-07**: Eliminación restringida al rol `Administrador`.

### 4.4 Facturación y Pagos (`facturas` + `pagos.service`)
- **RF-08**: Creación transaccional de factura (`POST /facturas`) con soporte de `ClaveIdempotencia` para evitar duplicados por reintentos de red.
- **RF-09**: Validación de stock disponible antes de descontar inventario y registro de `DetalleFactura`.
- **RF-10**: Registro de uno o más pagos (`Efectivo`, `Tarjeta` [BAC, LAFISE, BANPRO], `Transferencia`) con cálculo de vuelto y validación de referencias únicas.
- **RF-11**: Consulta de historial de facturas, detalle por ítem y comprobante completo.
- **RF-12**: Anulación de factura (`POST /facturas/:id/anular`) por Administrador: restaura stock en `Productos`, registra movimiento de entrada en `MovimientosInventario` y marca pagos para revisión.
- **RF-13**: Exportación a Excel (`.xlsx`) desde el cliente (`xlsx-export.js`).

### 4.5 Inventario y Alertas (`inventario`)
- **RF-14**: Consulta de alertas de productos con stock menor o igual a `StockMinimo`.
- **RF-15**: Registro de movimientos manuales (`Entrada`, `Salida`, `Ajuste`) con auditoría de `StockAnterior`, `StockNuevo`, `Motivo`, `Observaciones` e `IdUsuario`.

### 4.6 Dashboard (`dashboard`)
- **RF-16**: Métricas consolidadas de ventas, facturas emitidas, productos con bajo stock y actividad reciente (`GET /dashboard`).

### 4.7 Núcleo Neurona (`neurona`)
- **RF-17**: Bus de eventos desacoplado en Backend (`Backend/src/core/neurona.js`) y Frontend (`frontend/js/core/neurona.js`).
- **RF-18**: Evaluación automática de stock bajo tras emisión de facturas, movimientos de inventario o cambios de stock mínimo.
- **RF-19**: Endpoints de observabilidad: `GET /neurona/estado` (autenticado) y `GET /neurona/eventos` (Administrador).

---

## 5. Requisitos No Funcionales
- **Seguridad**: Contraseñas hasheadas con `bcrypt`, autorización basada en roles (`verificarRol`), consultas SQL parametrizadas contra inyección SQL.
- **Integridad Transaccional**: Uso de transacciones SQL (`sql.Transaction`) en facturación, anulación y movimientos de inventario.
- **Mantenibilidad**: Separación estricta entre `frontend/` (pages, css, js/core, js/modules, js/utils, assets) y `Backend/src/` (config, core, middlewares, services, controllers, routes, scripts).
- **Compatibilidad de Esquema**: Migraciones aditivas no destructivas ejecutadas al arranque (`schema.service.js`).

