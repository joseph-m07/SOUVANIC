"use strict";

const express = require("express");
const dashboardController = require("../controllers/dashboard.controller");
const { verificarToken } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/", verificarToken, dashboardController.obtenerDashboard);

module.exports = router;

