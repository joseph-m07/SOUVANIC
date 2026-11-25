"use strict";

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sql, config, isSqlite } = require("../config/database");
const { neurona } = require("../core/neurona");

async function login(req, res) {
    try {
        const { usuario, contraseña } = req.body;

        if (
            typeof usuario !== "string" ||
            typeof contraseña !== "string" ||
            !usuario.trim() ||
            !contraseña
        ) {
            return res.status(400).json({
                mensaje: "Debe completar todos los campos"
            });
        }

        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET no está configurado");
            return res.status(500).json({
                mensaje: "Error de configuración del servidor"
            });
        }

        const pool = await sql.connect(config);

        const resultado = await pool.request()
            .input("usuario", sql.NVarChar(50), usuario.trim())
            .query(`
                SELECT
                    IdUsuario,
                    Nombre,
                    Usuario,
                    PasswordHash,
                    Rol,
                    Activo
                FROM Usuarios
                WHERE Usuario = @usuario
            `);

        if (resultado.recordset.length === 0) {
            neurona.emitir("auth:login_fallido", { usuario: usuario.trim(), motivo: "no_existe" }, { origen: "auth.controller" });
            return res.status(401).json({
                mensaje: "Usuario o contraseña incorrectos"
            });
        }

        const usuarioBD = resultado.recordset[0];

        if (!usuarioBD.Activo) {
            neurona.emitir("auth:login_fallido", { usuario: usuario.trim(), motivo: "inactivo" }, { origen: "auth.controller" });
            return res.status(401).json({
                mensaje: "Usuario o contraseña incorrectos"
            });
        }

        const contraseñaCorrecta = await bcrypt.compare(
            contraseña,
            usuarioBD.PasswordHash
        );

        if (!contraseñaCorrecta) {
            neurona.emitir("auth:login_fallido", { usuario: usuario.trim(), motivo: "password_incorrecto" }, { origen: "auth.controller" });
            return res.status(401).json({
                mensaje: "Usuario o contraseña incorrectos"
            });
        }

        const token = jwt.sign(
            {
                id: usuarioBD.IdUsuario,
                rol: usuarioBD.Rol
            },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        );

        neurona.emitir("auth:login_exitoso", {
            idUsuario: usuarioBD.IdUsuario,
            rol: usuarioBD.Rol
        }, { origen: "auth.controller", idUsuario: usuarioBD.IdUsuario });

        return res.json({
            mensaje: "Inicio de sesión exitoso",
            token,
            usuario: {
                id: usuarioBD.IdUsuario,
                nombre: usuarioBD.Nombre,
                rol: usuarioBD.Rol
            }
        });
    } catch (error) {
        console.error("Error al iniciar sesión:", error);
        return res.status(500).json({
            mensaje: "Error interno del servidor"
        });
    }
}

async function testDb(req, res) {
    try {
        const pool = await sql.connect(config);
        if (isSqlite) {
            await pool.request().query("SELECT 1 AS Ok");
            return res.json({
                mensaje: "Conexión exitosa con SQLite",
                baseDeDatos: config.dbPath
            });
        }

        const result = await pool.request().query("SELECT DB_NAME() AS BaseDeDatos");

        res.json({
            mensaje: "Conexión exitosa con SQL Server",
            baseDeDatos: result.recordset[0].BaseDeDatos
        });
    } catch (error) {
        console.error("Error de conexión:", error);
        res.status(500).json({
            mensaje: "No se pudo conectar con la base de datos",
            error: error.message
        });
    }
}

module.exports = {
    login,
    testDb
};

