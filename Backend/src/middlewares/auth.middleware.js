"use strict";

const jwt = require("jsonwebtoken");
const { sql, config } = require("../config/database");

/**
 * Middleware que valida el token JWT Bearer y verifica en SQL Server
 * que el usuario exista y siga activo.
 */
async function verificarToken(req, res, next) {
    const autorizacion = req.headers.authorization;

    if (!autorizacion || !autorizacion.startsWith("Bearer ")) {
        return res.status(401).json({
            mensaje: "Acceso denegado. Debe iniciar sesión."
        });
    }

    const token = autorizacion.substring(7);

    try {
        const datosToken = jwt.verify(
            token,
            process.env.JWT_SECRET,
            { algorithms: ["HS256"] }
        );

        const idUsuario = Number(datosToken.id);

        if (!Number.isSafeInteger(idUsuario) || idUsuario <= 0) {
            return res.status(401).json({
                mensaje: "Token de sesión inválido."
            });
        }

        const pool = await sql.connect(config);

        const resultado = await pool.request()
            .input("id", sql.Int, idUsuario)
            .query(`
                SELECT
                    IdUsuario,
                    Nombre,
                    Rol,
                    Activo
                FROM Usuarios
                WHERE IdUsuario = @id
            `);

        if (resultado.recordset.length === 0) {
            return res.status(401).json({
                mensaje: "La cuenta de usuario ya no existe."
            });
        }

        const usuarioBD = resultado.recordset[0];

        if (!usuarioBD.Activo) {
            return res.status(401).json({
                mensaje: "Esta cuenta ha sido desactivada."
            });
        }

        req.usuario = {
            id: usuarioBD.IdUsuario,
            nombre: usuarioBD.Nombre,
            rol: usuarioBD.Rol
        };

        next();
    } catch (error) {
        console.error("ERROR AL VERIFICAR SESIÓN:", error.name, error.message);

        if (
            error.name === "JsonWebTokenError" ||
            error.name === "TokenExpiredError" ||
            error.name === "NotBeforeError"
        ) {
            return res.status(401).json({
                mensaje: "Sesión inválida o expirada. Inicie sesión nuevamente."
            });
        }

        return res.status(500).json({
            mensaje: "Error interno al verificar la sesión."
        });
    }
}

/**
 * Middleware de autorización por rol.
 * @param {...string} rolesPermitidos
 */
function verificarRol(...rolesPermitidos) {
    return function (req, res, next) {
        if (!req.usuario) {
            return res.status(401).json({
                mensaje: "Debe iniciar sesión."
            });
        }

        if (!rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({
                mensaje: "No tiene permisos para realizar esta acción."
            });
        }

        next();
    };
}

module.exports = {
    verificarToken,
    verificarRol
};

