# Flujo de Trabajo — SOUVANIC

## 1. Flujo de Autenticación y Sesión
```mermaid
sequenceDiagram
    actor U as Usuario
    participant FE as Frontend (login.js / auth.js)
    participant API as Backend (/login & auth.middleware)
    participant DB as SQL Server (Usuarios)
    participant N as Neurona (Backend)

    U->>FE: Ingresa usuario y contraseña
    FE->>API: POST /login
    API->>DB: SELECT Usuario, PasswordHash, Rol, Activo
    alt Credenciales válidas y Activo=1
        API->>N: emitir("auth:login_exitoso")
        API-->>FE: 200 OK { token JWT (2h), usuario }
        FE->>FE: Guarda en sessionStorage y redirige a dashboard.html
    else Credenciales inválidas o inactivo
        API->>N: emitir("auth:login_fallido")
        API-->>FE: 401 Unauthorized
    end
```

---

## 2. Flujo de Facturación, Pagos e Inventario (con Neurona)
```mermaid
flowchart TD
    A[Vendedor selecciona cliente y productos] --> B[Agrega pagos: Efectivo / Tarjeta / Transferencia]
    B --> C[Frontend genera ClaveIdempotencia y llama POST /facturas]
    C --> D{¿ClaveIdempotencia ya existe?}
    D -- Sí --> E[Devuelve factura existente 200 OK]
    D -- No --> F[Inicia sql.Transaction]
    F --> G[Valida stock y precios en Productos]
    G --> H[Inserta Factura, DetalleFactura y Pagos]
    H --> I[Descuenta Stock y registra MovimientosInventario]
    I --> J[Commit Transacción]
    J --> K[Neurona emite factura:emitida]
    K --> L[Sinapsis evaluar_stock_post_factura]
    L --> M{¿Stock <= StockMinimo?}
    M -- Sí --> N[Neurona emite inventario:stock_bajo_detectado]
    M -- No --> O[Fin del ciclo]
```

---

## 3. Flujo de Anulación de Factura
1. El **Administrador** solicita `POST /facturas/:id/anular` con un motivo obligatorio.
2. El controlador abre una transacción SQL y verifica que la factura exista y no esté ya `Anulada`.
3. Por cada ítem de `DetalleFactura`:
   - Restaura `Productos.Stock = Stock + Cantidad`.
   - Inserta un registro `Entrada` en `MovimientosInventario` vinculado a `IdFactura`.
4. Marca los pagos asociados (`Registrado`/`Verificado`) para revisión y actualiza `Facturas.Estado = 'Anulada'`.
5. Al confirmar (`commit`), **Neurona** emite `factura:anulada` y dispara la sinapsis `auditoria_anulacion_factura`.

---

## 4. Arquitectura de Sinapsis (Núcleo Neurona)

```mermaid
flowchart LR
    P[Productos Controller] -->|producto:creado / stock_minimo_actualizado| NB((Neurona Backend))
    C[Clientes Controller] -->|cliente:creado| NB
    F[Facturas Controller] -->|factura:emitida / factura:anulada| NB
    I[Inventario Controller] -->|inventario:movimiento_registrado| NB
    A[Auth Controller] -->|auth:login_exitoso / fallido| NB

    NB --> S1[Sinapsis: Evaluar Stock Bajo]
    NB --> S2[Sinapsis: Auditoría de Anulaciones]
    NB --> S3[Historial Circular & Métricas /neurona/estado]
    S1 -->|Stock <= Minimo| NAlert[inventario:stock_bajo_detectado]
```

---

## 5. Flujo de Desarrollo Local
1. **Base de datos**: Asegurar que SQL Server esté ejecutándose y `Backend/.env` contenga `DB_DATABASE` y `JWT_SECRET`.
2. **Backend**:
   ```powershell
   cd Backend
   npm start
   ```
   El servidor inicia en `http://localhost:3000`, registra las sinapsis de Neurona y ejecuta `asegurarEsquemaIntegral()`.
3. **Frontend**: Servir la carpeta raíz con Live Server / servidor estático en `http://localhost:8080` y abrir `http://localhost:8080/frontend/pages/index.html` (configurado en `.vscode/launch.json`).

