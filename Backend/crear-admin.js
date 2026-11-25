
const bcrypt = require("bcrypt");
const readline = require("node:readline/promises");
const { stdin, stdout } = require("node:process");
const { sql, config } = require("./database");

async function crearAdministrador() {
    const rl = readline.createInterface({
        input: stdin,
        output: stdout
    });

    try {
        const nombre = (await rl.question("Nombre del administrador: ")).trim();
        const usuario = (await rl.question("Usuario: ")).trim();

        if (!nombre || !usuario) {
            throw new Error("El nombre y el usuario son obligatorios.");
        }

        rl.close();

        // Pedimos la contraseña sin guardarla en el código.
        // La entrada será visible en esta versión inicial.
        const password = process.env.ADMIN_PASSWORD;

        if (!password || password.length < 12) {
            throw new Error(
                "Configurá ADMIN_PASSWORD con al menos 12 caracteres."
            );
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const pool = await sql.connect(config);

        await pool.request()
            .input("nombre", sql.NVarChar(100), nombre)
            .input("usuario", sql.NVarChar(50), usuario)
            .input("passwordHash", sql.NVarChar(255), passwordHash)
            .query(`
                INSERT INTO Usuarios
                    (Nombre, Usuario, PasswordHash, Rol)
                VALUES
                    (@nombre, @usuario, @passwordHash, 'Administrador')
            `);

        console.log("Administrador creado correctamente.");

    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        rl.close();
        await sql.close();
    }
}

crearAdministrador();
