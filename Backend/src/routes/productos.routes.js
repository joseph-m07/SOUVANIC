"use strict";

const express = require("express");
const productosController = require("../controllers/productos.controller");
const { verificarToken, verificarRol } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/", verificarToken, productosController.listarProductos);
router.post("/", verificarToken, verificarRol("Administrador"), productosController.crearProducto);
router.put("/:codigo", verificarToken, verificarRol("Administrador"), productosController.actualizarProducto);
router.patch("/:codigo/estado", verificarToken, verificarRol("Administrador"), productosController.cambiarEstadoProducto);
router.patch("/:codigo/stock-minimo", verificarToken, verificarRol("Administrador"), productosController.actualizarStockMinimo);
router.delete("/:codigo", verificarToken, verificarRol("Administrador"), productosController.eliminarProducto);

module.exports = router;

