"use strict";

const express = require("express");
const inventarioController = require("../controllers/inventario.controller");
const { verificarToken, verificarRol } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/alertas", verificarToken, inventarioController.obtenerAlertas);
router.post("/movimientos", verificarToken, verificarRol("Administrador"), inventarioController.registrarMovimiento);
router.get("/movimientos", verificarToken, inventarioController.listarMovimientos);

module.exports = router;

