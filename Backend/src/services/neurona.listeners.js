"use strict";

const { neurona } = require("../core/neurona");
const { sql, config } = require("../config/database");

let sinapsisRegistradas = false;

/**
 * Conecta las sinapsis de dominio en el núcleo Neurona:
 *  - Al emitir factura o registrar movimiento, evalúa productos con stock bajo/crítico
 *    y emite eventos `inventario:stock_bajo_detectado`.
 *  - Registra trazabilidad de eventos críticos de negocio.
 */
function registrarSinapsis() {
    if (sinapsisRegistradas) return;
    sinapsisRegistradas = true;

    async function evaluarStockBajo(productosAfectados = []) {
        if (!Array.isArray(productosAfectados) || productosAfectados.length === 0) {
            return;
        }

        const codigos = [
            ...new Set(
                productosAfectados
                    .map(item => (typeof item === "string" ? item : item?.codigo))
                    .filter(Boolean)
            )
        ];

        if (codigos.length === 0) return;

        const pool = await sql.connect(config);
        for (const codigo of codigos) {
            const res = await pool.request()
                .input("codigo", sql.VarChar(20), codigo)
                .query(`
                    SELECT CodigoProducto, Nombre, Stock, StockMinimo, Activo
                    FROM dbo.Productos
                    WHERE CodigoProducto = @codigo AND Activo = 1
                `);

            if (res.recordset.length === 0) continue;

            const prod = res.recordset[0];
            if (Number(prod.Stock) <= Number(prod.StockMinimo)) {
                neurona.emitir("inventario:stock_bajo_detectado", {
                    codigo: prod.CodigoProducto,
                    nombre: prod.Nombre,
                    stock: prod.Stock,
                    stockMinimo: prod.StockMinimo,
                    nivel: Number(prod.Stock) <= 0 ? "agotado" : "bajo"
                }, { origen: "neurona.listeners" });
            }
        }
    }

    neurona.conectar("factura:emitida", async registro => {
        await evaluarStockBajo(registro.payload?.productos || []);
    }, { nombre: "evaluar_stock_post_factura" });

    neurona.conectar("inventario:movimiento_registrado", async registro => {
        if (registro.payload?.codigo) {
            await evaluarStockBajo([registro.payload.codigo]);
        }
    }, { nombre: "evaluar_stock_post_movimiento" });

    neurona.conectar("producto:stock_minimo_actualizado", async registro => {
        if (registro.payload?.codigo) {
            await evaluarStockBajo([registro.payload.codigo]);
        }
    }, { nombre: "evaluar_stock_post_minimo" });

    neurona.conectar("inventario:stock_bajo_detectado", registro => {
        const p = registro.payload;
        console.warn(
            `[Neurona Alerta] Stock ${p.nivel}: ${p.nombre} (${p.codigo}) ` +
            `[Stock: ${p.stock} / Mínimo: ${p.stockMinimo}]`
        );
    }, { nombre: "log_alerta_stock_bajo" });

    neurona.conectar("factura:anulada", registro => {
        console.info(
            `[Neurona Auditoría] Factura #${registro.payload?.idFactura} anulada ` +
            `por usuario ${registro.idUsuario ?? "desconocido"}`
        );
    }, { nombre: "auditoria_anulacion_factura" });
}

module.exports = {
    registrarSinapsis
};
