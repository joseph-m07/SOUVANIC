"use strict";

const { sql, config } = require("../config/database");
const { neurona } = require("../core/neurona");

function normalizarClasificacion(body = {}) {
    const tieneBanderas =
        body.esCliente !== undefined ||
        body.esProveedor !== undefined ||
        body.esEmpleado !== undefined;

    if (!tieneBanderas) {
        return {
            esCliente: true,
            esProveedor: false,
            esEmpleado: false
        };
    }

    return {
        esCliente: Boolean(body.esCliente),
        esProveedor: Boolean(body.esProveedor),
        esEmpleado: Boolean(body.esEmpleado)
    };
}

async function listarClientes(req, res) {
    try {
        const pool = await sql.connect(config);
        const tipo = String(req.query?.tipo || "").trim().toLowerCase();

        let filtro = "";
        if (tipo === "cliente") {
            filtro = "WHERE ISNULL(EsCliente, 1) = 1";
        } else if (tipo === "proveedor") {
            filtro = "WHERE ISNULL(EsProveedor, 0) = 1";
        } else if (tipo === "empleado") {
            filtro = "WHERE ISNULL(EsEmpleado, 0) = 1";
        }

        const resultado = await pool.request().query(`
            SELECT
                IdCliente,
                Nombre,
                Telefono,
                Correo,
                Direccion,
                ISNULL(EsCliente, 1) AS EsCliente,
                ISNULL(EsProveedor, 0) AS EsProveedor,
                ISNULL(EsEmpleado, 0) AS EsEmpleado
            FROM Clientes
            ${filtro}
            ORDER BY Nombre ASC
        `);

        res.json(resultado.recordset);
    } catch (error) {
        console.error("Error al obtener socios:", error);

        res.status(500).json({
            mensaje: "No se pudieron obtener los socios",
            error: error.message
        });
    }
}

async function crearCliente(req, res) {
    try {
        const { id, name, phone, email, address } = req.body;

        const idLimpio = typeof id === "string" ? id.trim() : "";
        const nombreLimpio = typeof name === "string" ? name.trim() : "";
        const telefonoLimpio = typeof phone === "string" ? phone.trim() : "";
        const emailLimpio = typeof email === "string" ? email.trim() : "";
        const direccionLimpia = typeof address === "string" ? address.trim() : "";
        const { esCliente, esProveedor, esEmpleado } = normalizarClasificacion(req.body);

        if (
            !idLimpio ||
            !nombreLimpio ||
            !telefonoLimpio ||
            idLimpio.length > 29 ||
            nombreLimpio.length > 100 ||
            telefonoLimpio.length > 20 ||
            emailLimpio.length > 100 ||
            direccionLimpia.length > 200
        ) {
            return res.status(400).json({
                mensaje: "Datos del socio inválidos"
            });
        }

        if (!esCliente && !esProveedor && !esEmpleado) {
            return res.status(400).json({
                mensaje: "Seleccioná al menos una clasificación (Cliente, Proveedor o Empleado)."
            });
        }

        const pool = await sql.connect(config);

        await pool.request()
            .input("id", sql.VarChar(29), idLimpio)
            .input("nombre", sql.VarChar(100), nombreLimpio)
            .input("telefono", sql.VarChar(20), telefonoLimpio)
            .input("correo", sql.VarChar(100), emailLimpio || null)
            .input("direccion", sql.VarChar(200), direccionLimpia || null)
            .input("esCliente", sql.Bit, esCliente)
            .input("esProveedor", sql.Bit, esProveedor)
            .input("esEmpleado", sql.Bit, esEmpleado)
            .query(`
                INSERT INTO Clientes
                    (IdCliente, Nombre, Telefono, Correo, Direccion, EsCliente, EsProveedor, EsEmpleado)
                VALUES
                    (@id, @nombre, @telefono, @correo, @direccion, @esCliente, @esProveedor, @esEmpleado)
            `);

        neurona.emitir("socio:creado", {
            idSocio: idLimpio,
            nombre: nombreLimpio,
            esCliente,
            esProveedor,
            esEmpleado
        }, { origen: "clientes.controller", idUsuario: req.usuario?.id });

        res.status(201).json({
            mensaje: "Socio registrado correctamente"
        });
    } catch (error) {
        console.error("Error al registrar socio:", error);

        if (error.number === 2627 || error.number === 2601) {
            return res.status(409).json({
                mensaje: "Ya existe un socio con ese ID"
            });
        }

        res.status(500).json({
            mensaje: "No se pudo registrar el socio",
            error: error.message
        });
    }
}

async function actualizarCliente(req, res) {
    try {
        const idOriginal = req.params.id;
        const { id, name, phone, email, address } = req.body;

        const idLimpio = typeof id === "string" ? id.trim() : "";
        const nombreLimpio = typeof name === "string" ? name.trim() : "";
        const telefonoLimpio = typeof phone === "string" ? phone.trim() : "";
        const emailLimpio = typeof email === "string" ? email.trim() : "";
        const direccionLimpia = typeof address === "string" ? address.trim() : "";
        const { esCliente, esProveedor, esEmpleado } = normalizarClasificacion(req.body);

        if (
            !idLimpio ||
            !nombreLimpio ||
            !telefonoLimpio ||
            idLimpio.length > 29 ||
            nombreLimpio.length > 100 ||
            telefonoLimpio.length > 20 ||
            emailLimpio.length > 100 ||
            direccionLimpia.length > 200
        ) {
            return res.status(400).json({
                mensaje: "Datos del socio inválidos"
            });
        }

        if (!esCliente && !esProveedor && !esEmpleado) {
            return res.status(400).json({
                mensaje: "Seleccioná al menos una clasificación (Cliente, Proveedor o Empleado)."
            });
        }

        const pool = await sql.connect(config);

        const resultado = await pool.request()
            .input("idOriginal", sql.VarChar(29), idOriginal)
            .input("id", sql.VarChar(29), idLimpio)
            .input("nombre", sql.VarChar(100), nombreLimpio)
            .input("telefono", sql.VarChar(20), telefonoLimpio)
            .input("correo", sql.VarChar(100), emailLimpio || null)
            .input("direccion", sql.VarChar(200), direccionLimpia || null)
            .input("esCliente", sql.Bit, esCliente)
            .input("esProveedor", sql.Bit, esProveedor)
            .input("esEmpleado", sql.Bit, esEmpleado)
            .query(`
                UPDATE Clientes
                SET IdCliente = @id,
                    Nombre = @nombre,
                    Telefono = @telefono,
                    Correo = @correo,
                    Direccion = @direccion,
                    EsCliente = @esCliente,
                    EsProveedor = @esProveedor,
                    EsEmpleado = @esEmpleado
                WHERE IdCliente = @idOriginal
            `);

        if (resultado.rowsAffected[0] === 0) {
            return res.status(404).json({
                mensaje: "Socio no encontrado"
            });
        }

        neurona.emitir("socio:actualizado", {
            idSocio: idLimpio,
            nombre: nombreLimpio,
            esCliente,
            esProveedor,
            esEmpleado
        }, { origen: "clientes.controller", idUsuario: req.usuario?.id });

        res.json({
            mensaje: "Socio actualizado correctamente"
        });
    } catch (error) {
        console.error("Error al editar socio:", error);

        if (error.number === 2627 || error.number === 2601) {
            return res.status(409).json({
                mensaje: "Ya existe un socio con ese ID"
            });
        }

        res.status(500).json({
            mensaje: "No se pudo actualizar el socio",
            error: error.message
        });
    }
}

async function eliminarCliente(req, res) {
    try {
        const id = req.params.id;
        const pool = await sql.connect(config);

        const resultado = await pool.request()
            .input("id", sql.VarChar(29), id)
            .query(`
                DELETE FROM Clientes
                WHERE IdCliente = @id
            `);

        if (resultado.rowsAffected[0] === 0) {
            return res.status(404).json({
                mensaje: "Socio no encontrado"
            });
        }

        res.json({
            mensaje: "Socio eliminado correctamente"
        });
    } catch (error) {
        console.error("Error al eliminar socio:", error);

        res.status(500).json({
            mensaje: "No se pudo eliminar el socio",
            error: error.message
        });
    }
}

module.exports = {
    listarClientes,
    crearCliente,
    actualizarCliente,
    eliminarCliente
};
