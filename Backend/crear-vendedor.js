
require("dotenv").config();

const bcrypt = require("bcrypt");
const { sql, config } = require("./database");

async function crearVendedor() {
    try {
        const nombre = "Vendedor de prueba";
        const usuario = "vendedor";
        const contraseña = process.env.VENDEDOR_PASSWORD;

        if (!contraseña) {
            throw new Error("Falta configurar VENDEDOR_PASSWORD.");
        }

        const passwordHash = await bcrypt.hash(contraseña, 12);

        const pool = await sql.connect(config);

        await pool.request()
            .input("nombre", sql.NVarChar(100), nombre)
            .input("usuario", sql.NVarChar(50), usuario)
            .input("passwordHash", sql.NVarChar(255), passwordHash)
            .input("rol", sql.NVarChar(20), "Vendedor")
            .query(`
                INSERT INTO Usuarios
                    (Nombre, Usuario, PasswordHash, Rol)
                VALUES
                    (@nombre, @usuario, @passwordHash, @rol)
            `);

        console.log("Usuario Vendedor creado correctamente.");

    } catch (error) {
        console.error("Error al crear el vendedor:", error.message);
    } finally {
        await sql.close();
    }
}

crearVendedor();
