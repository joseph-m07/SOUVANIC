"use strict";

const path = require("node:path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const express = require("express");
const cors = require("cors");

const { asegurarEsquemaIntegral } = require("./services/schema.service");
const { registrarSinapsis } = require("./services/neurona.listeners");

const authRoutes = require("./routes/auth.routes");
const productosRoutes = require("./routes/productos.routes");
const clientesRoutes = require("./routes/clientes.routes");
const facturasRoutes = require("./routes/facturas.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const inventarioRoutes = require("./routes/inventario.routes");
const neuronaRoutes = require("./routes/neurona.routes");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Servidor de Nicaragua Souvenir funcionando correctamente");
});

app.use("/", authRoutes);
app.use("/productos", productosRoutes);
app.use("/clientes", clientesRoutes);
app.use("/socios", clientesRoutes);
app.use("/facturas", facturasRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/inventario", inventarioRoutes);
app.use("/neurona", neuronaRoutes);

async function iniciarServidor() {
    registrarSinapsis();

    app.listen(PORT, () => {
        console.log(`Servidor funcionando en http://localhost:${PORT}`);
    });

    // Verificar esquema sin bloquear el arranque si la BD aún no está disponible
    asegurarEsquemaIntegral().catch(err => {
        console.error("Error inesperado al verificar esquema:", err.message);
    });
}

iniciarServidor();

