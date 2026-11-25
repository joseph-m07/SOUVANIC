"use strict";

const express = require("express");
const { neurona } = require("../core/neurona");
const { verificarToken, verificarRol } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/estado", verificarToken, (req, res) => {
    res.json(neurona.obtenerEstado());
});

router.get("/eventos", verificarToken, verificarRol("Administrador"), (req, res) => {
    const limite = Number(req.query.limite || 50);
    res.json({
        eventos: neurona.obtenerHistorial(limite)
    });
});

module.exports = router;

