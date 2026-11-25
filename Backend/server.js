
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { sql, config } = require("./database");

const app = express();
const PORT = 3000;


// Configurar el servidor
app.use(cors());
app.use(express.json());


const jwt = require("jsonwebtoken");


// verificar tokens

async function verificarToken(req, res, next) {

    console.log("\n========== VERIFICACIÓN DE SESIÓN ==========");
    console.log("Ruta solicitada:", req.originalUrl);

    const autorizacion = req.headers.authorization;

    if (!autorizacion || !autorizacion.startsWith("Bearer ")) {
        console.log("ERROR: No se recibió un token Bearer.");

        return res.status(401).json({
            mensaje: "Acceso denegado. Debe iniciar sesión."
        });
    }

    const token = autorizacion.substring(7);

    try {

        // Verificar firma y vencimiento del JWT
        const datosToken = jwt.verify(
            token,
            process.env.JWT_SECRET,
            { algorithms: ["HS256"] }
        );

        console.log("JWT validado correctamente");
        console.log("ID del usuario:", datosToken.id);

        // Comprobar que el token tenga un ID válido
        
const idUsuario = Number(datosToken.id);

if (
    !Number.isSafeInteger(idUsuario) ||
    idUsuario <= 0
) {
    console.log("ERROR: ID del token inválido.");

    return res.status(401).json({
        mensaje: "Token de sesión inválido."
    });
}




        // Consultar el estado actual del usuario
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

        console.log(
            "Usuarios encontrados:",
            resultado.recordset.length
        );

        // Verificar que el usuario exista
        if (resultado.recordset.length === 0) {
            console.log("ERROR: Usuario no encontrado en SQL Server.");

            return res.status(401).json({
                mensaje: "La cuenta de usuario ya no existe."
            });
        }

        const usuarioBD = resultado.recordset[0];

        console.log("Usuario encontrado en SQL Server");
        console.log("Usuario activo:", usuarioBD.Activo);
        console.log("Rol del usuario:", usuarioBD.Rol);

        // Verificar que siga activo
        if (!usuarioBD.Activo) {
            console.log("ERROR: Cuenta desactivada.");

            return res.status(401).json({
                mensaje: "Esta cuenta ha sido desactivada."
            });
        }

        // Utilizar el rol actual de SQL Server
        req.usuario = {
            id: usuarioBD.IdUsuario,
            nombre: usuarioBD.Nombre,
            rol: usuarioBD.Rol
        };

        console.log("ACCESO AUTORIZADO:", req.originalUrl);
        console.log("===========================================\n");

        next();

    } catch (error) {

        console.error(
            "ERROR AL VERIFICAR SESIÓN:",
            error.name,
            error.message
        );

        // Token inválido o vencido
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





// INICIO DE SESIÓN


 // ==========================================
 // VERIFICAR PERMISOS POR ROL
 // ==========================================

function verificarRol(...rolesPermitidos) {
    return function(req, res, next) {

        // Comprobar que el usuario esté autenticado
        if (!req.usuario) {
            return res.status(401).json({
                mensaje: "Debe iniciar sesión."
            });
        }

        // Comprobar que tenga un rol autorizado
        if (!rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({
                mensaje: "No tiene permisos para realizar esta acción."
            });
        }

        next();
    };
}







app.post("/login", async function(req, res) {

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
            return res.status(401).json({
                mensaje: "Usuario o contraseña incorrectos"
            });
        }

        const usuarioBD = resultado.recordset[0];

        if (!usuarioBD.Activo) {
            return res.status(401).json({
                mensaje: "Usuario o contraseña incorrectos"
            });
        }

        const contraseñaCorrecta = await bcrypt.compare(
            contraseña,
            usuarioBD.PasswordHash
        );

        if (!contraseñaCorrecta) {
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

});


// Ruta de prueba
app.get("/", function(req, res) {
    res.send("Servidor de Nicaragua Souvenir funcionando correctamente");
});

// Prueba de conexion
app.get("/test-db", async function(req, res) {

    try {
        const pool = await sql.connect(config);

        const result = await pool.request().query(
            "SELECT DB_NAME() AS BaseDeDatos"
        );

        res.json({
            mensaje: "Conexión exitosa con SQL Server",
            baseDeDatos: result.recordset[0].BaseDeDatos
        });

    } catch (error) {

        console.error("Error de conexión:", error);

        res.status(500).json({
            mensaje: "No se pudo conectar con SQL Server",
            error: error.message
        });

    }

});


app.get("/productos", verificarToken, async (req, res) => {
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
});


app.post("/productos", verificarToken, verificarRol("Administrador"), async (req, res) => {
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
});


////


app.put("/productos/:codigo", verificarToken, verificarRol("Administrador"), async (req, res) => {
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
});


// ACTIVAR / DESACTIVAR PRODUCTO
app.patch("/productos/:codigo/estado", verificarToken, verificarRol("Administrador"), async (req, res) => {
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
});


// CONFIGURAR STOCK MÍNIMO
app.patch("/productos/:codigo/stock-minimo", verificarToken, verificarRol("Administrador"), async (req, res) => {
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
});




app.delete("/productos/:codigo", verificarToken, verificarRol("Administrador"), async (req, res) => {

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
});

// Pagina clientes//



app.get("/clientes", verificarToken, async function (req, res) {

    try {
        const pool = await sql.connect(config);

        const resultado = await pool.request().query(`
            SELECT IdCliente, Nombre, Telefono, Correo, Direccion
            FROM Clientes
        `);

        res.json(resultado.recordset);

    } catch (error) {
        console.error("Error al obtener clientes:", error);

        res.status(500).json({
            mensaje: "No se pudieron obtener los clientes",
            error: error.message
        });
    }
});




app.post("/clientes", verificarToken, async function (req, res) {

    try {
        const { id, name, phone, email, address } = req.body;

        const emailLimpio = typeof email === "string" ? email.trim() : "";
        const direccionLimpia = typeof address === "string" ? address.trim() : "";

        if (
            typeof id !== "string" || !id.trim() ||
            typeof name !== "string" || !name.trim() ||
            typeof phone !== "string" || !phone.trim() ||
            id.trim().length > 29 ||
            name.trim().length > 100 ||
            phone.trim().length > 20 ||
            emailLimpio.length > 100 ||
            direccionLimpia.length > 200
        ) {
            return res.status(400).json({
                mensaje: "Datos del cliente inválidos"
            });
        }

        const pool = await sql.connect(config);

        await pool.request()
            .input("id", sql.VarChar(29), id.trim())
            .input("nombre", sql.VarChar(100), name.trim())
            .input("telefono", sql.VarChar(20), phone.trim())
            .input("correo", sql.VarChar(100), emailLimpio || null)
            .input("direccion", sql.VarChar(200), direccionLimpia || null)
            .query(`
                INSERT INTO Clientes
                (IdCliente, Nombre, Telefono, Correo, Direccion)
                VALUES
                (@id, @nombre, @telefono, @correo, @direccion)
            `);

        res.status(201).json({
            mensaje: "Cliente registrado correctamente"
        });

    } catch (error) {
        console.error("Error al registrar cliente:", error);

        if (error.number === 2627 || error.number === 2601) {
            return res.status(409).json({
                mensaje: "Ya existe un cliente con ese ID"
            });
        }

        res.status(500).json({
            mensaje: "No se pudo registrar el cliente",
            error: error.message
        });
    }
});



app.put("/clientes/:id", verificarToken, async function (req, res) {

    try {
        const idOriginal = req.params.id;
        const { id, name, phone, email, address } = req.body;

        const emailLimpio = typeof email === "string" ? email.trim() : "";
        const direccionLimpia = typeof address === "string" ? address.trim() : "";

        if (
            typeof id !== "string" || !id.trim() ||
            typeof name !== "string" || !name.trim() ||
            typeof phone !== "string" || !phone.trim() ||
            id.trim().length > 29 ||
            name.trim().length > 100 ||
            phone.trim().length > 20 ||
            emailLimpio.length > 100 ||
            direccionLimpia.length > 200
        ) {
            return res.status(400).json({
                mensaje: "Datos del cliente inválidos"
            });
        }

        const pool = await sql.connect(config);

        const resultado = await pool.request()
            .input("idOriginal", sql.VarChar(29), idOriginal)
            .input("id", sql.VarChar(29), id.trim())
            .input("nombre", sql.VarChar(100), name.trim())
            .input("telefono", sql.VarChar(20), phone.trim())
            .input("correo", sql.VarChar(100), emailLimpio || null)
            .input("direccion", sql.VarChar(200), direccionLimpia || null)
            .query(`
                UPDATE Clientes
                SET IdCliente = @id,
                    Nombre = @nombre,
                    Telefono = @telefono,
                    Correo = @correo,
                    Direccion = @direccion
                WHERE IdCliente = @idOriginal
            `);

        if (resultado.rowsAffected[0] === 0) {
            return res.status(404).json({
                mensaje: "Cliente no encontrado"
            });
        }

        res.json({
            mensaje: "Cliente actualizado correctamente"
        });

    } catch (error) {
        console.error("Error al editar cliente:", error);

        if (error.number === 2627 || error.number === 2601) {
            return res.status(409).json({
                mensaje: "Ya existe un cliente con ese ID"
            });
        }

        res.status(500).json({
            mensaje: "No se pudo actualizar el cliente",
            error: error.message
        });
    }
});





app.delete("/clientes/:id", verificarToken, verificarRol("Administrador"), async function (req, res) {


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
                mensaje: "Cliente no encontrado"
            });
        }

        res.json({
            mensaje: "Cliente eliminado correctamente"
        });

    } catch (error) {
        console.error("Error al eliminar cliente:", error);

        res.status(500).json({
            mensaje: "No se pudo eliminar el cliente",
            error: error.message
        });
    }
});


// backend facturas


// ==========================================
// PAGOS: VALIDACIÓN MANUAL (SIN INTEGRACIÓN BANCARIA)
// ==========================================

const METODOS_PAGO = ["Efectivo", "Tarjeta", "Transferencia"];
const BANCOS_TARJETA = ["BAC", "LAFISE", "BANPRO"];

function redondearMoneda(valor) {
    return Math.round((Number(valor) + Number.EPSILON) * 100) / 100;
}

function errorHttp(mensaje, status = 400) {
    const error = new Error(mensaje);
    error.status = status;
    return error;
}

function validarPagoManual(pago, indice) {

    const etiqueta = `Pago ${indice + 1}`;

    if (!pago || typeof pago !== "object") {
        throw errorHttp(`${etiqueta}: los datos no son válidos.`);
    }

    if (!METODOS_PAGO.includes(pago.metodo)) {
        throw errorHttp(
            `${etiqueta}: el método debe ser Efectivo, Tarjeta o Transferencia. ` +
            "El pago combinado se registra como varios pagos."
        );
    }

    const monto = redondearMoneda(pago.monto);

    if (!Number.isFinite(monto) || monto <= 0) {
        throw errorHttp(`${etiqueta}: el monto debe ser mayor que cero.`);
    }

    const Banco = typeof pago.banco === "string"
        ? pago.banco.trim()
        : "";

    const Referencia = typeof pago.referencia === "string"
        ? pago.referencia.trim()
        : "";

    const Observaciones = typeof pago.observaciones === "string"
        ? pago.observaciones.trim()
        : "";

    if (Observaciones.length > 255 || Referencia.length > 60) {
        throw errorHttp(`${etiqueta}: uno de los textos supera la longitud permitida.`);
    }

    let MontoRecibido = null;
    let Vuelto = null;
    let BancoDestino = null;
    let CuentaDestino = null;

    if (pago.metodo === "Efectivo") {

        MontoRecibido = pago.montoRecibido === undefined ||
            pago.montoRecibido === null ||
            pago.montoRecibido === ""
            ? monto
            : redondearMoneda(pago.montoRecibido);

        if (!Number.isFinite(MontoRecibido) || MontoRecibido < monto) {
            throw errorHttp(
                `${etiqueta}: el efectivo recibido no puede ser menor que el monto aplicado.`
            );
        }

        Vuelto = redondearMoneda(MontoRecibido - monto);

    } else if (pago.metodo === "Tarjeta") {

        if (!BANCOS_TARJETA.includes(Banco)) {
            throw errorHttp(
                `${etiqueta}: seleccioná un banco emisor válido (BAC, LAFISE o BANPRO).`
            );
        }

        if (!Referencia) {
            throw errorHttp(
                `${etiqueta}: la referencia o autorización es obligatoria.`
            );
        }

    } else if (pago.metodo === "Transferencia") {

        if (!Banco) {
            throw errorHttp(`${etiqueta}: el banco de origen es obligatorio.`);
        }

        if (!Referencia) {
            throw errorHttp(`${etiqueta}: la referencia de transferencia es obligatoria.`);
        }

        BancoDestino = typeof pago.bancoDestino === "string"
            ? pago.bancoDestino.trim().slice(0, 60) || null
            : null;

        CuentaDestino = typeof pago.cuentaDestino === "string"
            ? pago.cuentaDestino.trim().slice(0, 60) || null
            : null;
    }

    return {
        metodo: pago.metodo,
        monto,
        montoRecibido: MontoRecibido,
        vuelto: Vuelto,
        banco: Banco || null,
        bancoDestino: BancoDestino,
        cuentaDestino: CuentaDestino,
        referencia: Referencia || null,
        observaciones: Observaciones || null
    };
}


app.post("/facturas", verificarToken, async function(req, res) {

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
            .query(`
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
                .query(`
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
});


// OBTENER HISTORIAL DE FACTURAS
app.get("/facturas", verificarToken, async function(req, res) {

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
                ISNULL(STUFF((
                    SELECT DISTINCT ', ' + p.Metodo
                    FROM Pagos p
                    WHERE p.IdFactura = f.IdFactura
                      AND p.Estado <> 'Anulado'
                    FOR XML PATH('')
                ), 1, 2, ''), '') AS MetodosPago
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
});


// CONSULTAR EL DETALLE DE UNA FACTURA
app.get("/facturas/:id/detalle", verificarToken, async function(req, res) {

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
                ORDER BY d.IdDeatlle ASC
            `);

        res.json(resultado.recordset);

    } catch (error) {

        console.error("Error al consultar detalle:", error);

        res.status(500).json({
            mensaje: "No se pudo consultar el detalle de la factura."
        });
    }
});


// CONSULTAR FACTURA COMPLETA (CABECERA, DETALLE Y PAGOS)
app.get("/facturas/:id/completo", verificarToken, async function(req, res) {

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
                ORDER BY d.IdDeatlle ASC
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
});


// ANULAR FACTURA (RESTAURA STOCK CON MOVIMIENTOS COMPENSATORIOS)
app.post("/facturas/:id/anular", verificarToken, verificarRol("Administrador"), async function(req, res) {

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
                .query(`
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
});


 // ESTADÍSTICAS DEL DASHBOARD

 
app.get("/dashboard", verificarToken, async function(req, res) {

    try {

        const pool = await sql.connect(config);

        const resultado = await pool.request().query(`
            SELECT
                (
                    SELECT COUNT(*)
                    FROM Facturas
                ) AS TotalFacturas,

                (
                    SELECT COUNT(*)
                    FROM Productos
                ) AS TotalProductos,

                (
                    SELECT COUNT(*)
                    FROM Clientes
                ) AS TotalClientes,

                (
                    SELECT ISNULL(SUM(Total), 0)
                    FROM Facturas
                    WHERE Fecha >= CONVERT(date, GETDATE())
                      AND Fecha < DATEADD(
                          day, 1, CONVERT(date, GETDATE())
                      )
                      AND ISNULL(Estado, 'Registrada') <> 'Anulada'
                ) AS VentasHoy,

                (
                    SELECT COUNT(*)
                    FROM Facturas
                    WHERE Fecha >= CONVERT(date, GETDATE())
                      AND Fecha < DATEADD(
                          day, 1, CONVERT(date, GETDATE())
                      )
                      AND ISNULL(Estado, 'Registrada') <> 'Anulada'
                ) AS FacturasHoy,

                (
                    SELECT ISNULL(SUM(Total), 0)
                    FROM Facturas
                    WHERE Fecha >= DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1)
                      AND Fecha < DATEADD(
                          month, 1, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1)
                      )
                      AND ISNULL(Estado, 'Registrada') <> 'Anulada'
                ) AS VentasMes,

                (
                    SELECT ISNULL(AVG(Total), 0)
                    FROM Facturas
                    WHERE ISNULL(Estado, 'Registrada') <> 'Anulada'
                ) AS TicketPromedio,

                (
                    SELECT COUNT(*)
                    FROM Productos
                    WHERE Stock > 0 AND Stock <= StockMinimo
                ) AS StockBajo,

                (
                    SELECT COUNT(*)
                    FROM Productos
                    WHERE Stock <= 0
                ) AS StockAgotado,

                (
                    SELECT ISNULL(SUM(Stock), 0)
                    FROM Productos
                ) AS TotalUnidades
        `);

        const estadisticas = resultado.recordset[0];

        // Consultar Top Productos más vendidos (histórico)
        let topProductos = [];
        try {
            const topQuery = await pool.request().query(`
                SELECT TOP 5
                    d.CodigoProducto,
                    ISNULL(p.Nombre, d.CodigoProducto) AS Nombre,
                    ISNULL(p.Categoria, 'Souvenirs') AS Categoria,
                    SUM(d.Cantidad) AS CantidadVendida,
                    SUM(ISNULL(d.Subtotal, d.Cantidad * d.PrecioUnitario)) AS TotalRecaudado
                FROM DetalleFactura d
                INNER JOIN Facturas f
                    ON d.IdFactura = f.IdFactura
                LEFT JOIN Productos p ON d.CodigoProducto = p.CodigoProducto
                WHERE ISNULL(f.Estado, 'Registrada') <> 'Anulada'
                GROUP BY d.CodigoProducto, p.Nombre, p.Categoria
                ORDER BY CantidadVendida DESC
            `);
            topProductos = topQuery.recordset;
        } catch (eTop) {
            console.log("Aviso: Top productos no disponible en consulta:", eTop.message);
        }

        // Tendencia de los últimos 7 días consecutivos con días sin ventas en cero
        const ventasTendencia = [];

        try {
            const ahora = new Date();
            const inicio = new Date(
                ahora.getFullYear(),
                ahora.getMonth(),
                ahora.getDate()
            );
            inicio.setDate(inicio.getDate() - 6);

            const fin = new Date(
                ahora.getFullYear(),
                ahora.getMonth(),
                ahora.getDate() + 1
            );

            const trendQuery = await pool.request()
                .input("inicio", sql.DateTime2, inicio)
                .input("fin", sql.DateTime2, fin)
                .query(`
                    SELECT
                        Fecha,
                        ISNULL(SUM(Total), 0) AS TotalVenta,
                        COUNT(*) AS CantidadFacturas
                    FROM Facturas
                    WHERE Fecha >= @inicio
                      AND Fecha < @fin
                      AND ISNULL(Estado, 'Registrada') <> 'Anulada'
                    GROUP BY Fecha
                `);

            const claveFecha = fecha => {
                const d = new Date(fecha);
                const mes = String(d.getMonth() + 1).padStart(2, "0");
                const dia = String(d.getDate()).padStart(2, "0");
                return `${d.getFullYear()}-${mes}-${dia}`;
            };

            const acumulado = new Map();

            trendQuery.recordset.forEach(fila => {
                const clave = claveFecha(fila.Fecha);
                const actual = acumulado.get(clave) || {
                    total: 0,
                    facturas: 0
                };

                actual.total += Number(fila.TotalVenta) || 0;
                actual.facturas += Number(fila.CantidadFacturas) || 0;

                acumulado.set(clave, actual);
            });

            const nombresDia = [
                "Domingo", "Lunes", "Martes", "Miércoles",
                "Jueves", "Viernes", "Sábado"
            ];

            for (let i = 6; i >= 0; i--) {

                const dia = new Date(
                    ahora.getFullYear(),
                    ahora.getMonth(),
                    ahora.getDate() - i
                );

                const clave = claveFecha(dia);
                const datos = acumulado.get(clave) || {
                    total: 0,
                    facturas: 0
                };

                ventasTendencia.push({
                    FechaDia: clave,
                    DiaSemana: nombresDia[dia.getDay()],
                    TotalVenta: redondearMoneda(datos.total),
                    CantidadFacturas: datos.facturas,
                    EsHoy: i === 0
                });
            }

        } catch (eTrend) {
            console.log(
                "Aviso: Tendencia de ventas no disponible en consulta:",
                eTrend.message
            );
        }

        // Información disponible para ambos roles
        const respuesta = {
            TotalFacturas: estadisticas.TotalFacturas ?? 0,
            TotalProductos: estadisticas.TotalProductos ?? 0,
            TotalClientes: estadisticas.TotalClientes ?? 0,
            StockBajo: estadisticas.StockBajo ?? 0,
            StockAgotado: estadisticas.StockAgotado ?? 0,
            TotalUnidades: estadisticas.TotalUnidades ?? 0,
            TopProductos: topProductos
        };

        // Solo el Administrador recibe las métricas financieras
        if (req.usuario.rol === "Administrador") {
            respuesta.VentasHoy = estadisticas.VentasHoy ?? 0;
            respuesta.FacturasHoy = estadisticas.FacturasHoy ?? 0;
            respuesta.VentasMes = estadisticas.VentasMes ?? 0;
            respuesta.TicketPromedio = estadisticas.TicketPromedio ?? 0;
            respuesta.VentasTendencia = ventasTendencia;
        }

        return res.json(respuesta);

    } catch (error) {

        console.error("Error al obtener estadísticas:", error);

        return res.status(500).json({
            mensaje: "No se pudieron obtener las estadísticas"
        });

    }

});







 // CONSULTAR PRODUCTOS CON STOCK BAJO

app.get("/inventario/alertas", verificarToken, async function(req, res) {

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

});


 // REGISTRAR MOVIMIENTOS DE INVENTARIO

app.post("/inventario/movimientos", verificarToken, verificarRol("Administrador"), async function(req, res) {


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
});


 // CONSULTAR HISTORIAL DE MOVIMIENTOS DE INVENTARIO
app.get("/inventario/movimientos", verificarToken, async function(req, res) {

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

});














// ==========================================
// ESQUEMA ADITIVO (NO DESTRUCTIVO)
// ==========================================

async function asegurarEsquemaIntegral() {

    try {
        const pool = await sql.connect(config);

        // Cada lote se compila por separado para que las columnas nuevas
        // estén disponibles antes de crear índices o rellenar datos.
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
            -- Los totales históricos no tenían descuentos ni impuestos:
            -- el subtotal se completa con el total ya registrado.
            UPDATE dbo.Facturas
            SET Subtotal = Total
            WHERE Subtotal IS NULL;
        `);

        console.log("Esquema integral verificado correctamente.");

    } catch (error) {
        console.error(
            "No se pudo verificar el esquema integral:",
            error.message
        );
    }
}


// Iniciar servidor
async function iniciarServidor() {

    await asegurarEsquemaIntegral();

    app.listen(PORT, function() {
        console.log(`Servidor funcionando en http://localhost:${PORT}`);
    });
}

iniciarServidor();