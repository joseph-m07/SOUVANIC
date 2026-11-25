"use strict";

const { sql, config } = require("../config/database");
const { neurona } = require("../core/neurona");

async function listarProductos(req, res) {
    try {
        const pool = await sql.connect(config);

        const resultado = await pool.request().query(
            "SELECT * FROM Productos"
        );

        res.json(resultado.recordset);

    } catch (error) {
        console.error("Error al obtener productos:", error);

        res.status(500).json({
            mensaje: "Error al consultar los productos",
            error: error.message
        });
    }
}

async function crearProducto(req, res) {
    try {
        const {
            codigo,
            nombre,
            categoria,
            precio,
            stock,
            descripcion,
            stockMinimo
        } = req.body;

        const descripcionTexto = typeof descripcion === "string"
            ? descripcion.trim()
            : "";

        const stockMinimoNumero = stockMinimo === undefined
            ? 5
            : Number(stockMinimo);

        if (
            !codigo || !nombre || !categoria ||
            precio === undefined || stock === undefined ||
            !Number.isFinite(Number(precio)) ||
            !Number.isInteger(Number(stock)) ||
            Number(precio) <= 0 || Number(stock) < 0 ||
            !Number.isInteger(stockMinimoNumero) ||
            stockMinimoNumero < 0 ||
            descripcionTexto.length > 255
        ) {
            return res.status(400).json({
                mensaje: "Datos del producto inválidos"
            });
        }

        const pool = await sql.connect(config);

        await pool.request()
            .input("codigo", sql.VarChar(20), codigo.trim())
            .input("nombre", sql.VarChar(100), nombre.trim())
            .input("categoria", sql.VarChar(50), categoria.trim())
            .input("precio", sql.Decimal(10, 2), Number(precio))
            .input("stock", sql.Int, Number(stock))
            .input("stockMinimo", sql.Int, stockMinimoNumero)
            .input("descripcion", sql.NVarChar(255), descripcionTexto || null)
            .query(`
                INSERT INTO Productos
                (CodigoProducto, Nombre, Categoria, Precio, Stock,
                 Descripcion, Activo, StockMinimo)
                VALUES
                (@codigo, @nombre, @categoria, @precio, @stock,
                 @descripcion, 1, @stockMinimo)
            `);

        neurona.emitir("producto:creado", {
            codigo: codigo.trim(),
            nombre: nombre.trim(),
            categoria: categoria.trim(),
            stock: stockInicial
        }, { origen: "productos.controller", idUsuario: req.usuario?.id });

        res.status(201).json({
            mensaje: "Producto registrado correctamente"
        });

    } catch (error) {
        console.error("Error al registrar producto:", error);

        if (error.number === 2627 || error.number === 2601) {
            return res.status(409).json({
                mensaje: "Ya existe un producto con ese código"
            });
        }

        res.status(500).json({
            mensaje: "No se pudo registrar el producto",
            error: error.message
        });
    }
}

async function actualizarProducto(req, res) {
    try {
        const codigoOriginal = req.params.codigo;
        const {
            codigo,
            nombre,
            categoria,
            precio,
            stock,
            descripcion,
            stockMinimo
        } = req.body;

        const descripcionTexto = typeof descripcion === "string"
            ? descripcion.trim()
            : "";

        const stockMinimoNumero = stockMinimo === undefined
            ? null
            : Number(stockMinimo);

        if (
            typeof codigo !== "string" || !codigo.trim() ||
            typeof nombre !== "string" || !nombre.trim() ||
            typeof categoria !== "string" || !categoria.trim() ||
            codigo.length > 20 ||
            nombre.length > 100 ||
            categoria.length > 50 ||
            descripcionTexto.length > 255 ||
            precio === "" || precio === null ||
            stock === "" || stock === null ||
            !Number.isFinite(Number(precio)) ||
            !Number.isInteger(Number(stock)) ||
            Number(precio) <= 0 ||
            Number(stock) < 0 ||
            (stockMinimoNumero !== null &&
                (!Number.isInteger(stockMinimoNumero) ||
                    stockMinimoNumero < 0))
        ) {
            return res.status(400).json({
                mensaje: "Datos del producto inválidos"
            });
        }

        const pool = await sql.connect(config);

        const resultado = await pool.request()
            .input("codigoOriginal", sql.VarChar(20), codigoOriginal)
            .input("codigo", sql.VarChar(20), codigo.trim())
            .input("nombre", sql.VarChar(100), nombre.trim())
            .input("categoria", sql.VarChar(50), categoria.trim())
            .input("precio", sql.Decimal(10, 2), Number(precio))
            .input("stock", sql.Int, Number(stock))
            .input("stockMinimo", sql.Int, stockMinimoNumero)
            .input("descripcion", sql.NVarChar(255), descripcionTexto || null)
            .query(`
                UPDATE Productos
                SET CodigoProducto = @codigo,
                    Nombre = @nombre,
                    Categoria = @categoria,
                    Precio = @precio,
                    Stock = @stock,
                    Descripcion = @descripcion,
                    StockMinimo = COALESCE(@stockMinimo, StockMinimo)
                WHERE CodigoProducto = @codigoOriginal
            `);

        if (resultado.rowsAffected[0] === 0) {
            return res.status(404).json({
                mensaje: "Producto no encontrado"
            });
        }

        res.json({
            mensaje: "Producto actualizado correctamente"
        });

    } catch (error) {
        console.error("Error al editar producto:", error);

        if (error.number === 2627 || error.number === 2601) {
            return res.status(409).json({
                mensaje: "Ya existe un producto con ese código"
            });
        }

        res.status(500).json({
            mensaje: "No se pudo actualizar el producto",
            error: error.message
        });
    }
}

async function cambiarEstadoProducto(req, res) {
    try {
        const { activo } = req.body;

        if (typeof activo !== "boolean") {
            return res.status(400).json({
                mensaje: "El estado del producto no es válido."
            });
        }

        const pool = await sql.connect(config);

        const resultado = await pool.request()
            .input("codigo", sql.VarChar(20), req.params.codigo)
            .input("activo", sql.Bit, activo ? 1 : 0)
            .query(`
                UPDATE Productos
                SET Activo = @activo
                WHERE CodigoProducto = @codigo
            `);

        if (resultado.rowsAffected[0] === 0) {
            return res.status(404).json({
                mensaje: "Producto no encontrado"
            });
        }

        res.json({
            mensaje: activo
                ? "Producto activado correctamente."
                : "Producto desactivado correctamente.",
            activo
        });

    } catch (error) {
        console.error("Error al cambiar estado del producto:", error);

        res.status(500).json({
            mensaje: "No se pudo cambiar el estado del producto."
        });
    }
}

async function actualizarStockMinimo(req, res) {
    try {
        const stockMinimo = Number(req.body.stockMinimo);

        if (!Number.isInteger(stockMinimo) || stockMinimo < 0) {
            return res.status(400).json({
                mensaje: "El stock mínimo debe ser un entero mayor o igual a cero."
            });
        }

        const pool = await sql.connect(config);

        const resultado = await pool.request()
            .input("codigo", sql.VarChar(20), req.params.codigo)
            .input("stockMinimo", sql.Int, stockMinimo)
            .query(`
                UPDATE Productos
                SET StockMinimo = @stockMinimo
                WHERE CodigoProducto = @codigo
            `);

        if (resultado.rowsAffected[0] === 0) {
            return res.status(404).json({
                mensaje: "Producto no encontrado"
            });
        }

        neurona.emitir("producto:stock_minimo_actualizado", {
            codigo: req.params.codigo,
            stockMinimo
        }, { origen: "productos.controller", idUsuario: req.usuario?.id });

        res.json({
            mensaje: "Stock mínimo actualizado correctamente.",
            stockMinimo
        });

    } catch (error) {
        console.error("Error al actualizar stock mínimo:", error);

        res.status(500).json({
            mensaje: "No se pudo actualizar el stock mínimo."
        });
    }
}

async function eliminarProducto(req, res) {

    try {
        const codigo = req.params.codigo;

        const pool = await sql.connect(config);

        const resultado = await pool.request()
            .input("codigo", sql.VarChar(20), codigo)
            .query(`
                DELETE FROM Productos
                WHERE CodigoProducto = @codigo
            `);

        if (resultado.rowsAffected[0] === 0) {
            return res.status(404).json({
                mensaje: "Producto no encontrado"
            });
        }

        res.json({
            mensaje: "Producto eliminado correctamente"
        });

    } catch (error) {
        console.error("Error al eliminar producto:", error);

        res.status(500).json({
            mensaje: "No se pudo eliminar el producto",
            error: error.message
        });
    }
}

module.exports = {
    listarProductos,
    crearProducto,
    actualizarProducto,
    cambiarEstadoProducto,
    actualizarStockMinimo,
    eliminarProducto
};
