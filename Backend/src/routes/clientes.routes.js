"use strict";

const express = require("express");
const clientesController = require("../controllers/clientes.controller");
const { verificarToken, verificarRol } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/", verificarToken, clientesController.listarClientes);
router.post("/", verificarToken, clientesController.crearCliente);
router.put("/:id", verificarToken, clientesController.actualizarCliente);
router.delete("/:id", verificarToken, verificarRol("Administrador"), clientesController.eliminarCliente);

module.exports = router;

