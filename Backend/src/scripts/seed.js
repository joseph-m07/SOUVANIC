"use strict";

const path = require("node:path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const bcrypt = require("bcrypt");
const { sql, config } = require("../config/database");
const { asegurarEsquemaIntegral } = require("../services/schema.service");

function fechaRelativa(diasAtras, hora = 10, minuto = 15) {
    const d = new Date();
    d.setDate(d.getDate() - diasAtras);
    d.setHours(hora, minuto, 0, 0);
    return d;
}

async function seed() {
    await asegurarEsquemaIntegral();
    const pool = await sql.connect(config);

    // 1. Usuarios de prueba (admin + vendedor)
    const adminHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || "admin123456", 10);
    const vendedorHash = await bcrypt.hash(process.env.VENDEDOR_PASSWORD || "vendedor123", 10);

    const usuarios = [
        { nombre: "Administrador SOUVANIC", usuario: "admin", hash: adminHash, rol: "Administrador" },
        { nombre: "María José López", usuario: "vendedor", hash: vendedorHash, rol: "Vendedor" }
    ];

    for (const u of usuarios) {
        const existe = await pool.request()
            .input("usuario", sql.NVarChar(50), u.usuario)
            .query("SELECT IdUsuario FROM Usuarios WHERE Usuario = @usuario");

        if (existe.recordset.length === 0) {
            await pool.request()
                .input("nombre", sql.NVarChar(100), u.nombre)
                .input("usuario", sql.NVarChar(50), u.usuario)
                .input("hash", sql.NVarChar(255), u.hash)
                .input("rol", sql.NVarChar(20), u.rol)
                .query(`
                    INSERT INTO Usuarios (Nombre, Usuario, PasswordHash, Rol, Activo)
                    VALUES (@nombre, @usuario, @hash, @rol, 1)
                `);
        }
    }

    const adminRow = await pool.request()
        .input("u", sql.NVarChar(50), "admin")
        .query("SELECT IdUsuario FROM Usuarios WHERE Usuario = @u");
    const idAdmin = adminRow.recordset[0]?.IdUsuario || 1;

    // 2. Productos de prueba (incluye stock saludable, stock bajo y agotado)
    const productos = [
        { codigo: "SOUV-001", nombre: "Taza Volcán Masaya", categoria: "Tazas", precio: 220, stock: 28, minimo: 6, desc: "Taza de cerámica esmaltada con ilustración del Volcán Masaya." },
        { codigo: "SOUV-002", nombre: "Taza Lago Cocibolca", categoria: "Tazas", precio: 240, stock: 3, minimo: 5, desc: "Taza edición especial isletas de Granada." },
        { codigo: "SOUV-003", nombre: "Camisa Guardabarranco", categoria: "Ropa", precio: 480, stock: 19, minimo: 5, desc: "Camiseta 100% algodón con estampado del ave nacional." },
        { codigo: "SOUV-004", nombre: "Guayabera Granada", categoria: "Ropa", precio: 950, stock: 4, minimo: 5, desc: "Guayabera artesanal blanca de lino." },
        { codigo: "SOUV-005", nombre: "Gorra Isla de Ometepe", categoria: "Ropa", precio: 320, stock: 0, minimo: 5, desc: "Gorra bordada edición Ometepe." },
        { codigo: "SOUV-006", nombre: "Llavero El Güegüense", categoria: "Accesorio", precio: 110, stock: 45, minimo: 10, desc: "Llavero metálico con relieve tradicional." },
        { codigo: "SOUV-007", nombre: "Imán Catedral de León", categoria: "Accesorio", precio: 95, stock: 36, minimo: 8, desc: "Imán decorativo en resina pintado a mano." },
        { codigo: "SOUV-008", nombre: "Pulsera Tejida Masaya", categoria: "Accesorio", precio: 85, stock: 50, minimo: 10, desc: "Pulsera artesanal trenzada en colores típicos." },
        { codigo: "SOUV-009", nombre: "Hamaca Artesanal Masaya", categoria: "Artesanía", precio: 1850, stock: 7, minimo: 3, desc: "Hamaca matrimonial tejida a mano en algodón." },
        { codigo: "SOUV-010", nombre: "Cerámica Negra Jinotega", categoria: "Artesanía", precio: 640, stock: 2, minimo: 4, desc: "Vasija decorativa de cerámica negra bruñida." }
    ];

    for (const p of productos) {
        const existe = await pool.request()
            .input("codigo", sql.VarChar(20), p.codigo)
            .query("SELECT CodigoProducto FROM Productos WHERE CodigoProducto = @codigo");

        if (existe.recordset.length === 0) {
            await pool.request()
                .input("codigo", sql.VarChar(20), p.codigo)
                .input("nombre", sql.NVarChar(100), p.nombre)
                .input("categoria", sql.NVarChar(50), p.categoria)
                .input("precio", sql.Decimal(10, 2), p.precio)
                .input("stock", sql.Int, p.stock)
                .input("desc", sql.NVarChar(255), p.desc)
                .input("minimo", sql.Int, p.minimo)
                .query(`
                    INSERT INTO Productos (CodigoProducto, Nombre, Categoria, Precio, Stock, Descripcion, Activo, StockMinimo)
                    VALUES (@codigo, @nombre, @categoria, @precio, @stock, @desc, 1, @minimo)
                `);
        }
    }

    // 3. Socios de prueba (Clientes, Proveedores y Empleados)
    const clientes = [
        { id: "001-120590-0014A", nombre: "Carlos Eduardo Mendoza", telefono: "8845-1209", correo: "cmendoza@correo.ni", direccion: "Reparto San Juan, Managua", esCliente: 1, esProveedor: 0, esEmpleado: 0 },
        { id: "001-240888-0021K", nombre: "Ana Gabriela Ruiz", telefono: "8712-4430", correo: "anaruiz@correo.ni", direccion: "Calle La Calzada, Granada", esCliente: 1, esProveedor: 0, esEmpleado: 0 },
        { id: "281-031195-0005M", nombre: "Hotel Boutique Mombacho", telefono: "2552-3910", correo: "compras@hotelmombacho.ni", direccion: "Parque Central 2c al este, Granada", esCliente: 1, esProveedor: 0, esEmpleado: 0 },
        { id: "001-170492-0033P", nombre: "Sofía Valentina Morales", telefono: "8920-7711", correo: "smorales@correo.ni", direccion: "Los Robles, Managua", esCliente: 1, esProveedor: 0, esEmpleado: 0 },
        { id: "291-190985-0009R", nombre: "Tour Operadora Nicarao", telefono: "2278-6500", correo: "reservas@nicaraotours.ni", direccion: "Carretera a Masaya km 4.5", esCliente: 1, esProveedor: 0, esEmpleado: 0 },
        { id: "001-050100-0042T", nombre: "Luis Fernando Castillo", telefono: "8433-9082", correo: "lcastillo@correo.ni", direccion: "Barrio El Calvario, León", esCliente: 1, esProveedor: 0, esEmpleado: 0 },
        { id: "PROV-001", nombre: "Distribuidora El Mayoreo S.A.", telefono: "2249-8100", correo: "ventas@elmayoreo.ni", direccion: "Mercado Oriental, Managua", esCliente: 0, esProveedor: 1, esEmpleado: 0 },
        { id: "PROV-002", nombre: "Textiles & Moda Nicaragua", telefono: "2266-4210", correo: "pedidos@textilesni.com", direccion: "Zona Franca Las Mercedes", esCliente: 0, esProveedor: 1, esEmpleado: 0 },
        { id: "EMP-001", nombre: "María José López", telefono: "8810-2233", correo: "mlopez@souvanic.ni", direccion: "Villa Fontana, Managua", esCliente: 1, esProveedor: 0, esEmpleado: 1 },
        { id: "EMP-002", nombre: "Kevin Antonio Díaz (Delivery)", telefono: "8655-9901", correo: "kdiaz@souvanic.ni", direccion: "Monseñor Lezcano, Managua", esCliente: 0, esProveedor: 0, esEmpleado: 1 }
    ];

    for (const c of clientes) {
        const existe = await pool.request()
            .input("id", sql.VarChar(20), c.id)
            .query("SELECT IdCliente FROM Clientes WHERE IdCliente = @id");

        if (existe.recordset.length === 0) {
            await pool.request()
                .input("id", sql.VarChar(20), c.id)
                .input("nombre", sql.NVarChar(100), c.nombre)
                .input("telefono", sql.VarChar(20), c.telefono)
                .input("correo", sql.VarChar(100), c.correo)
                .input("direccion", sql.VarChar(200), c.direccion)
                .input("esCliente", sql.Bit, c.esCliente)
                .input("esProveedor", sql.Bit, c.esProveedor)
                .input("esEmpleado", sql.Bit, c.esEmpleado)
                .query(`
                    INSERT INTO Clientes (IdCliente, Nombre, Telefono, Correo, Direccion, EsCliente, EsProveedor, EsEmpleado)
                    VALUES (@id, @nombre, @telefono, @correo, @direccion, @esCliente, @esProveedor, @esEmpleado)
                `);
        }
    }

    // 4. Facturas, Detalles, Pagos y Movimientos de prueba (solo si aún no hay facturas)
    const conteoFacturas = await pool.request().query("SELECT COUNT(*) AS Total FROM Facturas");
    if (Number(conteoFacturas.recordset[0]?.Total || 0) === 0) {
        const facturasDemo = [
            {
                idCliente: "001-120590-0014A",
                fecha: fechaRelativa(4, 10, 15),
                estado: "Registrada",
                clave: "SEED-FAC-001",
                items: [
                    { codigo: "SOUV-001", cantidad: 2, precio: 220, descuento: 0 },
                    { codigo: "SOUV-006", cantidad: 3, precio: 110, descuento: 0 }
                ],
                pagos: [
                    { metodo: "Efectivo", monto: 770, montoRecibido: 1000, vuelto: 230, banco: null, ref: null }
                ]
            },
            {
                idCliente: "281-031195-0005M",
                fecha: fechaRelativa(3, 14, 30),
                estado: "Registrada",
                clave: "SEED-FAC-002",
                items: [
                    { codigo: "SOUV-009", cantidad: 2, precio: 1850, descuento: 150 },
                    { codigo: "SOUV-003", cantidad: 3, precio: 480, descuento: 0 }
                ],
                pagos: [
                    { metodo: "Transferencia", monto: 4990, montoRecibido: null, vuelto: null, banco: "BAC", ref: "TRF-BAC-90412" }
                ]
            },
            {
                idCliente: "001-240888-0021K",
                fecha: fechaRelativa(2, 11, 20),
                estado: "Registrada",
                clave: "SEED-FAC-003",
                items: [
                    { codigo: "SOUV-004", cantidad: 1, precio: 950, descuento: 0 },
                    { codigo: "SOUV-007", cantidad: 4, precio: 95, descuento: 0 }
                ],
                pagos: [
                    { metodo: "Tarjeta", monto: 1330, montoRecibido: null, vuelto: null, banco: "LAFISE", ref: "AUTH-LAF-5519" }
                ]
            },
            {
                idCliente: "291-190985-0009R",
                fecha: fechaRelativa(1, 16, 45),
                estado: "Registrada",
                clave: "SEED-FAC-004",
                items: [
                    { codigo: "SOUV-003", cantidad: 4, precio: 480, descuento: 100 },
                    { codigo: "SOUV-008", cantidad: 6, precio: 85, descuento: 0 }
                ],
                pagos: [
                    { metodo: "Efectivo", monto: 1000, montoRecibido: 1000, vuelto: 0, banco: null, ref: null },
                    { metodo: "Tarjeta", monto: 1330, montoRecibido: null, vuelto: null, banco: "BAC", ref: "AUTH-BAC-7721" }
                ]
            },
            {
                idCliente: "001-170492-0033P",
                fecha: fechaRelativa(0, 9, 30),
                estado: "Registrada",
                clave: "SEED-FAC-005",
                items: [
                    { codigo: "SOUV-001", cantidad: 3, precio: 220, descuento: 0 },
                    { codigo: "SOUV-010", cantidad: 1, precio: 640, descuento: 40 }
                ],
                pagos: [
                    { metodo: "Efectivo", monto: 1260, montoRecibido: 1500, vuelto: 240, banco: null, ref: null }
                ]
            },
            {
                idCliente: "001-050100-0042T",
                fecha: fechaRelativa(0, 11, 5),
                estado: "Anulada",
                clave: "SEED-FAC-006",
                motivoAnulacion: "Cliente solicitó cambio de producto",
                items: [
                    { codigo: "SOUV-002", cantidad: 2, precio: 240, descuento: 0 }
                ],
                pagos: [
                    { metodo: "Efectivo", monto: 480, montoRecibido: 500, vuelto: 20, banco: null, ref: null, estado: "Anulado" }
                ]
            }
        ];

        for (const fac of facturasDemo) {
            const subtotal = fac.items.reduce((acc, it) => acc + it.cantidad * it.precio, 0);
            const descuento = fac.items.reduce((acc, it) => acc + it.descuento, 0);
            const total = subtotal - descuento;

            const inserted = await pool.request()
                .input("idCliente", sql.VarChar(20), fac.idCliente)
                .input("fecha", sql.DateTime2, fac.fecha)
                .input("subtotal", sql.Decimal(12, 2), subtotal)
                .input("descuento", sql.Decimal(12, 2), descuento)
                .input("impuesto", sql.Decimal(12, 2), 0)
                .input("total", sql.Decimal(12, 2), total)
                .input("estado", sql.VarChar(16), fac.estado)
                .input("idUsuario", sql.Int, idAdmin)
                .input("clave", sql.VarChar(64), fac.clave)
                .input("motivoAnulacion", sql.NVarChar(255), fac.motivoAnulacion || null)
                .query(`
                    INSERT INTO Facturas
                        (IdCliente, Fecha, Subtotal, Descuento, Impuesto, Total, Estado, IdUsuario, ClaveIdempotencia, MotivoAnulacion)
                    VALUES
                        (@idCliente, @fecha, @subtotal, @descuento, @impuesto, @total, @estado, @idUsuario, @clave, @motivoAnulacion)
                    RETURNING IdFactura
                `);

            const idFactura = inserted.recordset[0].IdFactura;

            for (const it of fac.items) {
                await pool.request()
                    .input("idFactura", sql.Int, idFactura)
                    .input("codigo", sql.VarChar(20), it.codigo)
                    .input("cantidad", sql.Int, it.cantidad)
                    .input("precio", sql.Decimal(10, 2), it.precio)
                    .input("descuento", sql.Decimal(12, 2), it.descuento)
                    .query(`
                        INSERT INTO DetalleFactura (IdFactura, CodigoProducto, Cantidad, PrecioUnitario, DescuentoAplicado)
                        VALUES (@idFactura, @codigo, @cantidad, @precio, @descuento)
                    `);

                await pool.request()
                    .input("codigo", sql.VarChar(20), it.codigo)
                    .input("tipo", sql.VarChar(20), "Salida")
                    .input("cantidad", sql.Int, it.cantidad)
                    .input("anterior", sql.Int, 20 + it.cantidad)
                    .input("nuevo", sql.Int, 20)
                    .input("motivo", sql.VarChar(255), `Venta factura N° ${idFactura}`)
                    .input("fecha", sql.DateTime2, fac.fecha)
                    .input("usuario", sql.Int, idAdmin)
                    .input("factura", sql.Int, idFactura)
                    .query(`
                        INSERT INTO MovimientosInventario
                            (CodigoProducto, TipoMovimiento, Cantidad, StockAnterior, StockNuevo, Motivo, Fecha, IdUsuario, IdFactura)
                        VALUES
                            (@codigo, @tipo, @cantidad, @anterior, @nuevo, @motivo, @fecha, @usuario, @factura)
                    `);
            }

            for (const pg of fac.pagos) {
                await pool.request()
                    .input("idFactura", sql.Int, idFactura)
                    .input("metodo", sql.VarChar(20), pg.metodo)
                    .input("monto", sql.Decimal(12, 2), pg.monto)
                    .input("montoRecibido", sql.Decimal(12, 2), pg.montoRecibido)
                    .input("vuelto", sql.Decimal(12, 2), pg.vuelto)
                    .input("banco", sql.VarChar(40), pg.banco)
                    .input("ref", sql.VarChar(60), pg.ref)
                    .input("estado", sql.VarChar(20), pg.estado || "Registrado")
                    .input("fecha", sql.DateTime2, fac.fecha)
                    .input("usuario", sql.Int, idAdmin)
                    .query(`
                        INSERT INTO Pagos
                            (IdFactura, Metodo, Monto, MontoRecibido, Vuelto, Banco, Referencia, Estado, Fecha, IdUsuario)
                        VALUES
                            (@idFactura, @metodo, @monto, @montoRecibido, @vuelto, @banco, @ref, @estado, @fecha, @usuario)
                    `);
            }
        }
    }

    console.log("Datos de prueba cargados correctamente en SOUVANIC.");
    await sql.close();
}

seed().catch(error => {
    console.error("Error al cargar datos de prueba:", error);
    process.exit(1);
});

