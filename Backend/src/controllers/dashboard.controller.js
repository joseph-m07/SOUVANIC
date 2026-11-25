"use strict";

const { sql, config } = require("../config/database");

async function obtenerDashboard(req, res) {

    try {

        const pool = await sql.connect(config);

        const hoy = new Date();
        const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        const finHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);

        const resultado = await pool.request()
            .input("inicioHoy", sql.DateTime2, inicioHoy)
            .input("finHoy", sql.DateTime2, finHoy)
            .input("inicioMes", sql.DateTime2, inicioMes)
            .input("finMes", sql.DateTime2, finMes)
            .query(`
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
                    WHERE Fecha >= @inicioHoy
                      AND Fecha < @finHoy
                      AND ISNULL(Estado, 'Registrada') <> 'Anulada'
                ) AS VentasHoy,

                (
                    SELECT COUNT(*)
                    FROM Facturas
                    WHERE Fecha >= @inicioHoy
                      AND Fecha < @finHoy
                      AND ISNULL(Estado, 'Registrada') <> 'Anulada'
                ) AS FacturasHoy,

                (
                    SELECT ISNULL(SUM(Total), 0)
                    FROM Facturas
                    WHERE Fecha >= @inicioMes
                      AND Fecha < @finMes
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

}

module.exports = {
    obtenerDashboard
};
