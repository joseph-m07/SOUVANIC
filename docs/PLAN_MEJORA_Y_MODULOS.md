# Plan de Mejora y Hoja de Ruta de Módulos — SOUVANIC

## 1. Estado Actual del Sistema
Hoy **SOUVANIC** cuenta con **6 módulos operativos** y una base arquitectónica sólida:
1. **Autenticación y Roles** (`Administrador` / `Vendedor`, JWT HS256).
2. **Dashboard** (KPIs diarios/mensuales, tendencia 7 días, top productos, alertas).
3. **Productos** (catálogo, categorías, estado activo/inactivo, stock mínimo).
4. **Socios** (clasificación múltiple: `Cliente`, `Proveedor`, `Empleado`, listado con `>` y ventana de opciones).
5. **Facturación POS + Historial independiente** (Wizard de 3 pasos, POS dividido, pagos combinados, edición `PUT /facturas/:id`, anulación, Voucher 80mm y exportación XLSX).
6. **Inventario** (alertas de stock, movimientos manuales, comprobantes).
- **Infraestructura transversal**: Núcleo de eventos **Neurona** (Backend + Frontend) y adaptador dual **SQLite / SQL Server**.

---

## 2. Georreferencia en el Módulo de Socios (Mejora Inmediata)
Tienes toda la razón: para una **pulpería con delivery y venta de ropa**, la georreferencia en **Socios** es fundamental tanto para ubicar clientes en entregas a domicilio como para ubicar proveedores.

### Cambios propuestos en `Socios` (`Clientes`)
- **Nuevas columnas en BD**:
  - `Latitud` (`DECIMAL(10, 7)` / `REAL` nullable)
  - `Longitud` (`DECIMAL(10, 7)` / `REAL` nullable)
  - `ZonaBarrio` (`NVARCHAR(80)` nullable — ej. *Los Robles*, *Bello Horizonte*)
  - `ReferenciaUbicacion` (`NVARCHAR(255)` nullable — ej. *"De la gasolinera 2c al sur, portón verde"*)
- **UX en el Modal de Socio**:
  - Pin interactivo en mapa ligero (**Leaflet + OpenStreetMap**, sin costo de API Key) para marcar la ubicación exacta.
  - Botón **"Usar mi ubicación actual"** (Geolocation API del navegador).
  - Enlace directo **"Abrir en Google Maps / Waze"** (`https://maps.google.com/?q=lat,lng`) dentro de la ventana de opciones (`#socioOpcionesModal`) para que el repartidor abra la ruta en un clic.

---

## 3. ¿Cuántos Módulos Faltan para que sea un Sistema Completo?
Para cubrir el ciclo completo de **Pulpería + Tienda de Ropa + Delivery**, se recomienda añadir **9 módulos** (llevando el sistema de 6 a **15 módulos**):

| # | Módulo Nuevo | Propósito Principal | Prioridad |
| :-: | :--- | :--- | :---: |
| **1** | **Caja y Arqueo (Turnos POS)** | Apertura/cierre de caja, fondo inicial, retiros/gastos menores y cuadre diario. | **P0 (Crítico)** |
| **2** | **Delivery y Logística** | Pedidos a domicilio, tarifa por zona, repartidor (`EsEmpleado`), estados y pago contra entrega (COD). | **P0 (Crítico)** |
| **3** | **Compras y Proveedores** | Registro de compras a socios (`EsProveedor`), ingreso de stock, costo de compra y cuentas por pagar. | **P1 (Alto)** |
| **4** | **Gastos y Egresos Operativos** | Registro de gastos del negocio (luz, agua, internet, alquiler, combustible delivery, planilla/salarios a `EsEmpleado`, papelería, mermas). | **P1 (Alto)** |
| **5** | **Cuentas por Cobrar (Fiado / Abonos)** | Control de saldos pendientes, abonos parciales, límite de crédito por socio y apartados de ropa. | **P1 (Alto)** |
| **6** | **Variantes (Ropa) y Lotes (Pulpería)** | Matriz Talla/Color/Marca en ropa; código de barras, unidades de medida (lb/kg/caja) y vencimientos en pulpería. | **P1 (Alto)** |
| **7** | **Cambios y Devoluciones Parciales** | Cambio de talla o devolución de 1 o más ítems (Nota de Crédito) sin anular toda la factura. | **P2 (Medio)** |
| **8** | **Reportes Financieros y Utilidad** | Ganancia bruta y **utilidad neta real** (`Ventas - Costo - Gastos`), ventas por cajero/repartidor y rotación de inventario. | **P2 (Medio)** |
| **9** | **Administración y Auditoría UI** | CRUD de usuarios/roles desde la web, configuración de negocio/ticket y visor de eventos de **Neurona**. | **P3 (Soporte)** |

---

## 4. Detalle Técnico de Cada Módulo

### Módulo 1 · Caja y Arqueo (`caja.html`)
- **Tablas**: `TurnosCaja` (`IdTurno`, `IdUsuario`, `FechaApertura`, `FondoInicial`, `FechaCierre`, `TotalEsperadoEfectivo`, `TotalContadoEfectivo`, `Diferencia`, `Estado`) y `MovimientosCaja` (`Ingreso` / `Egreso` / `Gasto menor`).
- **Flujo**: No permite facturar en efectivo si no hay un turno abierto; al cerrar caja muestra resumen por método (`Efectivo`, `Tarjeta`, `Transferencia`) y diferencia de arqueo.
- **Neurona**: `caja:abierta`, `caja:cerrada`, `caja:diferencia_detectada`.

### Módulo 2 · Delivery y Logística (`delivery.html`)
- **Tablas**: `ZonasDelivery` (`Nombre`, `Tarifa`) y `Envios` (`IdEnvio`, `IdFactura`, `IdRepartidor` [Socio con `EsEmpleado=1`], `DireccionEntrega`, `Referencia`, `Latitud`, `Longitud`, `CostoEnvio`, `Estado`, `PagoContraEntrega`, `MontoACobrar`).
- **Estados**: `Pendiente` → `En preparación` → `En camino` → `Entregado` / `No entregado`.
- **Integración**: Usa la georreferencia del Socio y permite enviar ubicación/resumen por WhatsApp o abrir ruta en mapa.
- **Neurona**: `delivery:asignado`, `delivery:en_camino`, `delivery:entregado`.

### Módulo 3 · Compras y Proveedores (`compras.html`)
- **Tablas**: `Compras` (`IdCompra`, `IdProveedor` [Socio con `EsProveedor=1`], `NumeroFacturaProveedor`, `Fecha`, `Total`, `EstadoPago`, `IdTurnoCaja`) y `DetalleCompra` (`CodigoProducto`, `Cantidad`, `CostoUnitario`).
- **Efecto**: Suma stock en `Productos`, actualiza `Costo` (promedio ponderado o último costo), registra `Entrada` en `MovimientosInventario` y opcionalmente descuenta de Caja si se pagó en efectivo.
- **Neurona**: `compra:registrada`, `producto:costo_actualizado`.

### Módulo 4 · Gastos y Egresos Operativos (`gastos.html`)
- **Tablas**: `CategoriasGasto` (*Servicios básicos*, *Alquiler*, *Planilla/Comisiones*, *Combustible/Delivery*, *Bolsas/Empaques*, *Mantenimiento*, *Otros*) y `Gastos` (`IdGasto`, `IdCategoria`, `IdSocio` [opcional: proveedor o empleado], `Concepto`, `Monto`, `MetodoPago`, `Referencia`, `Fecha`, `IdTurnoCaja`, `IdUsuario`).
- **Funcionalidad**:
  - Registro rápido de gastos del día (si salen de la gaveta de efectivo, se reflejan automáticamente en el **Arqueo de Caja**).
  - Pago de salarios/comisiones a empleados (`EsEmpleado=1`) y combustible a repartidores.
  - Registro de **mermas o pérdidas** (productos dañados o vencidos en pulpería).
- **Neurona**: `gasto:registrado`, `caja:egreso_registrado`.

### Módulo 5 · Cuentas por Cobrar / Fiado (`cobranza.html`)
- **Tablas**: `Abonos` (`IdAbono`, `IdFactura`, `IdCliente`, `Fecha`, `Monto`, `Metodo`, `Referencia`, `IdUsuario`).
- **Funcionalidad**: Listado de socios con saldo pendiente, estado de cuenta, registro de abonos parciales que actualizan el estado de la factura (`Pendiente` → `Pagada`) y emisión de recibo de abono en Voucher 80mm.
- **Neurona**: `cobranza:abono_registrado`, `cobranza:factura_saldada`.

### Módulo 6 · Catálogo Avanzado (Ropa + Pulpería)
- **Ropa**: Tabla `ProductoVariantes` (`IdVariante`, `CodigoProducto`, `Talla`, `Color`, `SKU`, `Stock`) para elegir talla/color directo en el POS.
- **Pulpería**: Campos `CodigoBarras` (escáner + `Enter` en POS), `UnidadMedida` (`Und`, `Lb`, `Kg`, `Litro`, `Caja`), soporte de cantidades decimales en `facturas.controller.js` y tabla `LotesVencimiento` con alertas de productos próximos a vencer.

### Módulo 7 · Cambios y Devoluciones Parciales
- **Tablas**: `Devoluciones` y `DetalleDevolucion`.
- **Funcionalidad**: Desde `#modalDetalleFactura`, permitir devolver un ítem específico o intercambiar una talla (entrada del ítem devuelto + salida del nuevo ítem) generando movimiento compensatorio sin anular el resto de la venta.

### Módulo 8 · Reportes Financieros y Utilidad
- **Consultas / Vistas**:
  - **Estado de Resultados simple**: `Ventas Netas - Costo de Mercadería Vendida = Utilidad Bruta - Gastos Operativos = Utilidad Neta Real`.
  - Desempeño por vendedor, entregas por repartidor y desglose de gastos por categoría.
  - Exportación XLSX profesional de reportes contables.

### Módulo 9 · Administración y Auditoría (`configuracion.html`)
- **Funcionalidad**:
  - Gestión de usuarios del sistema (crear, cambiar rol, activar/desactivar, resetear contraseña) sin depender de scripts CLI.
  - Datos de la tienda para el encabezado del Voucher 80mm (Nombre, RUC, Teléfono, Dirección, mensaje de pie).
  - Visor en tiempo real de eventos de **Neurona** (`/neurona/eventos`).

---

## 5. Plan de Implementación por Fases

| Fase | Alcance | Entregables Clave |
| :---: | :--- | :--- |
| **Fase 1** | **Georreferencia + Operación POS diaria** | Lat/Lng/Zona/Referencia en Socios + mapa, Cliente `Consumidor Final`, cantidades decimales y `CodigoBarras` + `Costo` en Productos. |
| **Fase 2** | **Caja + Delivery** | Módulo de Turnos/Arqueo de Caja + Módulo de Envíos/Delivery conectado a repartidores y mapa de Socios. |
| **Fase 3** | **Compras + Gastos + Fiado/Cobranza** | Módulo de Compras a Proveedores + Módulo de Gastos/Egresos + Cuentas por Cobrar y Abonos (con recibo 80mm). |
| **Fase 4** | **Ropa Avanzada + Reportes + Admin** | Variantes Talla/Color, Cambios/Devoluciones parciales, Reportes de Utilidad Neta Real y Panel de Administración/Neurona. |

