"use strict";

const { sql, config, isSqlite } = require("../config/database");
const { neurona } = require("../core/neurona");
const { redondearMoneda, errorHttp, validarPagoManual } = require("../services/pagos.service");

async function crearFactura(req, res) {

    const {
        idCliente,
        productos,
        pagos,
        descuentoGeneral,
        impuestoPorcentaje,
        claveIdempotencia
    } = req.body;

    if (
        typeof idCliente !== "string" ||
        idCliente.trim() === "" ||
        !Array.isArray(productos) ||
        productos.length === 0 ||
        productos.length > 100
    ) {
        return res.status(400).json({
            mensaje: "Seleccioná un cliente y agregá productos."
        });
    }

    const pagosEntrada = pagos === undefined || pagos === null
        ? []
        : pagos;

    if (!Array.isArray(pagosEntrada) || pagosEntrada.length > 10) {
        return res.status(400).json({
            mensaje: "Los pagos enviados no son válidos."
        });
    }

    const descuentoGeneralNumero = descuentoGeneral === undefined
        ? 0
        : Number(descuentoGeneral);

    const impuestoNumero = impuestoPorcentaje === undefined
        ? 0
        : Number(impuestoPorcentaje);

    if (
        !Number.isFinite(descuentoGeneralNumero) ||
        descuentoGeneralNumero < 0 ||
        !Number.isFinite(impuestoNumero) ||
        impuestoNumero < 0 ||
        impuestoNumero > 100
    ) {
        return res.status(400).json({
            mensaje: "Los descuentos o impuestos no son válidos."
        });
    }

    if (
        claveIdempotencia !== undefined &&
        (typeof claveIdempotencia !== "string" ||
            claveIdempotencia.length > 64)
    ) {
        return res.status(400).json({
            mensaje: "La clave de idempotencia no es válida."
        });
    }

    if (
        req.usuario.rol !== "Administrador" &&
        (descuentoGeneralNumero > 0 ||
            impuestoNumero > 0 ||
            productos.some(item => Number(item.descuentoPorcentaje) > 0))
    ) {
        return res.status(403).json({
            mensaje: "No tenés permisos para aplicar descuentos o impuestos."
        });
    }

    const codigos = new Set();
    const productosNormalizados = [];

    for (const producto of productos) {

        const descuentoProducto = producto && producto.descuentoPorcentaje !== undefined
            ? Number(producto.descuentoPorcentaje)
            : 0;

        if (
            !producto ||
            typeof producto.codigo !== "string" ||
            producto.codigo.trim() === "" ||
            !Number.isInteger(producto.cantidad) ||
            producto.cantidad <= 0 ||
            !Number.isFinite(descuentoProducto) ||
            descuentoProducto < 0 ||
            descuentoProducto > 100 ||
            codigos.has(producto.codigo)
        ) {
            return res.status(400).json({
                mensaje: "Los productos, cantidades o descuentos no son válidos."
            });
        }

        codigos.add(producto.codigo);
        productosNormalizados.push({
            codigo: producto.codigo.trim(),
            cantidad: producto.cantidad,
            descuentoPorcentaje: descuentoProducto
        });
    }

    let pagosNormalizados;

    try {
        pagosNormalizados = pagosEntrada.map(validarPagoManual);
    } catch (error) {
        return res.status(error.status || 400).json({
            mensaje: error.message
        });
    }

    const clave = typeof claveIdempotencia === "string"
        ? claveIdempotencia.trim()
        : null;

    let transaccion;

    try {
        const pool = await sql.connect(config);

        transaccion = new sql.Transaction(pool);
        await transaccion.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

        // Reintento: devolver la factura ya registrada sin duplicar nada
        if (clave) {

            const existente = await new sql.Request(transaccion)
                .input("clave", sql.VarChar(64), clave)
                .query(`
                    SELECT
                        f.IdFactura,
                        f.Total,
                        f.Estado,
                        ISNULL((
                            SELECT SUM(p.Monto)
                            FROM Pagos p
                            WHERE p.IdFactura = f.IdFactura
                              AND p.Estado <> 'Anulado'
                        ), 0) AS Pagado
                    FROM Facturas f WITH (UPDLOCK, HOLDLOCK)
                    WHERE f.ClaveIdempotencia = @clave
                `);

            if (existente.recordset.length > 0) {

                const facturaExistente = existente.recordset[0];

                await transaccion.rollback();

                return res.status(200).json({
                    mensaje: "La factura ya estaba registrada.",
                    duplicado: true,
                    idFactura: facturaExistente.IdFactura,
                    total: Number(facturaExistente.Total),
                    estado: facturaExistente.Estado,
                    pagado: Number(facturaExistente.Pagado),
                    saldo: redondearMoneda(
                        Number(facturaExistente.Total) -
                        Number(facturaExistente.Pagado)
                    ),
                    vuelto: 0
                });
            }
        }

        const cliente = await new sql.Request(transaccion)
            .input("idCliente", sql.VarChar(29), idCliente.trim())
            .query(`
                SELECT IdCliente
                FROM Clientes WITH (UPDLOCK, HOLDLOCK)
                WHERE IdCliente = @idCliente
            `);

        if (cliente.recordset.length === 0) {
            throw errorHttp("El cliente seleccionado no existe.", 404);
        }

        let subtotalBruto = 0;
        let descuentoProductos = 0;
        const detalle = [];

        for (const producto of productosNormalizados) {

            const resultado = await new sql.Request(transaccion)
                .input("codigo", sql.VarChar(29), producto.codigo)
                .query(`
                    SELECT
                        Nombre,
                        Precio,
                        Stock,
                        Activo
                    FROM Productos WITH (UPDLOCK, HOLDLOCK)
                    WHERE CodigoProducto = @codigo
                `);

            if (resultado.recordset.length === 0) {
                throw errorHttp(
                    `El producto ${producto.codigo} no existe.`,
                    404
                );
            }

            const datos = resultado.recordset[0];

            if (!datos.Activo) {
                throw errorHttp(
                    `El producto ${datos.Nombre} está inactivo y no se puede vender.`
                );
            }

            if (Number(datos.Stock) < producto.cantidad) {
                throw errorHttp(
                    `Stock insuficiente de ${datos.Nombre}. ` +
                    `Disponible: ${datos.Stock}. Solicitado: ${producto.cantidad}.`
                );
            }

            const precio = Number(datos.Precio);
            const subtotalLinea = redondearMoneda(precio * producto.cantidad);
            const descuentoLinea = redondearMoneda(
                subtotalLinea * (producto.descuentoPorcentaje / 100)
            );

            subtotalBruto = redondearMoneda(subtotalBruto + subtotalLinea);
            descuentoProductos = redondearMoneda(
                descuentoProductos + descuentoLinea
            );

            detalle.push({
                codigo: producto.codigo,
                nombre: datos.Nombre,
                cantidad: producto.cantidad,
                precio,
                subtotal: subtotalLinea,
                descuento: descuentoLinea
            });
        }

        const descuentoGeneralAplicado = redondearMoneda(
            descuentoGeneralNumero
        );

        if (
            descuentoGeneralAplicado >
            redondearMoneda(subtotalBruto - descuentoProductos)
        ) {
            throw errorHttp("El descuento general supera el subtotal.");
        }

        const descuentoTotal = redondearMoneda(
            descuentoProductos + descuentoGeneralAplicado
        );

        const baseImpuesto = redondearMoneda(
            subtotalBruto - descuentoTotal
        );

        const impuesto = redondearMoneda(
            baseImpuesto * (impuestoNumero / 100)
        );

        const total = redondearMoneda(baseImpuesto + impuesto);

        if (total <= 0) {
            throw errorHttp("El total de la factura debe ser mayor que cero.");
        }

        const totalPagado = redondearMoneda(
            pagosNormalizados.reduce((suma, pago) => suma + pago.monto, 0)
        );

        if (totalPagado > total) {
            throw errorHttp(
                `El total de pagos (C$ ${totalPagado.toFixed(2)}) ` +
                `supera el total de la factura (C$ ${total.toFixed(2)}).`
            );
        }

        // Referencias repetidas de tarjeta o transferencia
        for (const pago of pagosNormalizados) {

            if (!pago.referencia) continue;

            const repetida = await new sql.Request(transaccion)
                .input("metodo", sql.VarChar(20), pago.metodo)
                .input("banco", sql.VarChar(40), pago.banco)
                .input("referencia", sql.VarChar(60), pago.referencia)
                .query(`
                    SELECT TOP 1 IdPago
                    FROM Pagos WITH (UPDLOCK, HOLDLOCK)
                    WHERE Metodo = @metodo
                      AND ISNULL(Banco, '') = ISNULL(@banco, '')
                      AND Referencia = @referencia
                      AND Estado <> 'Anulado'
                `);

            if (repetida.recordset.length > 0) {
                throw errorHttp(
                    `La referencia ${pago.referencia} ya fue registrada en otro pago.`,
                    409
                );
            }
        }

        const vueltoTotal = redondearMoneda(
            pagosNormalizados.reduce(
                (suma, pago) => suma + (pago.vuelto || 0),
                0
            )
        );

        const estado = pagosNormalizados.length === 0
            ? "Registrada"
            : totalPagado >= redondearMoneda(total - 0.009)
                ? "Pagada"
                : "Pendiente";

        const factura = await new sql.Request(transaccion)
            .input("idCliente", sql.VarChar(29), idCliente.trim())
            .input("subtotal", sql.Decimal(12, 2), subtotalBruto)
            .input("descuento", sql.Decimal(12, 2), descuentoTotal)
            .input("impuesto", sql.Decimal(12, 2), impuesto)
            .input("total", sql.Decimal(12, 2), total)
            .input("estado", sql.VarChar(16), estado)
            .input("idUsuario", sql.Int, req.usuario.id)
            .input("clave", sql.VarChar(64), clave || null)
            .query(isSqlite ? `
                INSERT INTO Facturas
                    (IdCliente, Subtotal, Descuento, Impuesto, Total,
                     Estado, IdUsuario, ClaveIdempotencia)
                VALUES
                    (@idCliente, @subtotal, @descuento, @impuesto, @total,
                     @estado, @idUsuario, @clave)
                RETURNING IdFactura
            ` : `
                INSERT INTO Facturas
                    (IdCliente, Subtotal, Descuento, Impuesto, Total,
                     Estado, IdUsuario, ClaveIdempotencia)
                OUTPUT INSERTED.IdFactura
                VALUES
                    (@idCliente, @subtotal, @descuento, @impuesto, @total,
                     @estado, @idUsuario, @clave)
            `);

        const idFactura = factura.recordset[0].IdFactura;

        for (const item of detalle) {

            await new sql.Request(transaccion)
                .input("idFactura", sql.Int, idFactura)
                .input("codigo", sql.VarChar(29), item.codigo)
                .input("cantidad", sql.Int, item.cantidad)
                .input("precio", sql.Decimal(10, 2), item.precio)
                .input("descuento", sql.Decimal(12, 2), item.descuento)
                .query(`
                    INSERT INTO DetalleFactura
                        (IdFactura, CodigoProducto, Cantidad,
                         PrecioUnitario, DescuentoAplicado)
                    VALUES
                        (@idFactura, @codigo, @cantidad,
                         @precio, @descuento)
                `);
        }

        // Descontar stock y dejar el movimiento vinculado a la factura
        for (const item of detalle) {

            const stock = await new sql.Request(transaccion)
                .input("codigo", sql.VarChar(29), item.codigo)
                .input("cantidad", sql.Int, item.cantidad)
                .query(isSqlite ? `
                    UPDATE Productos
                    SET Stock = Stock - @cantidad
                    WHERE CodigoProducto = @codigo
                      AND Activo = 1
                      AND Stock >= @cantidad
                    RETURNING (Stock + @cantidad) AS StockAnterior,
                              Stock AS StockNuevo
                ` : `
                    UPDATE Productos
                    SET Stock = Stock - @cantidad
                    OUTPUT deleted.Stock AS StockAnterior,
                           inserted.Stock AS StockNuevo
                    WHERE CodigoProducto = @codigo
                      AND Activo = 1
                      AND Stock >= @cantidad
                `);

            if (stock.recordset.length === 0) {
                throw errorHttp(
                    `Stock insuficiente de ${item.nombre} por una venta simultánea.`,
                    409
                );
            }

            const stockAnterior = Number(stock.recordset[0].StockAnterior);
            const stockNuevo = Number(stock.recordset[0].StockNuevo);

            await new sql.Request(transaccion)
                .input("codigo", sql.VarChar(29), item.codigo)
                .input("tipo", sql.VarChar(20), "Salida")
                .input("cantidad", sql.Int, item.cantidad)
                .input("anterior", sql.Int, stockAnterior)
                .input("nuevo", sql.Int, stockNuevo)
                .input("motivo", sql.VarChar(255), `Venta factura N° ${idFactura}`)
                .input("usuario", sql.Int, req.usuario.id)
                .input("factura", sql.Int, idFactura)
                .query(`
                    INSERT INTO MovimientosInventario
                        (CodigoProducto, TipoMovimiento, Cantidad,
                         StockAnterior, StockNuevo, Motivo,
                         IdUsuario, IdFactura)
                    VALUES
                        (@codigo, @tipo, @cantidad,
                         @anterior, @nuevo, @motivo,
                         @usuario, @factura)
                `);
        }

        for (const pago of pagosNormalizados) {

            await new sql.Request(transaccion)
                .input("idFactura", sql.Int, idFactura)
                .input("metodo", sql.VarChar(20), pago.metodo)
                .input("monto", sql.Decimal(12, 2), pago.monto)
                .input("montoRecibido", sql.Decimal(12, 2), pago.montoRecibido)
                .input("vuelto", sql.Decimal(12, 2), pago.vuelto)
                .input("banco", sql.VarChar(40), pago.banco)
                .input("bancoDestino", sql.VarChar(60), pago.bancoDestino)
                .input("cuentaDestino", sql.VarChar(60), pago.cuentaDestino)
                .input("referencia", sql.VarChar(60), pago.referencia)
                .input("observaciones", sql.NVarChar(255), pago.observaciones)
                .input("usuario", sql.Int, req.usuario.id)
                .query(`
                    INSERT INTO Pagos
                        (IdFactura, Metodo, Monto, MontoRecibido, Vuelto,
                         Banco, BancoDestino, CuentaDestino, Referencia,
                         Observaciones, Estado, IdUsuario)
                    VALUES
                        (@idFactura, @metodo, @monto, @montoRecibido, @vuelto,
                         @banco, @bancoDestino, @cuentaDestino, @referencia,
                         @observaciones, 'Registrado', @usuario)
                `);
        }

        await transaccion.commit();

        neurona.emitir("factura:emitida", {
            idFactura,
            total,
            estado,
            productos: Array.isArray(productos) ? productos.map(p => p.codigo) : []
        }, { origen: "facturas.controller", idUsuario: req.usuario?.id });

        res.status(201).json({
            mensaje: "Factura guardada correctamente",
            idFactura,
            subtotal: subtotalBruto,
            descuento: descuentoTotal,
            impuesto,
            total,
            estado,
            pagado: totalPagado,
            saldo: redondearMoneda(total - totalPagado),
            vuelto: vueltoTotal
        });

    } catch (error) {

        if (transaccion) {
            try {
                await transaccion.rollback();
            } catch (rollbackError) {
                console.error("Error al revertir:", rollbackError);
            }
        }

        console.error("Error al guardar factura:", error);

        if (error.number === 2601 || error.number === 2627) {
            return res.status(409).json({
                mensaje: "Se detectó un registro duplicado. " +
                    "Revisá el historial antes de volver a intentar."
            });
        }

        res.status(error.status || 400).json({
            mensaje: error.message
        });
    }
}

async function listarFacturas(req, res) {

    try {
        const pool = await sql.connect(config);

        const resultado = await pool.request().query(`
            SELECT
                f.IdFactura,
                f.Fecha,
                c.Nombre AS Cliente,
                f.Subtotal,
                f.Descuento,
                f.Impuesto,
                f.Total,
                f.Estado,
                f.FechaAnulacion,
                f.MotivoAnulacion,
                u.Nombre AS Responsable,
                ISNULL((
                    SELECT SUM(p.Monto)
                    FROM Pagos p
                    WHERE p.IdFactura = f.IdFactura
                      AND p.Estado <> 'Anulado'
                ), 0) AS Pagado,
                ${isSqlite ? `
                COALESCE((
                    SELECT GROUP_CONCAT(DISTINCT p.Metodo)
                    FROM Pagos p
                    WHERE p.IdFactura = f.IdFactura
                      AND p.Estado <> 'Anulado'
                ), '') AS MetodosPago` : `
                ISNULL(STUFF((
                    SELECT DISTINCT ', ' + p.Metodo
                    FROM Pagos p
                    WHERE p.IdFactura = f.IdFactura
                      AND p.Estado <> 'Anulado'
                    FOR XML PATH('')
                ), 1, 2, ''), '') AS MetodosPago`}
            FROM Facturas f
            INNER JOIN Clientes c
                ON f.IdCliente = c.IdCliente
            LEFT JOIN Usuarios u
                ON f.IdUsuario = u.IdUsuario
            ORDER BY f.IdFactura DESC
        `);

        res.json(resultado.recordset);

    } catch (error) {

        console.error("Error al consultar facturas:", error);

        res.status(500).json({
            mensaje: "No se pudieron obtener las facturas"
        });
    }
}

async function obtenerDetalleFactura(req, res) {

    try {
        const idFactura = Number(req.params.id);

        // Validar el número de factura
        if (!Number.isInteger(idFactura) || idFactura <= 0) {
            return res.status(400).json({
                mensaje: "Número de factura no válido."
            });
        }

        const pool = await sql.connect(config);

        const resultado = await pool.request()
            .input("idFactura", sql.Int, idFactura)
            .query(`
                SELECT
                    d.IdFactura,
                    d.CodigoProducto,
                    p.Nombre AS Producto,
                    d.Cantidad,
                    d.PrecioUnitario,
                    ISNULL(d.DescuentoAplicado, 0) AS DescuentoAplicado,
                    ISNULL(
                        d.Subtotal,
                        d.Cantidad * d.PrecioUnitario
                    ) AS Subtotal
                FROM DetalleFactura d
                INNER JOIN Productos p
                    ON d.CodigoProducto = p.CodigoProducto
                WHERE d.IdFactura = @idFactura
                ORDER BY ${isSqlite ? "d.IdDetalle" : "d.IdDeatlle"} ASC
            `);

        res.json(resultado.recordset);

    } catch (error) {

        console.error("Error al consultar detalle:", error);

        res.status(500).json({
            mensaje: "No se pudo consultar el detalle de la factura."
        });
    }
}

async function obtenerFacturaCompleta(req, res) {

    try {
        const idFactura = Number(req.params.id);

        if (!Number.isInteger(idFactura) || idFactura <= 0) {
            return res.status(400).json({
                mensaje: "Número de factura no válido."
            });
        }

        const pool = await sql.connect(config);

        const cabecera = await pool.request()
            .input("idFactura", sql.Int, idFactura)
            .query(`
                SELECT
                    f.IdFactura,
                    f.Fecha,
                    f.IdCliente,
                    c.Nombre AS Cliente,
                    c.Telefono,
                    c.Correo,
                    c.Direccion,
                    f.Subtotal,
                    f.Descuento,
                    f.Impuesto,
                    f.Total,
                    f.Estado,
                    f.FechaAnulacion,
                    f.MotivoAnulacion,
                    f.IdUsuario,
                    u.Nombre AS Responsable,
                    ua.Nombre AS UsuarioAnulacion
                FROM Facturas f
                INNER JOIN Clientes c
                    ON f.IdCliente = c.IdCliente
                LEFT JOIN Usuarios u
                    ON f.IdUsuario = u.IdUsuario
                LEFT JOIN Usuarios ua
                    ON f.IdUsuarioAnulacion = ua.IdUsuario
                WHERE f.IdFactura = @idFactura
            `);

        if (cabecera.recordset.length === 0) {
            return res.status(404).json({
                mensaje: "La factura no existe."
            });
        }

        const detalle = await pool.request()
            .input("idFactura", sql.Int, idFactura)
            .query(`
                SELECT
                    d.CodigoProducto,
                    p.Nombre AS Producto,
                    d.Cantidad,
                    d.PrecioUnitario,
                    ISNULL(d.DescuentoAplicado, 0) AS DescuentoAplicado,
                    ISNULL(
                        d.Subtotal,
                        d.Cantidad * d.PrecioUnitario
                    ) AS Subtotal
                FROM DetalleFactura d
                INNER JOIN Productos p
                    ON d.CodigoProducto = p.CodigoProducto
                WHERE d.IdFactura = @idFactura
                ORDER BY ${isSqlite ? "d.IdDetalle" : "d.IdDeatlle"} ASC
            `);

        const pagos = await pool.request()
            .input("idFactura", sql.Int, idFactura)
            .query(`
                SELECT
                    p.IdPago,
                    p.Metodo,
                    p.Monto,
                    p.MontoRecibido,
                    p.Vuelto,
                    p.Banco,
                    p.BancoDestino,
                    p.CuentaDestino,
                    p.Referencia,
                    p.Observaciones,
                    p.Estado,
                    p.Fecha,
                    u.Nombre AS Responsable
                FROM Pagos p
                LEFT JOIN Usuarios u
                    ON p.IdUsuario = u.IdUsuario
                WHERE p.IdFactura = @idFactura
                ORDER BY p.IdPago ASC
            `);

        res.json({
            factura: cabecera.recordset[0],
            detalle: detalle.recordset,
            pagos: pagos.recordset
        });

    } catch (error) {

        console.error("Error al consultar factura completa:", error);

        res.status(500).json({
            mensaje: "No se pudo consultar la factura."
        });
    }
}

async function anularFactura(req, res) {

    const idFactura = Number(req.params.id);
    const motivo = typeof req.body.motivo === "string"
        ? req.body.motivo.trim()
        : "";

    if (!Number.isInteger(idFactura) || idFactura <= 0) {
        return res.status(400).json({
            mensaje: "Número de factura no válido."
        });
    }

    if (!motivo || motivo.length > 255) {
        return res.status(400).json({
            mensaje: "El motivo de anulación es obligatorio."
        });
    }

    let transaccion;

    try {
        const pool = await sql.connect(config);

        transaccion = new sql.Transaction(pool);
        await transaccion.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

        const factura = await new sql.Request(transaccion)
            .input("idFactura", sql.Int, idFactura)
            .query(`
                SELECT
                    IdFactura,
                    Estado,
                    Total
                FROM Facturas WITH (UPDLOCK, HOLDLOCK)
                WHERE IdFactura = @idFactura
            `);

        if (factura.recordset.length === 0) {
            throw errorHttp("La factura no existe.", 404);
        }

        if (factura.recordset[0].Estado === "Anulada") {
            throw errorHttp("La factura ya fue anulada.", 409);
        }

        const detalle = await new sql.Request(transaccion)
            .input("idFactura", sql.Int, idFactura)
            .query(`
                SELECT
                    d.CodigoProducto,
                    p.Nombre,
                    d.Cantidad
                FROM DetalleFactura d
                INNER JOIN Productos p
                    ON d.CodigoProducto = p.CodigoProducto
                WHERE d.IdFactura = @idFactura
            `);

        for (const item of detalle.recordset) {

            const stock = await new sql.Request(transaccion)
                .input("codigo", sql.VarChar(29), item.CodigoProducto)
                .input("cantidad", sql.Int, item.Cantidad)
                .query(isSqlite ? `
                    UPDATE Productos
                    SET Stock = Stock + @cantidad
                    WHERE CodigoProducto = @codigo
                    RETURNING (Stock - @cantidad) AS StockAnterior,
                              Stock AS StockNuevo
                ` : `
                    UPDATE Productos
                    SET Stock = Stock + @cantidad
                    OUTPUT deleted.Stock AS StockAnterior,
                           inserted.Stock AS StockNuevo
                    WHERE CodigoProducto = @codigo
                `);

            if (stock.recordset.length === 0) {
                throw errorHttp(
                    `No se encontró el producto ${item.CodigoProducto} para restaurar su stock.`,
                    409
                );
            }

            await new sql.Request(transaccion)
                .input("codigo", sql.VarChar(29), item.CodigoProducto)
                .input("tipo", sql.VarChar(20), "Entrada")
                .input("cantidad", sql.Int, item.Cantidad)
                .input("anterior", sql.Int, stock.recordset[0].StockAnterior)
                .input("nuevo", sql.Int, stock.recordset[0].StockNuevo)
                .input("motivo", sql.VarChar(255), `Anulación factura N° ${idFactura}`)
                .input("observaciones", sql.NVarChar(255), motivo)
                .input("usuario", sql.Int, req.usuario.id)
                .input("factura", sql.Int, idFactura)
                .query(`
                    INSERT INTO MovimientosInventario
                        (CodigoProducto, TipoMovimiento, Cantidad,
                         StockAnterior, StockNuevo, Motivo,
                         Observaciones, IdUsuario, IdFactura)
                    VALUES
                        (@codigo, @tipo, @cantidad,
                         @anterior, @nuevo, @motivo,
                         @observaciones, @usuario, @factura)
                `);
        }

        await new sql.Request(transaccion)
            .input("idFactura", sql.Int, idFactura)
            .query(`
                UPDATE Pagos
                SET Estado = CASE
                    WHEN Metodo = 'Efectivo' THEN 'Anulado'
                    ELSE 'Reversión pendiente'
                END
                WHERE IdFactura = @idFactura
                  AND Estado IN ('Registrado', 'Verificado')
            `);

        await new sql.Request(transaccion)
            .input("idFactura", sql.Int, idFactura)
            .input("usuario", sql.Int, req.usuario.id)
            .input("motivo", sql.NVarChar(255), motivo)
            .query(`
                UPDATE Facturas
                SET Estado = 'Anulada',
                    FechaAnulacion = SYSDATETIME(),
                    IdUsuarioAnulacion = @usuario,
                    MotivoAnulacion = @motivo
                WHERE IdFactura = @idFactura
            `);

        await transaccion.commit();

        neurona.emitir("factura:anulada", {
            idFactura,
            motivo
        }, { origen: "facturas.controller", idUsuario: req.usuario?.id });

        res.json({
            mensaje: `Factura N.° ${idFactura} anulada. El stock fue restaurado y los pagos quedaron marcados para revisión.`,
            idFactura
        });

    } catch (error) {

        if (transaccion) {
            try {
                await transaccion.rollback();
            } catch (rollbackError) {
                console.error("Error al revertir anulación:", rollbackError);
            }
        }

        console.error("Error al anular factura:", error);

        res.status(error.status || 500).json({
            mensaje: error.status
                ? error.message
                : "No se pudo anular la factura."
        });
    }
}

module.exports = {
    crearFactura,
    listarFacturas,
    obtenerDetalleFactura,
    obtenerFacturaCompleta,
    anularFactura
};
