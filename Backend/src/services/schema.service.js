"use strict";

const bcrypt = require("bcrypt");
const { sql, config, isSqlite } = require("../config/database");

async function asegurarEsquemaSqlite() {
    const pool = await sql.connect(config);
    const db = pool._db;

    db.exec(`
        CREATE TABLE IF NOT EXISTS Usuarios (
            IdUsuario INTEGER PRIMARY KEY AUTOINCREMENT,
            Nombre TEXT NOT NULL,
            Usuario TEXT NOT NULL UNIQUE,
            PasswordHash TEXT NOT NULL,
            Rol TEXT NOT NULL DEFAULT 'Vendedor',
            Activo INTEGER NOT NULL DEFAULT 1,
            FechaCreacion TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
        );

        CREATE TABLE IF NOT EXISTS Productos (
            CodigoProducto TEXT PRIMARY KEY,
            Nombre TEXT NOT NULL,
            Categoria TEXT NOT NULL,
            Precio REAL NOT NULL,
            Stock INTEGER NOT NULL DEFAULT 0,
            Descripcion TEXT NULL,
            Activo INTEGER NOT NULL DEFAULT 1,
            StockMinimo INTEGER NOT NULL DEFAULT 5
        );

        CREATE TABLE IF NOT EXISTS Clientes (
            IdCliente TEXT PRIMARY KEY,
            Nombre TEXT NOT NULL,
            Telefono TEXT NULL,
            Correo TEXT NULL,
            Direccion TEXT NULL,
            EsCliente INTEGER NOT NULL DEFAULT 1,
            EsProveedor INTEGER NOT NULL DEFAULT 0,
            EsEmpleado INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS Facturas (
            IdFactura INTEGER PRIMARY KEY AUTOINCREMENT,
            IdCliente TEXT NOT NULL,
            Fecha TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
            Subtotal REAL NOT NULL DEFAULT 0,
            Descuento REAL NOT NULL DEFAULT 0,
            Impuesto REAL NOT NULL DEFAULT 0,
            Total REAL NOT NULL,
            Estado TEXT NOT NULL DEFAULT 'Registrada',
            IdUsuario INTEGER NULL,
            ClaveIdempotencia TEXT NULL,
            IdUsuarioAnulacion INTEGER NULL,
            FechaAnulacion TEXT NULL,
            MotivoAnulacion TEXT NULL
        );

        CREATE TABLE IF NOT EXISTS DetalleFactura (
            IdDetalle INTEGER PRIMARY KEY AUTOINCREMENT,
            IdFactura INTEGER NOT NULL,
            CodigoProducto TEXT NOT NULL,
            Cantidad INTEGER NOT NULL,
            PrecioUnitario REAL NOT NULL,
            DescuentoAplicado REAL NULL DEFAULT 0,
            Subtotal REAL GENERATED ALWAYS AS (ROUND(Cantidad * PrecioUnitario - COALESCE(DescuentoAplicado, 0), 2)) VIRTUAL
        );

        CREATE TABLE IF NOT EXISTS MovimientosInventario (
            IdMovimiento INTEGER PRIMARY KEY AUTOINCREMENT,
            CodigoProducto TEXT NOT NULL,
            TipoMovimiento TEXT NOT NULL,
            Cantidad INTEGER NOT NULL,
            StockAnterior INTEGER NOT NULL,
            StockNuevo INTEGER NOT NULL,
            Motivo TEXT NULL,
            Observaciones TEXT NULL,
            Fecha TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
            IdUsuario INTEGER NULL,
            IdFactura INTEGER NULL
        );

        CREATE TABLE IF NOT EXISTS Pagos (
            IdPago INTEGER PRIMARY KEY AUTOINCREMENT,
            IdFactura INTEGER NOT NULL,
            Metodo TEXT NOT NULL,
            Monto REAL NOT NULL,
            MontoRecibido REAL NULL,
            Vuelto REAL NULL,
            Banco TEXT NULL,
            BancoDestino TEXT NULL,
            CuentaDestino TEXT NULL,
            Referencia TEXT NULL,
            Observaciones TEXT NULL,
            Estado TEXT NOT NULL DEFAULT 'Registrado',
            Fecha TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
            IdUsuario INTEGER NULL
        );

        CREATE INDEX IF NOT EXISTS IX_Pagos_Factura ON Pagos (IdFactura);
        CREATE UNIQUE INDEX IF NOT EXISTS UX_Pagos_Referencia
            ON Pagos (Metodo, Banco, Referencia)
            WHERE Referencia IS NOT NULL AND Estado <> 'Anulado';
        CREATE UNIQUE INDEX IF NOT EXISTS UX_Facturas_Idempotencia
            ON Facturas (ClaveIdempotencia)
            WHERE ClaveIdempotencia IS NOT NULL;
        CREATE INDEX IF NOT EXISTS IX_Movimientos_Factura
            ON MovimientosInventario (IdFactura);
    `);

    const colsClientes = db.prepare("PRAGMA table_info(Clientes)").all().map(c => c.name);
    if (!colsClientes.includes("EsCliente")) {
        db.exec("ALTER TABLE Clientes ADD COLUMN EsCliente INTEGER NOT NULL DEFAULT 1;");
    }
    if (!colsClientes.includes("EsProveedor")) {
        db.exec("ALTER TABLE Clientes ADD COLUMN EsProveedor INTEGER NOT NULL DEFAULT 0;");
    }
    if (!colsClientes.includes("EsEmpleado")) {
        db.exec("ALTER TABLE Clientes ADD COLUMN EsEmpleado INTEGER NOT NULL DEFAULT 0;");
    }

    const conteo = await pool.request().query("SELECT COUNT(*) AS Total FROM Usuarios");
    if (Number(conteo.recordset[0]?.Total || 0) === 0) {
        const passwordInicial = process.env.ADMIN_PASSWORD || "admin123456";
        const hash = await bcrypt.hash(passwordInicial, 10);
        await pool.request()
            .input("nombre", sql.NVarChar(100), "Administrador SOUVANIC")
            .input("usuario", sql.NVarChar(50), "admin")
            .input("passwordHash", sql.NVarChar(255), hash)
            .query(`
                INSERT INTO Usuarios (Nombre, Usuario, PasswordHash, Rol, Activo)
                VALUES (@nombre, @usuario, @passwordHash, 'Administrador', 1)
            `);

        console.log("[SQLite] Usuario inicial creado -> usuario: admin");
    }

    console.log(`Esquema SQLite verificado correctamente (${config.dbPath}).`);
}

/**
 * Verifica y aplica migraciones aditivas (no destructivas) sobre SQLite o SQL Server.
 */
async function asegurarEsquemaIntegral() {
    try {
        if (isSqlite) {
            await asegurarEsquemaSqlite();
            return;
        }

        const pool = await sql.connect(config);

        await pool.request().query(`
            IF COL_LENGTH('dbo.Productos', 'Descripcion') IS NULL
                ALTER TABLE dbo.Productos ADD Descripcion NVARCHAR(255) NULL;

            IF COL_LENGTH('dbo.Productos', 'Activo') IS NULL
                ALTER TABLE dbo.Productos ADD Activo BIT NOT NULL
                    CONSTRAINT DF_Productos_Activo DEFAULT (1);

            IF COL_LENGTH('dbo.Productos', 'StockMinimo') IS NULL
                ALTER TABLE dbo.Productos ADD StockMinimo INT NOT NULL
                    CONSTRAINT DF_Productos_StockMinimo DEFAULT (5);

            IF COL_LENGTH('dbo.DetalleFactura', 'DescuentoAplicado') IS NULL
                ALTER TABLE dbo.DetalleFactura
                    ADD DescuentoAplicado DECIMAL(12, 2) NULL;

            IF COL_LENGTH('dbo.Facturas', 'Subtotal') IS NULL
                ALTER TABLE dbo.Facturas ADD Subtotal DECIMAL(12, 2) NULL;

            IF COL_LENGTH('dbo.Facturas', 'Descuento') IS NULL
                ALTER TABLE dbo.Facturas ADD Descuento DECIMAL(12, 2) NOT NULL
                    CONSTRAINT DF_Facturas_Descuento DEFAULT (0);

            IF COL_LENGTH('dbo.Facturas', 'Impuesto') IS NULL
                ALTER TABLE dbo.Facturas ADD Impuesto DECIMAL(12, 2) NOT NULL
                    CONSTRAINT DF_Facturas_Impuesto DEFAULT (0);

            IF COL_LENGTH('dbo.Facturas', 'Estado') IS NULL
                ALTER TABLE dbo.Facturas ADD Estado VARCHAR(16) NOT NULL
                    CONSTRAINT DF_Facturas_Estado DEFAULT ('Registrada');

            IF COL_LENGTH('dbo.Facturas', 'ClaveIdempotencia') IS NULL
                ALTER TABLE dbo.Facturas ADD ClaveIdempotencia VARCHAR(64) NULL;

            IF COL_LENGTH('dbo.Facturas', 'IdUsuarioAnulacion') IS NULL
                ALTER TABLE dbo.Facturas ADD IdUsuarioAnulacion INT NULL;

            IF COL_LENGTH('dbo.Facturas', 'FechaAnulacion') IS NULL
                ALTER TABLE dbo.Facturas ADD FechaAnulacion DATETIME2 NULL;

            IF COL_LENGTH('dbo.Facturas', 'MotivoAnulacion') IS NULL
                ALTER TABLE dbo.Facturas ADD MotivoAnulacion NVARCHAR(255) NULL;

            IF COL_LENGTH('dbo.MovimientosInventario', 'Observaciones') IS NULL
                ALTER TABLE dbo.MovimientosInventario
                    ADD Observaciones NVARCHAR(255) NULL;

            IF COL_LENGTH('dbo.MovimientosInventario', 'IdUsuario') IS NULL
                ALTER TABLE dbo.MovimientosInventario ADD IdUsuario INT NULL;

            IF COL_LENGTH('dbo.MovimientosInventario', 'IdFactura') IS NULL
                ALTER TABLE dbo.MovimientosInventario ADD IdFactura INT NULL;

            IF COL_LENGTH('dbo.MovimientosInventario', 'TipoMovimiento') = 10
                ALTER TABLE dbo.MovimientosInventario
                    ALTER COLUMN TipoMovimiento VARCHAR(20) NOT NULL;

            IF COL_LENGTH('dbo.Clientes', 'EsCliente') IS NULL
                ALTER TABLE dbo.Clientes ADD EsCliente BIT NOT NULL
                    CONSTRAINT DF_Clientes_EsCliente DEFAULT (1);

            IF COL_LENGTH('dbo.Clientes', 'EsProveedor') IS NULL
                ALTER TABLE dbo.Clientes ADD EsProveedor BIT NOT NULL
                    CONSTRAINT DF_Clientes_EsProveedor DEFAULT (0);

            IF COL_LENGTH('dbo.Clientes', 'EsEmpleado') IS NULL
                ALTER TABLE dbo.Clientes ADD EsEmpleado BIT NOT NULL
                    CONSTRAINT DF_Clientes_EsEmpleado DEFAULT (0);
        `);

        await pool.request().query(`
            IF OBJECT_ID('dbo.Pagos', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.Pagos (
                    IdPago INT IDENTITY(1, 1) NOT NULL
                        CONSTRAINT PK_Pagos PRIMARY KEY,
                    IdFactura INT NOT NULL,
                    Metodo VARCHAR(20) NOT NULL,
                    Monto DECIMAL(12, 2) NOT NULL,
                    MontoRecibido DECIMAL(12, 2) NULL,
                    Vuelto DECIMAL(12, 2) NULL,
                    Banco VARCHAR(40) NULL,
                    BancoDestino VARCHAR(60) NULL,
                    CuentaDestino VARCHAR(60) NULL,
                    Referencia VARCHAR(60) NULL,
                    Observaciones NVARCHAR(255) NULL,
                    Estado VARCHAR(20) NOT NULL
                        CONSTRAINT DF_Pagos_Estado DEFAULT ('Registrado'),
                    Fecha DATETIME2 NOT NULL
                        CONSTRAINT DF_Pagos_Fecha DEFAULT (SYSDATETIME()),
                    IdUsuario INT NULL
                );
            END
        `);

        await pool.request().query(`
            IF NOT EXISTS (
                SELECT 1 FROM sys.indexes
                WHERE name = 'IX_Pagos_Factura'
                  AND object_id = OBJECT_ID('dbo.Pagos')
            )
                CREATE INDEX IX_Pagos_Factura ON dbo.Pagos (IdFactura);

            IF NOT EXISTS (
                SELECT 1 FROM sys.indexes
                WHERE name = 'UX_Pagos_Referencia'
                  AND object_id = OBJECT_ID('dbo.Pagos')
            )
                CREATE UNIQUE INDEX UX_Pagos_Referencia
                    ON dbo.Pagos (Metodo, Banco, Referencia)
                    WHERE Referencia IS NOT NULL AND Estado <> 'Anulado';

            IF NOT EXISTS (
                SELECT 1 FROM sys.indexes
                WHERE name = 'UX_Facturas_Idempotencia'
                  AND object_id = OBJECT_ID('dbo.Facturas')
            )
                CREATE UNIQUE INDEX UX_Facturas_Idempotencia
                    ON dbo.Facturas (ClaveIdempotencia)
                    WHERE ClaveIdempotencia IS NOT NULL;

            IF NOT EXISTS (
                SELECT 1 FROM sys.indexes
                WHERE name = 'IX_Movimientos_Factura'
                  AND object_id = OBJECT_ID('dbo.MovimientosInventario')
            )
                CREATE INDEX IX_Movimientos_Factura
                    ON dbo.MovimientosInventario (IdFactura);
        `);

        await pool.request().query(`
            UPDATE dbo.Facturas
            SET Subtotal = Total
            WHERE Subtotal IS NULL;
        `);

        console.log("Esquema integral verificado correctamente.");
    } catch (error) {
        console.error("No se pudo verificar el esquema integral:", error.message);
    }
}

module.exports = {
    asegurarEsquemaIntegral
};
