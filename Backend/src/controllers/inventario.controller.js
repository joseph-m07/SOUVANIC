"use strict";

const { sql, config } = require("../config/database");
const { neurona } = require("../core/neurona");

async function obtenerAlertas(req, res) {

    try {

        const pool = await sql.connect(config);

        const resultado = await pool.request().query(`
            SELECT
                CodigoProducto,
                Nombre,
                Categoria,
                Stock,
                StockMinimo,
                Activo
            FROM Productos
            WHERE Stock <= 0 OR Stock <= StockMinimo
            ORDER BY Stock ASC, Nombre ASC
        `);

        res.json(resultado.recordset);

    } catch (error) {

        console.error("Error al consultar inventario:", error);

        res.status(500).json({
            mensaje: "No se pudieron obtener las alertas de inventario"
        });

    }

}

async function registrarMovimiento(req, res) {


    const {
        codigoProducto,
        tipoMovimiento,
        cantidad,
        motivo,
        observaciones
    } = req.body;

    const cantidadNumero = Number(cantidad);
    const tiposValidos = [
        "Entrada",
        "Salida",
        "Ajuste positivo",
        "Ajuste negativo"
    ];
    const observacionesTexto = typeof observaciones === "string"
        ? observaciones.trim()
        : "";

    if (
        !codigoProducto ||
        !tiposValidos.includes(tipoMovimiento) ||
        !Number.isSafeInteger(cantidadNumero) ||
        cantidadNumero <= 0 ||
        typeof motivo !== "string" ||
        !motivo.trim() ||
        motivo.trim().length > 255 ||
        observacionesTexto.length > 255
    ) {
        return res.status(400).json({
            mensaje: "Los datos del movimiento no son válidos."
        });
    }

    const esSuma = tipoMovimiento === "Entrada" ||
        tipoMovimiento === "Ajuste positivo";

    let transaction;

    try {
        const pool = await sql.connect(config);
        transaction = new sql.Transaction(pool);

        await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

        const resultado = await new sql.Request(transaction)
            .input("codigo", sql.VarChar(29), codigoProducto)
            .query(`
                SELECT Stock
                FROM Productos WITH (UPDLOCK, HOLDLOCK)
                WHERE CodigoProducto = @codigo
            `);

        if (resultado.recordset.length === 0) {
            await transaction.rollback();

            return res.status(404).json({
                mensaje: "El producto no existe."
            });
        }

        const stockAnterior = Number(resultado.recordset[0].Stock);

        const stockNuevo = esSuma
            ? stockAnterior + cantidadNumero
            : stockAnterior - cantidadNumero;

        if (stockNuevo < 0) {
            await transaction.rollback();

            return res.status(400).json({
                mensaje:
                    `Stock insuficiente. Solicitaste ${cantidadNumero} ` +
                    `unidades, pero solamente hay ${stockAnterior} disponibles.`
            });
        }

        if (stockNuevo > 2147483647) {
            await transaction.rollback();

            return res.status(400).json({
                mensaje: "La cantidad supera el límite permitido."
            });
        }

        await new sql.Request(transaction)
            .input("codigo", sql.VarChar(29), codigoProducto)
            .input("stockNuevo", sql.Int, stockNuevo)
            .query(`
                UPDATE Productos
                SET Stock = @stockNuevo
                WHERE CodigoProducto = @codigo
            `);

        await new sql.Request(transaction)
            .input("codigo", sql.VarChar(29), codigoProducto)
            .input("tipo", sql.VarChar(20), tipoMovimiento)
            .input("cantidad", sql.Int, cantidadNumero)
            .input("anterior", sql.Int, stockAnterior)
            .input("nuevo", sql.Int, stockNuevo)
            .input("motivo", sql.VarChar(255), motivo.trim())
            .input("observaciones", sql.NVarChar(255), observacionesTexto || null)
            .input("usuario", sql.Int, req.usuario.id)
            .query(`
                INSERT INTO MovimientosInventario
                    (CodigoProducto, TipoMovimiento, Cantidad,
                     StockAnterior, StockNuevo, Motivo,
                     Observaciones, IdUsuario)
                VALUES
                    (@codigo, @tipo, @cantidad,
                     @anterior, @nuevo, @motivo,
                     @observaciones, @usuario)
            `);

        await transaction.commit();

        neurona.emitir("inventario:movimiento_registrado", {
            codigo: codigoProducto,
            tipoMovimiento,
            cantidad: cantidadNumero,
            stockAnterior,
            stockNuevo
        }, { origen: "inventario.controller", idUsuario: req.usuario?.id });

        res.status(201).json({
            mensaje: "Movimiento registrado correctamente.",
            stockAnterior,
            stockNuevo,
            tipoMovimiento,
            cantidad: cantidadNumero
        });

    } catch (error) {

        if (transaction) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error("Error al revertir:", rollbackError);
            }
        }

        console.error("Error al registrar movimiento:", error);

        res.status(500).json({
            mensaje: "No se pudo registrar el movimiento."
        });
    }
}

async function listarMovimientos(req, res) {

    try {

        const pool = await sql.connect(config);

        const resultado = await pool.request().query(`
            SELECT
                m.IdMovimiento,
                m.CodigoProducto,
                p.Nombre AS Producto,
                m.TipoMovimiento,
                m.Cantidad,
                m.StockAnterior,
                m.StockNuevo,
                m.Motivo,
                m.Observaciones,
                m.IdFactura,
                u.Nombre AS Responsable,
                f.Estado AS EstadoFactura,
                m.Fecha
            FROM MovimientosInventario m
            INNER JOIN Productos p
                ON m.CodigoProducto = p.CodigoProducto
            LEFT JOIN Usuarios u
                ON m.IdUsuario = u.IdUsuario
            LEFT JOIN Facturas f
                ON m.IdFactura = f.IdFactura
            ORDER BY m.Fecha DESC, m.IdMovimiento DESC
        `);

        res.json(resultado.recordset);

    } catch (error) {

        console.error(
            "Error al consultar movimientos de inventario:",
            error
        );

        res.status(500).json({
            mensaje: "No se pudo consultar el historial de inventario."
        });

    }

}

module.exports = {
    obtenerAlertas,
    registrarMovimiento,
    listarMovimientos
};
