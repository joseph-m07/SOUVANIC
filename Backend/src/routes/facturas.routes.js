"use strict";

const express = require("express");
const facturasController = require("../controllers/facturas.controller");
const { verificarToken, verificarRol } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/", verificarToken, facturasController.crearFactura);
router.get("/", verificarToken, facturasController.listarFacturas);
router.get("/:id/detalle", verificarToken, facturasController.obtenerDetalleFactura);
router.get("/:id/completo", verificarToken, facturasController.obtenerFacturaCompleta);
router.post("/:id/anular", verificarToken, verificarRol("Administrador"), facturasController.anularFactura);

module.exports = router;

