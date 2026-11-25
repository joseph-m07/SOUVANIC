"use strict";

// ==========================================
// UTILIDADES Y FORMATO
// ==========================================

function formatoCordobas(valor) {
    const num = Number(valor ?? 0);
    return "C$ " + (isNaN(num) ? "0.00" : num.toLocaleString("es-NI", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }));
}

function formatoNumero(valor) {
    const num = Number(valor ?? 0);
    return isNaN(num) ? "0" : num.toLocaleString("es-NI");
}

function obtenerSaludo() {
    const hora = new Date().getHours();
    if (hora >= 5 && hora < 12) return "Buenos días";
    if (hora >= 12 && hora < 19) return "Buenas tardes";
    return "Buenas noches";
}

function actualizarEncabezadoFecha() {
    const ahora = new Date();
    const saludoEl = document.getElementById("saludoDashboard");
    const fechaEl = document.getElementById("fechaHoyDashboard");

    let nombreUsuario = "Administrador";
    try {
        const u = JSON.parse(sessionStorage.getItem("usuario"));
        if (u?.nombre) nombreUsuario = u.nombre;
    } catch (_) {}

    if (saludoEl) {
        saludoEl.textContent = `${obtenerSaludo()}, ${nombreUsuario}`;
    }

    if (fechaEl) {
        const opciones = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
        const fechaTexto = ahora.toLocaleDateString("es-NI", opciones);
        fechaEl.textContent = fechaTexto.charAt(0).toUpperCase() + fechaTexto.slice(1);
    }
}

function registrarHoraSincronizacion() {
    const horaEl = document.getElementById("horaActualizacion");
    if (!horaEl) return;
    const ahora = new Date();
    const h = String(ahora.getHours()).padStart(2, "0");
    const m = String(ahora.getMinutes()).padStart(2, "0");
    const s = String(ahora.getSeconds()).padStart(2, "0");
    horaEl.textContent = `Actualizado ${h}:${m}:${s}`;
}

const NOMBRES_DIA_SEMANA = [
    "Domingo", "Lunes", "Martes", "Miércoles",
    "Jueves", "Viernes", "Sábado"
];

const ORDEN_DIAS_SEMANA = {
    lunes: 0,
    martes: 1,
    miercoles: 2,
    jueves: 3,
    viernes: 4,
    sabado: 5,
    domingo: 6
};

function esFacturaAnulada(factura) {
    return String(factura?.Estado || "").trim().toLowerCase() === "anulada";
}

function facturasVigentes(facturas) {
    return (Array.isArray(facturas) ? facturas : []).filter(factura => !esFacturaAnulada(factura));
}

function estadoFacturaHtml(factura) {
    const estado = String(factura?.Estado || "Registrada").trim() || "Registrada";
    const clave = estado.toLowerCase();

    if (clave === "pagada") {
        return `<span class="status status-pagada"><i class="bi bi-check2-circle"></i> ${escapeHtml(estado)}</span>`;
    }

    if (clave === "anulada") {
        return `<span class="status status-anulada"><i class="bi bi-x-octagon"></i> ${escapeHtml(estado)}</span>`;
    }

    if (clave === "pendiente") {
        return `<span class="status status-pendiente"><i class="bi bi-clock"></i> ${escapeHtml(estado)}</span>`;
    }

    return `<span class="status status-registrada"><i class="bi bi-journal-check"></i> ${escapeHtml(estado)}</span>`;
}

function ordenarDiasSemana(dias) {
    return [...dias].sort((a, b) => {
        const claveDia = item => {
            if (item.DiaSemana) return normalizarBusqueda(item.DiaSemana);

            const fecha = new Date(String(item.FechaDia || "") + "T00:00:00");
            if (!isNaN(fecha.getTime())) {
                return normalizarBusqueda(NOMBRES_DIA_SEMANA[fecha.getDay()]);
            }

            return "";
        };

        const ordenA = ORDEN_DIAS_SEMANA[claveDia(a)] ?? 7;
        const ordenB = ORDEN_DIAS_SEMANA[claveDia(b)] ?? 7;

        return ordenA - ordenB || String(a.FechaDia || "").localeCompare(String(b.FechaDia || ""));
    });
}


// ==========================================
// ESTADO LOCAL DEL DASHBOARD
// ==========================================

let estadoDashboard = {
    estadisticas: {},
    facturas: [],
    alertasInventario: [],
    topProductos: [],
    tendenciaVentas: [],
    productos: [],
    clientes: []
};


// ==========================================
// CARGAR ESTADÍSTICAS Y KPIS
// ==========================================

async function cargarEstadisticas() {
    try {
        const respuesta = await fetchAutenticado("/dashboard");
        if (!respuesta.ok) {
            throw new Error("No se pudieron obtener las estadísticas.");
        }

        const datos = await respuesta.json();
        estadoDashboard.estadisticas = datos;

        // KPIs Básicos
        const totalFacturasEl = document.getElementById("totalFacturas");
        const totalProductosEl = document.getElementById("totalProductos");
        const totalClientesEl = document.getElementById("totalClientes");

        if (totalFacturasEl) totalFacturasEl.textContent = formatoNumero(datos.TotalFacturas);
        if (totalProductosEl) totalProductosEl.textContent = formatoNumero(datos.TotalProductos);
        if (totalClientesEl) totalClientesEl.textContent = formatoNumero(datos.TotalClientes);

        // KPIs Financieros (solo Administrador)
        if (esAdministrador()) {
            const ventasHoyEl = document.getElementById("ventasHoy");
            const ventasMesEl = document.getElementById("ventasMes");
            const ticketPromedioEl = document.getElementById("ticketPromedio");
            const facturasHoyCountEl = document.getElementById("facturasHoyCount");

            if (ventasHoyEl) ventasHoyEl.textContent = formatoCordobas(datos.VentasHoy);
            if (ventasMesEl) ventasMesEl.textContent = formatoCordobas(datos.VentasMes);
            if (ticketPromedioEl) ticketPromedioEl.textContent = formatoCordobas(datos.TicketPromedio);
            if (facturasHoyCountEl) facturasHoyCountEl.textContent = formatoNumero(datos.FacturasHoy ?? 0);
        }

        // KPIs de Stock
        const stockBajoEl = document.getElementById("totalStockBajo");
        const stockAgotadoEl = document.getElementById("totalStockAgotado");
        if (stockBajoEl) stockBajoEl.textContent = formatoNumero(datos.StockBajo ?? 0);
        if (stockAgotadoEl) stockAgotadoEl.textContent = formatoNumero(datos.StockAgotado ?? 0);

        // Top Productos
        if (Array.isArray(datos.TopProductos) && datos.TopProductos.length > 0) {
            estadoDashboard.topProductos = datos.TopProductos;
            renderizarTopProductos(datos.TopProductos);
        }

        // Tendencia de Ventas (7 días)
        if (Array.isArray(datos.VentasTendencia) && datos.VentasTendencia.length > 0) {
            estadoDashboard.tendenciaVentas = datos.VentasTendencia;
            renderizarGraficoVentas(datos.VentasTendencia);
        }

    } catch (error) {
        console.error("Error al cargar estadísticas principales:", error);
    }
}


// ==========================================
// CARGAR FACTURAS (VENTAS RECIENTES Y FALLBACK)
// ==========================================

async function cargarVentasRecientes() {
    const tabla = document.getElementById("ventasRecientesBody");

    try {
        const respuesta = await fetchAutenticado("/facturas");
        if (!respuesta.ok) {
            throw new Error("No se pudieron obtener las facturas.");
        }

        const facturas = await respuesta.json();
        estadoDashboard.facturas = facturas;

        // Renderizar tabla de ventas recientes (últimas 5)
        if (tabla) {
            tabla.innerHTML = "";
            const recientes = facturas.slice(0, 5);

            if (recientes.length === 0) {
                const fila = document.createElement("tr");
                fila.innerHTML = `
                    <td colspan="5" class="celda-vacia">
                        <i class="bi bi-inbox"></i> No hay ventas registradas aún.
                    </td>
                `;
                tabla.appendChild(fila);
            } else {
                recientes.forEach(factura => {
                    const fila = document.createElement("tr");

                    const numeroFactura = "#" + String(factura.IdFactura).padStart(5, "0");
                    const cliente = factura.Cliente || "Cliente General";
                    const fecha = factura.Fecha
                        ? new Date(factura.Fecha).toLocaleDateString("es-NI", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric"
                        })
                        : "Sin fecha";
                    const total = formatoCordobas(factura.Total);

                    fila.innerHTML = `
                        <td><span class="badge-factura-num">${numeroFactura}</span></td>
                        <td><strong>${escapeHtml(cliente)}</strong></td>
                        <td><span class="texto-secundario">${fecha}</span></td>
                        <td><span class="valor-total-factura">${total}</span></td>
                        <td>${estadoFacturaHtml(factura)}</td>
                    `;
                    tabla.appendChild(fila);
                });
            }
        }

        // Fallback de análisis financiero a partir de las facturas si el backend no devolvió tendencia
        if (esAdministrador() && (!estadoDashboard.tendenciaVentas || estadoDashboard.tendenciaVentas.length === 0)) {
            calcularTendenciaDesdeFacturas(facturas);
        }

    } catch (error) {
        console.error("Error al cargar facturas:", error);
        if (tabla) {
            tabla.innerHTML = `
                <tr>
                    <td colspan="5" class="celda-error">
                        <i class="bi bi-exclamation-triangle"></i> No se pudieron cargar las ventas recientes.
                    </td>
                </tr>
            `;
        }
    }
}


// ==========================================
// CARGAR ALERTAS DE INVENTARIO
// ==========================================

async function cargarAlertasInventario() {
    const tabla = document.getElementById("alertasInventarioBody");

    try {
        const respuesta = await fetchAutenticado("/inventario/alertas");
        if (!respuesta.ok) {
            throw new Error("No se pudieron cargar las alertas.");
        }

        const productos = await respuesta.json();
        estadoDashboard.alertasInventario = productos;

        // Actualizar contadores de stock bajo y agotado en caso de que no hayan llegado
        let agotados = 0;
        let bajo = 0;
        productos.forEach(p => {
            const stock = Number(p.Stock);
            if (stock <= 0) agotados++;
            else if (stock <= stockMinimoProducto(p)) bajo++;
        });

        const stockBajoEl = document.getElementById("totalStockBajo");
        const stockAgotadoEl = document.getElementById("totalStockAgotado");
        if (stockBajoEl && (stockBajoEl.textContent === "0" || !stockBajoEl.textContent)) {
            stockBajoEl.textContent = formatoNumero(bajo);
        }
        if (stockAgotadoEl && (stockAgotadoEl.textContent === "0" || !stockAgotadoEl.textContent)) {
            stockAgotadoEl.textContent = formatoNumero(agotados);
        }

        if (!tabla) return;
        tabla.innerHTML = "";

        if (productos.length === 0) {
            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td colspan="6" class="celda-vacia-exito">
                    <i class="bi bi-check-circle-fill"></i> Todos los productos cuentan con existencias suficientes.
                </td>
            `;
            tabla.appendChild(fila);
            return;
        }

        // Mostrar primeros 6 artículos más críticos
        const criticos = productos.slice(0, 6);

        criticos.forEach(producto => {
            const fila = document.createElement("tr");
            const esAgotado = Number(producto.Stock) <= 0;
            const stock = Number(producto.Stock);
            const minimo = stockMinimoProducto(producto);

            const badgeEstado = esAgotado
                ? `<span class="stock-agotado"><i class="bi bi-x-circle-fill"></i> Agotado</span>`
                : `<span class="stock-bajo"><i class="bi bi-exclamation-triangle-fill"></i> Stock bajo</span>`;

            fila.innerHTML = `
                <td><code>${escapeHtml(producto.CodigoProducto || "")}</code></td>
                <td><strong>${escapeHtml(producto.Nombre || "Sin nombre")}</strong></td>
                <td><span class="badge-categoria">${escapeHtml(producto.Categoria || "General")}</span></td>
                <td><strong class="${esAgotado ? 'texto-peligro' : 'texto-advertencia'}">${stock}</strong> unid.</td>
                <td>${formatoNumero(minimo)} unid.</td>
                <td>${badgeEstado}</td>
            `;
            tabla.appendChild(fila);
        });

    } catch (error) {
        console.error("Error al cargar alertas de inventario:", error);
        if (tabla) {
            tabla.innerHTML = `
                <tr>
                    <td colspan="6" class="celda-error">
                        <i class="bi bi-exclamation-triangle"></i> No se pudieron cargar las alertas de inventario.
                    </td>
                </tr>
            `;
        }
    }
}


// ==========================================
// CARGAR PRODUCTOS Y CLIENTES PARA DETALLES
// ==========================================

async function cargarProductosDashboard() {
    try {
        const respuesta = await fetchAutenticado("/productos");
        if (!respuesta.ok) {
            throw new Error("No se pudieron obtener los productos.");
        }

        estadoDashboard.productos = await respuesta.json();
        renderizarDistribucionInventario();

    } catch (error) {
        console.error("Error al cargar productos del dashboard:", error);

        const lista = document.getElementById("distribucionLista");
        if (lista) {
            lista.innerHTML = `
                <div class="modal-estado">
                    <i class="bi bi-exclamation-triangle"></i> No se pudo cargar la distribución de inventario.
                </div>
            `;
        }
    }
}

async function cargarClientesDashboard() {
    try {
        const respuesta = await fetchAutenticado("/clientes");
        if (!respuesta.ok) {
            throw new Error("No se pudieron obtener los clientes.");
        }

        estadoDashboard.clientes = await respuesta.json();

    } catch (error) {
        console.error("Error al cargar clientes del dashboard:", error);
    }
}


// ==========================================
// DISTRIBUCIÓN DE INVENTARIO POR CATEGORÍA
// ==========================================

let distribucionCategoriaActiva = null;

function agruparProductosPorCategoria(productos) {
    const categorias = new Map();

    productos.forEach(producto => {
        const nombreCategoria = String(producto.Categoria || "Sin categoría").trim() || "Sin categoría";
        const clave = nombreCategoria.toLowerCase();

        if (!categorias.has(clave)) {
            categorias.set(clave, {
                clave,
                nombre: nombreCategoria,
                productos: 0,
                unidades: 0
            });
        }

        const item = categorias.get(clave);
        item.productos += 1;
        item.unidades += Number(producto.Stock) || 0;
    });

    return Array.from(categorias.values())
        .sort((a, b) => b.unidades - a.unidades || a.nombre.localeCompare(b.nombre, "es"));
}

function renderizarDistribucionInventario() {
    const resumenEl = document.getElementById("distribucionResumen");
    const listaEl = document.getElementById("distribucionLista");
    if (!resumenEl || !listaEl) return;

    const productos = estadoDashboard.productos;

    if (!Array.isArray(productos) || productos.length === 0) {
        distribucionCategoriaActiva = null;
        resumenEl.innerHTML = "";
        listaEl.innerHTML = `
            <div class="modal-estado">
                <i class="bi bi-box-seam"></i> No hay productos registrados para distribuir.
            </div>
        `;
        return;
    }

    const lista = agruparProductosPorCategoria(productos);
    const totalProductos = productos.length;
    const totalUnidades = lista.reduce((suma, item) => suma + item.unidades, 0);
    const maxUnidades = Math.max(...lista.map(item => item.unidades), 1);

    if (distribucionCategoriaActiva) {
        const activa = lista.find(item => item.clave === distribucionCategoriaActiva);

        if (activa) {
            renderizarDetalleDistribucion(activa, productos, totalProductos, totalUnidades);
            return;
        }

        distribucionCategoriaActiva = null;
    }

    resumenEl.innerHTML = `
        <span class="distribucion-resumen-item">
            <i class="bi bi-collection"></i> <strong>${formatoNumero(lista.length)}</strong> categorías
        </span>
        <span class="distribucion-resumen-item">
            <i class="bi bi-box-seam"></i> <strong>${formatoNumero(totalProductos)}</strong> productos registrados
        </span>
        <span class="distribucion-resumen-item">
            <i class="bi bi-boxes"></i> <strong>${formatoNumero(totalUnidades)}</strong> unidades físicas en stock
        </span>
    `;

    listaEl.innerHTML = lista.map(item => {
        const porcentaje = Math.round((item.unidades / maxUnidades) * 100);
        const proporcionTotal = totalUnidades
            ? Math.round((item.unidades / totalUnidades) * 100)
            : 0;

        return `
            <button type="button" class="distribucion-categoria" data-categoria-distribucion="${escapeHtml(item.clave)}" title="Ver productos de ${escapeHtml(item.nombre)}">
                <span class="distribucion-categoria-nombre" title="${escapeHtml(item.nombre)}">${escapeHtml(item.nombre)}</span>
                <div class="distribucion-barra" role="img" aria-label="${escapeHtml(item.nombre)}: ${item.unidades} unidades">
                    <span style="width: ${porcentaje}%;"></span>
                </div>
                <span class="distribucion-categoria-proporcion"><strong>${proporcionTotal}%</strong> del stock</span>
                <span class="distribucion-categoria-cifras">
                    <span><strong>${formatoNumero(item.productos)}</strong> productos</span>
                    <span><strong>${formatoNumero(item.unidades)}</strong> unidades</span>
                </span>
            </button>
        `;
    }).join("");
}

function renderizarDetalleDistribucion(activa, productos, totalProductos, totalUnidades) {
    const resumenEl = document.getElementById("distribucionResumen");
    const listaEl = document.getElementById("distribucionLista");
    if (!resumenEl || !listaEl) return;

    const productosCategoria = productos.filter(producto => {
        const nombreCategoria = String(producto.Categoria || "Sin categoría").trim() || "Sin categoría";
        return nombreCategoria.toLowerCase() === activa.clave;
    }).sort((a, b) => Number(b.Stock || 0) - Number(a.Stock || 0) || String(a.Nombre).localeCompare(String(b.Nombre), "es"));

    const proporcionUnidades = totalUnidades
        ? Math.round((activa.unidades / totalUnidades) * 100)
        : 0;
    const proporcionProductos = totalProductos
        ? Math.round((activa.productos / totalProductos) * 100)
        : 0;

    resumenEl.innerHTML = `
        <span class="distribucion-resumen-item">
            <i class="bi bi-tag"></i> Categoría <strong>${escapeHtml(activa.nombre)}</strong>
        </span>
        <span class="distribucion-resumen-item">
            <i class="bi bi-box-seam"></i> <strong>${formatoNumero(activa.productos)}</strong> productos (${proporcionProductos}% del catálogo)
        </span>
        <span class="distribucion-resumen-item">
            <i class="bi bi-boxes"></i> <strong>${formatoNumero(activa.unidades)}</strong> unidades (${proporcionUnidades}% del stock)
        </span>
    `;

    const filas = productosCategoria.map(producto => {
        const stock = Number(producto.Stock) || 0;

        return `
            <tr>
                <td><code>${escapeHtml(producto.CodigoProducto || "")}</code></td>
                <td><strong>${escapeHtml(producto.Nombre || "Sin nombre")}</strong></td>
                <td class="celda-numero">${formatoCordobas(producto.Precio)}</td>
                <td class="celda-numero"><strong>${formatoNumero(stock)}</strong> unid.</td>
                <td>${estadoStockHtml(producto)}</td>
            </tr>
        `;
    }).join("");

    listaEl.innerHTML = `
        <div class="distribucion-detalle">
            <div class="distribucion-detalle-encabezado">
                <div>
                    <h3>${escapeHtml(activa.nombre)}</h3>
                    <p>Productos y cantidades reales disponibles en esta categoría.</p>
                </div>
                <button type="button" class="distribucion-volver">
                    <i class="bi bi-arrow-left"></i> Volver a la vista general
                </button>
            </div>

            <div class="distribucion-tabla-scroll">
                <table class="distribucion-tabla">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Producto</th>
                            <th class="celda-numero">Precio</th>
                            <th class="celda-numero">Stock</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>${filas}</tbody>
                </table>
            </div>

            <p class="modal-nota">
                Las cifras corresponden al stock registrado en el inventario; no representan ventas.
            </p>
        </div>
    `;
}


// ==========================================
// RENDERIZAR VISUALIZACIÓN DE VENTAS (7 DÍAS)
// ==========================================

function renderizarGraficoVentas(diasData) {
    const contenedor = document.getElementById("contenedorGraficoVentas");
    const totalSemanaEl = document.getElementById("totalVentasSemana");
    if (!contenedor) return;

    if (!Array.isArray(diasData) || diasData.length === 0) {
        contenedor.innerHTML = `
            <div class="grafico-vacio">
                <i class="bi bi-bar-chart"></i>
                <p>No hay registro de ventas en los últimos 7 días.</p>
            </div>
        `;
        if (totalSemanaEl) totalSemanaEl.textContent = "C$ 0.00";
        return;
    }

    const diasOrdenados = ordenarDiasSemana(diasData);

    let sumaTotalSemana = 0;
    let maxVenta = 0;

    diasOrdenados.forEach(d => {
        const total = Number(d.TotalVenta ?? d.Total ?? 0);
        sumaTotalSemana += total;
        if (total > maxVenta) maxVenta = total;
    });

    if (totalSemanaEl) {
        totalSemanaEl.textContent = formatoCordobas(sumaTotalSemana);
    }

    if (maxVenta === 0) maxVenta = 1;

    let htmlBarras = `<div class="bento-bar-chart">`;

    diasOrdenados.forEach(item => {
        const venta = Number(item.TotalVenta ?? item.Total ?? 0);
        const facturas = item.CantidadFacturas ?? item.Facturas ?? 0;
        const porcentaje = Math.min(Math.max(Math.round((venta / maxVenta) * 100), 8), 100);

        let etiquetaDia = item.DiaSemana || item.FechaDia || "";
        if (item.FechaDia && !item.DiaSemana) {
            const fechaObj = new Date(item.FechaDia + "T00:00:00");
            etiquetaDia = fechaObj.toLocaleDateString("es-NI", { weekday: "short" });
        }
        etiquetaDia = etiquetaDia.replace(".", "").toUpperCase();

        const fechaDetalle = item.FechaDia
            ? formatearFechaCorta(item.FechaDia + "T00:00:00")
            : "";

        const esHoy = item.EsHoy ? "barra-hoy" : "";

        htmlBarras += `
            <div class="bento-chart-col ${esHoy}">
                <div class="bento-bar-wrapper">
                    <div class="bento-bar-fill" style="height: ${porcentaje}%;">
                        <div class="bento-bar-tooltip">
                            <strong>${formatoCordobas(venta)}</strong>
                            <span>${fechaDetalle ? escapeHtml(fechaDetalle) + " · " : ""}${facturas} ${facturas === 1 ? 'venta' : 'ventas'}</span>
                        </div>
                    </div>
                </div>
                <span class="bento-bar-label">${etiquetaDia}</span>
                <span class="bento-bar-amount">${formatoMontoCompacto(venta)}</span>
            </div>
        `;
    });

    htmlBarras += `</div>`;
    contenedor.innerHTML = htmlBarras;
}

function formatoMontoCompacto(valor) {
    const v = Number(valor || 0);
    if (v >= 1000000) return (v / 1000000).toFixed(1) + "M";
    if (v >= 1000) return (v / 1000).toFixed(1) + "k";
    return String(Math.round(v));
}

function calcularTendenciaDesdeFacturas(facturas) {
    const dias = [];
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
        const d = new Date(hoy);
        d.setDate(d.getDate() - i);
        const diaLocal = claveDiaLocal(d);
        const nombreDia = NOMBRES_DIA_SEMANA[d.getDay()];

        dias.push({
            FechaDia: diaLocal,
            DiaSemana: nombreDia,
            TotalVenta: 0,
            CantidadFacturas: 0,
            EsHoy: i === 0
        });
    }

    facturas.forEach(f => {
        if (!f.Fecha) return;
        if (esFacturaAnulada(f)) return;

        const fechaStr = claveDiaLocal(f.Fecha);
        const diaEncontrado = dias.find(d => d.FechaDia === fechaStr);
        if (diaEncontrado) {
            diaEncontrado.TotalVenta += Number(f.Total || 0);
            diaEncontrado.CantidadFacturas += 1;
        }
    });

    renderizarGraficoVentas(dias);
}


// ==========================================
// MODALES DE DETALLE DEL DASHBOARD
// ==========================================

const cacheDetallesFactura = new Map();
const MODALES_SOLO_ADMIN = [
    "ventas-dia",
    "ventas-mes",
    "productos",
    "ventas-recientes",
    "ticket-promedio",
    "facturas-emitidas"
];

let modalTipoActual = null;
let modalDashboardRetorno = null;
let modalContenedorEl = null;
let modalTituloEl = null;
let modalSubtituloEl = null;
let modalFiltrosEl = null;
let modalCuerpoEl = null;
let modalVolverEl = null;
let modalSolicitud = 0;

function claveDiaLocal(fecha) {
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function claveMesLocal(fecha) {
    return claveDiaLocal(fecha).slice(0, 7);
}

function hoyClave() {
    return claveDiaLocal(new Date());
}

function mesActualClave() {
    return claveMesLocal(new Date());
}

function formatearFechaCorta(fecha) {
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return "Sin fecha";
    return d.toLocaleDateString("es-NI", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatearFechaHora(fecha) {
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return "Sin fecha";
    return d.toLocaleDateString("es-NI", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function prepararModal(titulo, subtitulo, filtrosHtml) {
    modalTituloEl.textContent = titulo;
    modalSubtituloEl.textContent = subtitulo;
    modalFiltrosEl.innerHTML = filtrosHtml || "";
    modalFiltrosEl.hidden = !filtrosHtml;
    modalCuerpoEl.innerHTML = `<div class="modal-estado"><i class="bi bi-arrow-repeat spin"></i> Cargando información...</div>`;
}

function estadoVacioModal(icono, titulo, mensaje) {
    return `
        <div class="estado-vacio">
            <div class="estado-vacio-icono"><i class="bi ${icono}"></i></div>
            <h3>${escapeHtml(titulo)}</h3>
            <p>${escapeHtml(mensaje)}</p>
        </div>
    `;
}

function htmlGraficoBarrasDashboard(items, opciones = {}) {
    const maximo = Math.max(...items.map(item => item.valor), 1);
    const formatoValor = opciones.formato || formatoCordobas;
    const formatoCompacto = opciones.compacto || formatoMontoCompacto;

    return `<div class="bento-bar-chart modal-barra-chart">` + items.map(item => {
        const porcentaje = Math.min(Math.max(Math.round((item.valor / maximo) * 100), 6), 100);

        return `
            <div class="bento-chart-col ${item.esHoy ? "barra-hoy" : ""}">
                <div class="bento-bar-wrapper">
                    <div class="bento-bar-fill" style="height: ${porcentaje}%;">
                        <div class="bento-bar-tooltip">
                            <strong>${formatoValor(item.valor)}</strong>
                            <span>${escapeHtml(item.detalle)}</span>
                        </div>
                    </div>
                </div>
                <span class="bento-bar-label">${escapeHtml(item.etiqueta)}</span>
                <span class="bento-bar-amount">${formatoCompacto(item.valor)}</span>
            </div>
        `;
    }).join("") + `</div>`;
}

function htmlTablaFacturas(facturas) {
    if (!Array.isArray(facturas) || facturas.length === 0) {
        return estadoVacioModal("bi-receipt", "Sin facturas", "No hay comprobantes registrados para este filtro.");
    }

    const filas = facturas.map(factura => `
        <tr class="modal-fila-click" data-id-factura="${Number(factura.IdFactura)}" tabindex="0" title="Ver detalle de la factura">
            <td><span class="badge-factura-num">#${String(factura.IdFactura).padStart(5, "0")}</span></td>
            <td><strong>${escapeHtml(factura.Cliente || "Cliente General")}</strong></td>
            <td>${formatearFechaHora(factura.Fecha)}</td>
            <td class="celda-numero"><span class="valor-total-factura">${formatoCordobas(factura.Total)}</span></td>
            <td>${estadoFacturaHtml(factura)}</td>
            <td class="celda-numero"><i class="bi bi-chevron-right"></i></td>
        </tr>
    `).join("");

    return `
        <div class="modal-tabla-scroll">
            <table>
                <thead>
                    <tr>
                        <th>Factura</th>
                        <th>Cliente</th>
                        <th>Fecha y hora</th>
                        <th class="celda-numero">Total</th>
                        <th>Estado</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>${filas}</tbody>
            </table>
        </div>
    `;
}

function capturarContextoModal() {
    const valores = {};

    if (modalFiltrosEl) {
        modalFiltrosEl.querySelectorAll("input, select").forEach(campo => {
            if (campo.id) valores[campo.id] = campo.value;
        });
    }

    return { tipo: modalTipoActual, valores };
}

function cerrarModalDashboard() {
    if (!modalContenedorEl) return;

    modalContenedorEl.hidden = true;
    document.body.classList.remove("modal-dashboard-abierto");
    modalFiltrosEl.hidden = true;
    modalFiltrosEl.innerHTML = "";
    modalCuerpoEl.innerHTML = "";
    modalVolverEl.hidden = true;
    modalTipoActual = null;
    modalDashboardRetorno = null;
    modalSolicitud += 1;
}

function abrirModalDashboard(tipo, valores = {}) {
    if (!esAdministrador() && MODALES_SOLO_ADMIN.includes(tipo)) return;

    modalContenedorEl = document.getElementById("modalDashboard");
    modalTituloEl = document.getElementById("modalDashboardTitulo");
    modalSubtituloEl = document.getElementById("modalDashboardSubtitulo");
    modalFiltrosEl = document.getElementById("modalDashboardFiltros");
    modalCuerpoEl = document.getElementById("modalDashboardCuerpo");
    modalVolverEl = document.getElementById("modalDashboardVolver");

    if (!modalContenedorEl || !modalCuerpoEl) return;

    modalContenedorEl.hidden = false;
    document.body.classList.add("modal-dashboard-abierto");
    modalTipoActual = tipo;
    modalDashboardRetorno = null;
    modalVolverEl.hidden = true;
    modalSolicitud += 1;

    if (tipo === "ventas-dia") {
        abrirModalVentasDia(valores);
    } else if (tipo === "ventas-mes") {
        abrirModalVentasMes(valores);
    } else if (tipo === "productos") {
        abrirModalTopProductos(valores);
    } else if (tipo === "ventas-recientes") {
        abrirModalVentasRecientes(valores);
    } else if (tipo === "clientes") {
        abrirModalClientes(valores);
    } else if (tipo === "ticket-promedio") {
        abrirModalTicketPromedio(valores);
    } else if (tipo === "facturas-emitidas") {
        abrirModalFacturasEmitidas(valores);
    } else if (tipo === "catalogo-productos") {
        abrirModalCatalogoProductos(valores);
    } else if (tipo === "stock-bajo") {
        abrirModalStockBajo(valores);
    } else if (tipo === "agotados") {
        abrirModalAgotados(valores);
    }
}

async function obtenerDetalleFactura(idFactura) {
    if (cacheDetallesFactura.has(idFactura)) {
        return cacheDetallesFactura.get(idFactura);
    }

    try {
        const respuesta = await fetchAutenticado(`/facturas/${idFactura}/detalle`);
        if (!respuesta.ok) throw new Error("No se pudo consultar el detalle.");

        const detalle = await respuesta.json();
        cacheDetallesFactura.set(idFactura, detalle);
        return detalle;

    } catch (error) {
        console.error(`Error al cargar el detalle de la factura #${idFactura}:`, error);
        return null;
    }
}

async function cargarDetallesFacturas(facturas) {
    const detalles = new Map();
    if (!Array.isArray(facturas) || facturas.length === 0) return detalles;

    let siguiente = 0;

    async function trabajador() {
        while (siguiente < facturas.length) {
            const factura = facturas[siguiente++];
            const detalle = await obtenerDetalleFactura(factura.IdFactura);
            if (detalle) detalles.set(factura.IdFactura, detalle);
        }
    }

    const cantidadTrabajadores = Math.min(6, facturas.length);
    await Promise.all(Array.from({ length: cantidadTrabajadores }, trabajador));

    return detalles;
}

async function abrirDetalleFactura(idFactura) {
    if (!modalTipoActual || !modalCuerpoEl) return;

    modalSolicitud += 1;
    const solicitud = modalSolicitud;
    const contexto = capturarContextoModal();
    const factura = estadoDashboard.facturas.find(f => Number(f.IdFactura) === Number(idFactura));

    modalVolverEl.hidden = false;
    modalTituloEl.textContent = `Factura #${String(idFactura).padStart(5, "0")}`;
    modalSubtituloEl.textContent = "Detalle de productos, cantidades y totales";
    modalFiltrosEl.hidden = true;
    modalFiltrosEl.innerHTML = "";
    modalCuerpoEl.innerHTML = `<div class="modal-estado"><i class="bi bi-arrow-repeat spin"></i> Cargando detalle de la factura...</div>`;

    const detalle = await obtenerDetalleFactura(idFactura);

    if (!modalContenedorEl || modalContenedorEl.hidden || solicitud !== modalSolicitud) return;

    if (!detalle) {
        modalCuerpoEl.innerHTML = estadoVacioModal(
            "bi-exclamation-triangle",
            "Detalle no disponible",
            "No se pudo consultar el detalle de esta factura."
        );
        modalDashboardRetorno = () => abrirModalDashboard(contexto.tipo, contexto.valores);
        return;
    }

    const totalCalculado = detalle.reduce((suma, item) => {
        const subtotal = item.Subtotal ?? (Number(item.Cantidad) * Number(item.PrecioUnitario));
        return suma + (Number(subtotal) || 0);
    }, 0);

    const filas = detalle.map(item => {
        const subtotal = item.Subtotal ?? (Number(item.Cantidad) * Number(item.PrecioUnitario));

        return `
            <tr>
                <td><strong>${escapeHtml(item.Producto || item.CodigoProducto)}</strong></td>
                <td><code class="codigo-producto">${escapeHtml(item.CodigoProducto || "")}</code></td>
                <td class="celda-numero">${formatoNumero(item.Cantidad)}</td>
                <td class="celda-numero">${formatoCordobas(item.PrecioUnitario)}</td>
                <td class="celda-numero"><strong>${formatoCordobas(subtotal)}</strong></td>
            </tr>
        `;
    }).join("");

    modalCuerpoEl.innerHTML = `
        <div class="modal-mini-stats">
            <div class="modal-mini-stat">
                <span>Cliente</span>
                <strong>${escapeHtml(factura?.Cliente || "Cliente General")}</strong>
            </div>
            <div class="modal-mini-stat">
                <span>Fecha de emisión</span>
                <strong>${factura ? formatearFechaHora(factura.Fecha) : "Sin fecha"}</strong>
            </div>
            <div class="modal-mini-stat">
                <span>Total facturado</span>
                <strong>${formatoCordobas(factura?.Total ?? totalCalculado)}</strong>
            </div>
        </div>

        <div class="modal-seccion">
            <div class="modal-seccion-titulo">
                <span>Productos facturados</span>
                <span>${formatoNumero(detalle.length)} línea${detalle.length === 1 ? "" : "s"}</span>
            </div>

            <div class="modal-tabla-scroll">
                <table>
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Código</th>
                            <th class="celda-numero">Cantidad</th>
                            <th class="celda-numero">Precio</th>
                            <th class="celda-numero">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>${filas}</tbody>
                </table>
            </div>

            <p class="modal-nota">
                Suma de líneas: ${formatoCordobas(totalCalculado)}.
                Este detalle proviene de los registros reales de la factura.
            </p>
        </div>
    `;

    modalDashboardRetorno = () => abrirModalDashboard(contexto.tipo, contexto.valores);
}


// ==========================================
// MODAL: VENTAS DEL DÍA
// ==========================================

function abrirModalVentasDia(valores) {
    const fecha = /^\d{4}-\d{2}-\d{2}$/.test(valores.filtroFechaDia || "") ? valores.filtroFechaDia : hoyClave();

    prepararModal(
        "Ventas del Día",
        "Estadísticas, evolución y facturas de la fecha seleccionada",
        `<label>Fecha<input type="date" id="filtroFechaDia" value="${fecha}"></label>`
    );

    const campoFecha = document.getElementById("filtroFechaDia");

    const actualizar = () => {
        const seleccion = /^\d{4}-\d{2}-\d{2}$/.test(campoFecha.value) ? campoFecha.value : hoyClave();
        campoFecha.value = seleccion;
        renderizarContenidoVentasDia(seleccion);
    };

    campoFecha.addEventListener("change", actualizar);
    renderizarContenidoVentasDia(fecha);
}

function renderizarContenidoVentasDia(fechaClave) {
    const facturasDia = estadoDashboard.facturas.filter(factura => claveDiaLocal(factura.Fecha) === fechaClave);
    const facturasValidasDia = facturasVigentes(facturasDia);
    const totalDia = facturasValidasDia.reduce((suma, factura) => suma + Number(factura.Total || 0), 0);
    const ticket = facturasValidasDia.length ? totalDia / facturasValidasDia.length : 0;

    const dias = [];
    const base = new Date(`${fechaClave}T00:00:00`);

    for (let i = 6; i >= 0; i--) {
        const fecha = new Date(base);
        fecha.setDate(fecha.getDate() - i);
        const clave = claveDiaLocal(fecha);
        const facturasDelDia = estadoDashboard.facturas.filter(factura => claveDiaLocal(factura.Fecha) === clave);
        const facturasValidasDelDia = facturasVigentes(facturasDelDia);

        dias.push({
            etiqueta: fecha.toLocaleDateString("es-NI", { weekday: "short", day: "2-digit" }).replace(".", ""),
            valor: facturasValidasDelDia.reduce((suma, factura) => suma + Number(factura.Total || 0), 0),
            detalle: `${facturasValidasDelDia.length} factura${facturasValidasDelDia.length === 1 ? "" : "s"}`,
            esHoy: i === 0
        });
    }

    const fechaLegible = formatearFechaCorta(`${fechaClave}T00:00:00`);

    modalCuerpoEl.innerHTML = `
        <div class="modal-mini-stats">
            <div class="modal-mini-stat">
                <span>Total facturado</span>
                <strong>${formatoCordobas(totalDia)}</strong>
            </div>
            <div class="modal-mini-stat">
                <span>Facturas emitidas</span>
                <strong>${formatoNumero(facturasDia.length)}</strong>
            </div>
            <div class="modal-mini-stat">
                <span>Ticket promedio</span>
                <strong>${formatoCordobas(ticket)}</strong>
            </div>
        </div>

        <div class="modal-seccion">
            <div class="modal-seccion-titulo">
                <span>Evolución de los 7 días previos al ${fechaLegible}</span>
            </div>
            ${htmlGraficoBarrasDashboard(dias)}
        </div>

        <div class="modal-seccion">
            <div class="modal-seccion-titulo">
                <span>Facturas del ${fechaLegible}</span>
                <span>${formatoNumero(facturasDia.length)} registro${facturasDia.length === 1 ? "" : "s"}</span>
            </div>
            ${htmlTablaFacturas(facturasDia)}
        </div>
    `;
}


// ==========================================
// MODAL: VENTAS DEL MES
// ==========================================

function abrirModalVentasMes(valores) {
    const mes = /^\d{4}-\d{2}$/.test(valores.filtroMes || "") ? valores.filtroMes : mesActualClave();

    prepararModal(
        "Ventas del Mes",
        "Evolución diaria, estadísticas y facturas del mes seleccionado",
        `<label>Mes<input type="month" id="filtroMes" value="${mes}"></label>`
    );

    const campoMes = document.getElementById("filtroMes");

    const actualizar = () => {
        const seleccion = /^\d{4}-\d{2}$/.test(campoMes.value) ? campoMes.value : mesActualClave();
        campoMes.value = seleccion;
        renderizarContenidoVentasMes(seleccion);
    };

    campoMes.addEventListener("change", actualizar);
    renderizarContenidoVentasMes(mes);
}

function renderizarContenidoVentasMes(mesClave) {
    const [anio, mesNumero] = mesClave.split("-").map(Number);
    const facturasMes = estadoDashboard.facturas.filter(factura => claveMesLocal(factura.Fecha) === mesClave);
    const facturasValidasMes = facturasVigentes(facturasMes);
    const totalMes = facturasValidasMes.reduce((suma, factura) => suma + Number(factura.Total || 0), 0);
    const ticket = facturasValidasMes.length ? totalMes / facturasValidasMes.length : 0;
    const diasConVentas = new Set(facturasValidasMes.map(factura => claveDiaLocal(factura.Fecha))).size;
    const diasDelMes = new Date(anio, mesNumero, 0).getDate();
    const hoy = hoyClave();

    const dias = [];

    for (let dia = 1; dia <= diasDelMes; dia++) {
        const fecha = new Date(anio, mesNumero - 1, dia);
        const clave = claveDiaLocal(fecha);
        const facturasDelDia = facturasMes.filter(factura => claveDiaLocal(factura.Fecha) === clave);
        const facturasValidasDelDia = facturasVigentes(facturasDelDia);

        dias.push({
            etiqueta: String(dia),
            valor: facturasValidasDelDia.reduce((suma, factura) => suma + Number(factura.Total || 0), 0),
            detalle: `${facturasValidasDelDia.length} factura${facturasValidasDelDia.length === 1 ? "" : "s"}`,
            esHoy: clave === hoy
        });
    }

    const nombreMes = new Date(anio, mesNumero - 1, 1)
        .toLocaleDateString("es-NI", { month: "long", year: "numeric" });
    const mesLegible = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);

    const facturasVisibles = facturasMes.slice(0, 100);

    modalCuerpoEl.innerHTML = `
        <div class="modal-mini-stats">
            <div class="modal-mini-stat">
                <span>Total facturado</span>
                <strong>${formatoCordobas(totalMes)}</strong>
            </div>
            <div class="modal-mini-stat">
                <span>Facturas emitidas</span>
                <strong>${formatoNumero(facturasMes.length)}</strong>
            </div>
            <div class="modal-mini-stat">
                <span>Ticket promedio</span>
                <strong>${formatoCordobas(ticket)}</strong>
            </div>
            <div class="modal-mini-stat">
                <span>Días con ventas</span>
                <strong>${formatoNumero(diasConVentas)} / ${diasDelMes}</strong>
            </div>
        </div>

        <div class="modal-seccion">
            <div class="modal-seccion-titulo">
                <span>Evolución diaria · ${escapeHtml(mesLegible)}</span>
                <span>${formatoNumero(diasDelMes)} días</span>
            </div>
            ${htmlGraficoBarrasDashboard(dias)}
        </div>

        <div class="modal-seccion">
            <div class="modal-seccion-titulo">
                <span>Facturas del mes</span>
                <span>${formatoNumero(facturasMes.length)} registro${facturasMes.length === 1 ? "" : "s"}</span>
            </div>
            ${htmlTablaFacturas(facturasVisibles)}
            ${facturasMes.length > facturasVisibles.length
                ? `<p class="modal-nota">Mostrando las ${facturasVisibles.length} facturas más recientes de ${facturasMes.length}.</p>`
                : ""}
        </div>
    `;
}


// ==========================================
// MODAL: TOP PRODUCTOS
// ==========================================

function abrirModalTopProductos(valores) {
    const desde = /^\d{4}-\d{2}-\d{2}$/.test(valores.filtroProdDesde || "") ? valores.filtroProdDesde : "";
    const hasta = /^\d{4}-\d{2}-\d{2}$/.test(valores.filtroProdHasta || "") ? valores.filtroProdHasta : "";

    prepararModal(
        "Productos Más Vendidos",
        "Ranking histórico con unidades, recaudación, fechas y clientes compradores",
        `
            <label>Desde<input type="date" id="filtroProdDesde" value="${desde}"></label>
            <label>Hasta<input type="date" id="filtroProdHasta" value="${hasta}"></label>
        `
    );

    const campoDesde = document.getElementById("filtroProdDesde");
    const campoHasta = document.getElementById("filtroProdHasta");

    const actualizar = () => {
        renderizarContenidoTopProductos(campoDesde.value, campoHasta.value);
    };

    campoDesde.addEventListener("change", actualizar);
    campoHasta.addEventListener("change", actualizar);

    renderizarContenidoTopProductos(desde, hasta);
}

function analizarVentasPorProducto(facturas, detallesPorFactura) {
    const mapa = new Map();

    facturas.forEach(factura => {
        const detalles = detallesPorFactura.get(factura.IdFactura);
        if (!detalles) return;

        detalles.forEach(linea => {
            const codigo = linea.CodigoProducto;
            if (!codigo) return;

            if (!mapa.has(codigo)) {
                mapa.set(codigo, {
                    codigo,
                    nombre: linea.Producto || codigo,
                    categoria: "",
                    unidades: 0,
                    recaudado: 0,
                    ultimaVenta: null,
                    compradores: new Map()
                });
            }

            const item = mapa.get(codigo);
            const cantidad = Number(linea.Cantidad) || 0;
            const subtotal = linea.Subtotal ?? (cantidad * Number(linea.PrecioUnitario));

            item.unidades += cantidad;
            item.recaudado += Number(subtotal) || 0;

            const fecha = new Date(factura.Fecha);
            if (!isNaN(fecha.getTime()) && (!item.ultimaVenta || fecha > item.ultimaVenta)) {
                item.ultimaVenta = fecha;
            }

            const cliente = factura.Cliente || "Cliente General";
            item.compradores.set(cliente, (item.compradores.get(cliente) || 0) + 1);
        });
    });

    const categorias = new Map(
        estadoDashboard.productos.map(producto => [producto.CodigoProducto, producto.Categoria])
    );

    mapa.forEach(item => {
        item.categoria = categorias.get(item.codigo) || "General";
    });

    return mapa;
}

function htmlCompradoresProducto(compradores) {
    if (!compradores || compradores.size === 0) {
        return `<span>Sin compras en el periodo</span>`;
    }

    const ordenados = Array.from(compradores.entries()).sort((a, b) => b[1] - a[1]);
    const visibles = ordenados.slice(0, 3).map(([cliente, cantidad]) =>
        `<span>${escapeHtml(cliente)} <strong>(${cantidad})</strong></span>`
    );

    if (ordenados.length > 3) {
        visibles.push(`<span>+${ordenados.length - 3} cliente${ordenados.length - 3 === 1 ? "" : "s"}</span>`);
    }

    return visibles.join("");
}

async function renderizarContenidoTopProductos(desde, hasta) {
    if (desde && hasta && desde > hasta) {
        modalCuerpoEl.innerHTML = estadoVacioModal(
            "bi-calendar-x",
            "Rango de fechas inválido",
            "La fecha inicial no puede ser posterior a la fecha final."
        );
        return;
    }

    const conFiltro = Boolean(desde || hasta);

    const facturasPeriodo = estadoDashboard.facturas.filter(factura => {
        const clave = claveDiaLocal(factura.Fecha);
        if (!clave) return false;
        if (desde && clave < desde) return false;
        if (hasta && clave > hasta) return false;
        return true;
    });

    const facturasAnalisis = conFiltro
        ? facturasVigentes(facturasPeriodo)
        : facturasVigentes(estadoDashboard.facturas).slice(0, 80);
    const solicitud = ++modalSolicitud;

    modalCuerpoEl.innerHTML = `<div class="modal-estado"><i class="bi bi-arrow-repeat spin"></i> Analizando ${formatoNumero(facturasAnalisis.length)} facturas...</div>`;

    const detalles = await cargarDetallesFacturas(facturasAnalisis);

    if (!modalContenedorEl || modalContenedorEl.hidden || modalTipoActual !== "productos" || solicitud !== modalSolicitud) return;

    const analisis = analizarVentasPorProducto(facturasAnalisis, detalles);

    let ranking;

    if (conFiltro) {
        ranking = Array.from(analisis.values())
            .filter(item => item.unidades > 0)
            .sort((a, b) => b.unidades - a.unidades || b.recaudado - a.recaudado)
            .map(item => ({
                codigo: item.codigo,
                nombre: item.nombre,
                categoria: item.categoria,
                unidades: item.unidades,
                recaudado: item.recaudado,
                ultimaVenta: item.ultimaVenta,
                compradores: item.compradores
            }));
    } else {
        ranking = (estadoDashboard.topProductos || []).map(producto => {
            const detalle = analisis.get(producto.CodigoProducto);

            return {
                codigo: producto.CodigoProducto,
                nombre: producto.Nombre || producto.CodigoProducto,
                categoria: producto.Categoria || "Souvenirs",
                unidades: Number(producto.CantidadVendida) || 0,
                recaudado: Number(producto.TotalRecaudado) || 0,
                ultimaVenta: detalle?.ultimaVenta || null,
                compradores: detalle?.compradores || new Map()
            };
        });
    }

    if (ranking.length === 0) {
        modalCuerpoEl.innerHTML = estadoVacioModal(
            "bi-trophy",
            "Sin ventas en el periodo",
            "No existen productos vendidos para el rango de fechas seleccionado."
        );
        return;
    }

    const filas = ranking.map((producto, indice) => {
        const medalla = indice === 0 ? "oro" : indice === 1 ? "plata" : indice === 2 ? "bronce" : "";

        return `
            <tr>
                <td><span class="medalla-rank ${medalla}">${indice + 1}</span></td>
                <td>
                    <strong>${escapeHtml(producto.nombre)}</strong>
                    <div class="compras-producto"><span><code class="codigo-producto">${escapeHtml(producto.codigo || "")}</code></span></div>
                </td>
                <td><span class="badge-categoria">${escapeHtml(producto.categoria || "General")}</span></td>
                <td class="celda-numero"><strong>${formatoNumero(producto.unidades)}</strong></td>
                <td class="celda-numero">${formatoCordobas(producto.recaudado)}</td>
                <td>${producto.ultimaVenta ? formatearFechaCorta(producto.ultimaVenta) : "—"}</td>
                <td><div class="compras-producto">${htmlCompradoresProducto(producto.compradores)}</div></td>
            </tr>
        `;
    }).join("");

    const nota = conFiltro
        ? `Ranking calculado con ${formatoNumero(facturasPeriodo.length)} factura${facturasPeriodo.length === 1 ? "" : "s"} del periodo. Los compradores corresponden a esas mismas facturas.`
        : `Unidades y recaudación son históricas. La última venta y los compradores se calculan sobre las ${formatoNumero(facturasAnalisis.length)} facturas más recientes.`;

    modalCuerpoEl.innerHTML = `
        <div class="modal-seccion">
            <div class="modal-tabla-scroll">
                <table class="tabla-amplia">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Producto</th>
                            <th>Categoría</th>
                            <th class="celda-numero">Unidades</th>
                            <th class="celda-numero">Recaudado</th>
                            <th>Última venta</th>
                            <th>Compradores</th>
                        </tr>
                    </thead>
                    <tbody>${filas}</tbody>
                </table>
            </div>
            <p class="modal-nota">${escapeHtml(nota)}</p>
        </div>
    `;
}


// ==========================================
// MODAL: VENTAS RECIENTES
// ==========================================

function abrirModalVentasRecientes(valores) {
    const desde = /^\d{4}-\d{2}-\d{2}$/.test(valores.filtroVentaDesde || "") ? valores.filtroVentaDesde : "";
    const hasta = /^\d{4}-\d{2}-\d{2}$/.test(valores.filtroVentaHasta || "") ? valores.filtroVentaHasta : "";
    const busqueda = valores.filtroVentaBuscar || "";

    prepararModal(
        "Ventas Recientes",
        "Transacciones detalladas con filtros por fecha y cliente",
        `
            <label>Desde<input type="date" id="filtroVentaDesde" value="${desde}"></label>
            <label>Hasta<input type="date" id="filtroVentaHasta" value="${hasta}"></label>
            <label>Cliente<input type="search" id="filtroVentaBuscar" value="${escapeHtml(busqueda)}" placeholder="Nombre del cliente"></label>
        `
    );

    const campoDesde = document.getElementById("filtroVentaDesde");
    const campoHasta = document.getElementById("filtroVentaHasta");
    const campoBuscar = document.getElementById("filtroVentaBuscar");

    const actualizar = () => {
        renderizarContenidoVentasRecientes(campoDesde.value, campoHasta.value, campoBuscar.value);
    };

    campoDesde.addEventListener("change", actualizar);
    campoHasta.addEventListener("change", actualizar);
    campoBuscar.addEventListener("input", actualizar);

    renderizarContenidoVentasRecientes(desde, hasta, busqueda);
}

function normalizarBusqueda(texto) {
    return String(texto || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function renderizarContenidoVentasRecientes(desde, hasta, busqueda) {
    if (desde && hasta && desde > hasta) {
        modalCuerpoEl.innerHTML = estadoVacioModal(
            "bi-calendar-x",
            "Rango de fechas inválido",
            "La fecha inicial no puede ser posterior a la fecha final."
        );
        return;
    }

    const termino = normalizarBusqueda(busqueda);

    const filtradas = estadoDashboard.facturas.filter(factura => {
        const clave = claveDiaLocal(factura.Fecha);
        if (!clave) return false;
        if (desde && clave < desde) return false;
        if (hasta && clave > hasta) return false;
        if (termino && !normalizarBusqueda(factura.Cliente).includes(termino)) return false;
        return true;
    });

    const facturasValidas = facturasVigentes(filtradas);
    const total = facturasValidas.reduce((suma, factura) => suma + Number(factura.Total || 0), 0);
    const ticket = facturasValidas.length ? total / facturasValidas.length : 0;
    const visibles = filtradas.slice(0, 200);

    modalCuerpoEl.innerHTML = `
        <div class="modal-mini-stats">
            <div class="modal-mini-stat">
                <span>Transacciones</span>
                <strong>${formatoNumero(filtradas.length)}</strong>
            </div>
            <div class="modal-mini-stat">
                <span>Total facturado</span>
                <strong>${formatoCordobas(total)}</strong>
            </div>
            <div class="modal-mini-stat">
                <span>Ticket promedio</span>
                <strong>${formatoCordobas(ticket)}</strong>
            </div>
        </div>

        <div class="modal-seccion">
            <div class="modal-seccion-titulo">
                <span>Transacciones</span>
                <span>${formatoNumero(filtradas.length)} resultado${filtradas.length === 1 ? "" : "s"}</span>
            </div>
            ${htmlTablaFacturas(visibles)}
            ${filtradas.length > visibles.length
                ? `<p class="modal-nota">Mostrando las ${visibles.length} transacciones más recientes de ${filtradas.length}.</p>`
                : `<p class="modal-nota">Seleccioná una factura para ver sus productos y totales.</p>`}
        </div>
    `;
}


// ==========================================
// MODAL: CLIENTES REGISTRADOS
// ==========================================

function abrirModalClientes(valores) {
    const busqueda = valores.filtroClienteBuscar || "";
    const orden = ["actividad", "nombre", "compras"].includes(valores.filtroClienteOrden)
        ? valores.filtroClienteOrden
        : "actividad";

    prepararModal(
        "Clientes Registrados",
        "Actividad de compra, estadísticas y cartera real de clientes",
        `
            <label>Buscar cliente<input type="search" id="filtroClienteBuscar" value="${escapeHtml(busqueda)}" placeholder="Nombre, teléfono o correo"></label>
            <label>Ordenar por
                <select id="filtroClienteOrden">
                    <option value="actividad" ${orden === "actividad" ? "selected" : ""}>Mayor compra</option>
                    <option value="compras" ${orden === "compras" ? "selected" : ""}>Más compras</option>
                    <option value="nombre" ${orden === "nombre" ? "selected" : ""}>Nombre</option>
                </select>
            </label>
        `
    );

    const campoBuscar = document.getElementById("filtroClienteBuscar");
    const campoOrden = document.getElementById("filtroClienteOrden");

    const actualizar = () => {
        renderizarContenidoClientes(campoBuscar.value, campoOrden.value);
    };

    campoBuscar.addEventListener("input", actualizar);
    campoOrden.addEventListener("change", actualizar);

    renderizarContenidoClientes(busqueda, orden);
}

function renderizarContenidoClientes(busqueda, orden) {
    const clientes = estadoDashboard.clientes;

    if (!Array.isArray(clientes) || clientes.length === 0) {
        modalCuerpoEl.innerHTML = estadoVacioModal(
            "bi-people",
            "Sin clientes registrados",
            "La cartera de clientes está vacía."
        );
        return;
    }

    const actividad = new Map();

    estadoDashboard.facturas.forEach(factura => {
        if (esFacturaAnulada(factura)) return;

        const nombre = factura.Cliente || "Cliente General";
        if (!actividad.has(nombre)) {
            actividad.set(nombre, { compras: 0, total: 0, ultima: null });
        }

        const item = actividad.get(nombre);
        item.compras += 1;
        item.total += Number(factura.Total || 0);

        const fecha = new Date(factura.Fecha);
        if (!isNaN(fecha.getTime()) && (!item.ultima || fecha > item.ultima)) {
            item.ultima = fecha;
        }
    });

    const enriquecidos = clientes.map(cliente => {
        const movimiento = actividad.get(cliente.Nombre) || { compras: 0, total: 0, ultima: null };

        return {
            ...cliente,
            compras: movimiento.compras,
            total: movimiento.total,
            ultima: movimiento.ultima
        };
    });

    const conCompras = enriquecidos.filter(cliente => cliente.compras > 0).length;
    const totalComprado = enriquecidos.reduce((suma, cliente) => suma + cliente.total, 0);
    const termino = normalizarBusqueda(busqueda);

    let visibles = enriquecidos.filter(cliente => {
        if (!termino) return true;
        return [cliente.Nombre, cliente.Telefono, cliente.Correo]
            .some(valor => normalizarBusqueda(valor).includes(termino));
    });

    visibles.sort((a, b) => {
        if (orden === "nombre") return String(a.Nombre).localeCompare(String(b.Nombre), "es");
        if (orden === "compras") return b.compras - a.compras || b.total - a.total;
        return b.total - a.total || b.compras - a.compras;
    });

    const meses = [];
    const ahora = new Date();

    for (let i = 5; i >= 0; i--) {
        const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
        meses.push({
            clave: claveMesLocal(fecha),
            etiqueta: fecha.toLocaleDateString("es-NI", { month: "short" }).replace(".", ""),
            valor: 0,
            facturas: 0
        });
    }

    estadoDashboard.facturas.forEach(factura => {
        if (esFacturaAnulada(factura)) return;

        const mes = meses.find(item => item.clave === claveMesLocal(factura.Fecha));
        if (mes) {
            mes.valor += Number(factura.Total || 0);
            mes.facturas += 1;
        }
    });

    meses.forEach(mes => {
        mes.detalle = `${formatoNumero(mes.facturas)} factura${mes.facturas === 1 ? "" : "s"}`;
    });

    const filas = visibles.map(cliente => `
        <tr>
            <td>
                <strong>${escapeHtml(cliente.Nombre)}</strong>
                <div class="compras-producto"><span>${escapeHtml(cliente.Correo || "Sin correo")}</span></div>
            </td>
            <td>${escapeHtml(cliente.Telefono || "Sin teléfono")}</td>
            <td class="celda-numero">${formatoNumero(cliente.compras)}</td>
            <td class="celda-numero">${formatoCordobas(cliente.total)}</td>
            <td>${cliente.ultima ? formatearFechaCorta(cliente.ultima) : "Sin compras"}</td>
        </tr>
    `).join("");

    modalCuerpoEl.innerHTML = `
        <div class="modal-mini-stats">
            <div class="modal-mini-stat">
                <span>Clientes registrados</span>
                <strong>${formatoNumero(clientes.length)}</strong>
            </div>
            <div class="modal-mini-stat">
                <span>Con compras registradas</span>
                <strong>${formatoNumero(conCompras)}</strong>
            </div>
            <div class="modal-mini-stat">
                <span>Sin compras</span>
                <strong>${formatoNumero(clientes.length - conCompras)}</strong>
            </div>
            <div class="modal-mini-stat">
                <span>Total comprado</span>
                <strong>${formatoCordobas(totalComprado)}</strong>
            </div>
        </div>

        <div class="modal-seccion">
            <div class="modal-seccion-titulo">
                <span>Actividad de compra · últimos 6 meses</span>
            </div>
            ${htmlGraficoBarrasDashboard(meses)}
            <p class="modal-nota">Monto facturado por mes según las facturas reales emitidas.</p>
        </div>

        <div class="modal-seccion">
            <div class="modal-seccion-titulo">
                <span>Cartera de clientes</span>
                <span>${formatoNumero(visibles.length)} de ${formatoNumero(clientes.length)}</span>
            </div>

            ${visibles.length === 0
                ? estadoVacioModal("bi-search", "Sin resultados", "Ningún cliente coincide con la búsqueda.")
                : `
                    <div class="modal-tabla-scroll">
                        <table class="tabla-amplia">
                            <thead>
                                <tr>
                                    <th>Cliente</th>
                                    <th>Teléfono</th>
                                    <th class="celda-numero">Compras</th>
                                    <th class="celda-numero">Total comprado</th>
                                    <th>Última compra</th>
                                </tr>
                            </thead>
                            <tbody>${filas}</tbody>
                        </table>
                    </div>
                `}

            <p class="modal-nota">La base de datos no almacena fecha de alta de clientes; las cifras mostradas provienen de sus facturas reales.</p>
        </div>
    `;
}


// ==========================================
// DATOS AUXILIARES DE PRODUCTOS
// ==========================================

function productosParaAnalisis() {
    const productos = Array.isArray(estadoDashboard.productos) ? estadoDashboard.productos : [];
    if (productos.length > 0) return productos;

    return Array.isArray(estadoDashboard.alertasInventario)
        ? estadoDashboard.alertasInventario
        : [];
}

function categoriasUnicas(productos) {
    return Array.from(new Set(
        productos.map(producto => String(producto.Categoria || "").trim() || "Sin categoría")
    )).sort((a, b) => a.localeCompare(b, "es"));
}

function stockMinimoProducto(producto) {
    const minimo = Number(producto?.StockMinimo);
    return Number.isFinite(minimo) && minimo >= 0 ? minimo : 0;
}

function estadoStockHtml(producto) {
    const stock = Number(producto?.Stock) || 0;
    const minimo = stockMinimoProducto(producto);

    if (stock <= 0) {
        return `<span class="stock-agotado"><i class="bi bi-x-circle-fill"></i> Agotado</span>`;
    }

    if (stock <= minimo) {
        return `<span class="stock-bajo"><i class="bi bi-exclamation-triangle-fill"></i> Stock bajo</span>`;
    }

    return `<span class="stock-disponible"><i class="bi bi-check2-circle"></i> Disponible</span>`;
}


// ==========================================
// MODAL: TICKET PROMEDIO
// ==========================================

function abrirModalTicketPromedio() {
    prepararModal(
        "Ticket Promedio",
        "Promedio real por factura emitida y evolución mensual",
        ""
    );

    const facturas = Array.isArray(estadoDashboard.facturas) ? estadoDashboard.facturas : [];
    const facturasValidas = facturasVigentes(facturas);
    const totalFacturado = facturasValidas.reduce((suma, factura) => suma + Number(factura.Total || 0), 0);
    const ticket = facturasValidas.length
        ? totalFacturado / facturasValidas.length
        : Number(estadoDashboard.estadisticas.TicketPromedio || 0);

    const ordenadas = [...facturasValidas].sort((a, b) => Number(b.Total || 0) - Number(a.Total || 0));
    const mayor = ordenadas[0];
    const menor = ordenadas[ordenadas.length - 1];

    const meses = [];
    const ahora = new Date();

    for (let i = 5; i >= 0; i--) {
        const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
        const clave = claveMesLocal(fecha);
        const delMes = facturasValidas.filter(factura => claveMesLocal(factura.Fecha) === clave);
        const monto = delMes.reduce((suma, factura) => suma + Number(factura.Total || 0), 0);

        meses.push({
            etiqueta: fecha.toLocaleDateString("es-NI", { month: "short" }).replace(".", ""),
            valor: delMes.length ? monto / delMes.length : 0,
            detalle: `${formatoNumero(delMes.length)} factura${delMes.length === 1 ? "" : "s"}`,
            esHoy: i === 0
        });
    }

    modalCuerpoEl.innerHTML = `
        <div class="modal-mini-stats">
            <div class="modal-mini-stat">
                <span>Ticket promedio general</span>
                <strong>${formatoCordobas(ticket)}</strong>
            </div>
            <div class="modal-mini-stat">
                <span>Facturas consideradas</span>
                <strong>${formatoNumero(facturasValidas.length)}</strong>
            </div>
            <div class="modal-mini-stat">
                <span>Factura de mayor monto</span>
                <strong>${mayor ? formatoCordobas(mayor.Total) : "—"}</strong>
            </div>
            <div class="modal-mini-stat">
                <span>Factura de menor monto</span>
                <strong>${menor ? formatoCordobas(menor.Total) : "—"}</strong>
            </div>
        </div>

        <div class="modal-seccion">
            <div class="modal-seccion-titulo">
                <span>Evolución del ticket promedio · últimos 6 meses</span>
            </div>
            ${htmlGraficoBarrasDashboard(meses)}
            <p class="modal-nota">
                El ticket promedio se calcula como el total facturado entre la cantidad de facturas emitidas.
            </p>
        </div>

        <div class="modal-seccion">
            <div class="modal-seccion-titulo">
                <span>Facturas de mayor monto</span>
                <span>${formatoNumero(Math.min(facturas.length, 10))} de ${formatoNumero(facturas.length)}</span>
            </div>
            ${htmlTablaFacturas(ordenadas.slice(0, 10))}
        </div>
    `;
}


// ==========================================
// MODAL: FACTURAS EMITIDAS
// ==========================================

function abrirModalFacturasEmitidas(valores) {
    const desde = /^\d{4}-\d{2}-\d{2}$/.test(valores.filtroFacturaDesde || "")
        ? valores.filtroFacturaDesde
        : "";
    const hasta = /^\d{4}-\d{2}-\d{2}$/.test(valores.filtroFacturaHasta || "")
        ? valores.filtroFacturaHasta
        : "";

    prepararModal(
        "Facturas Emitidas",
        "Comprobantes emitidos, facturación y promedio por factura",
        `
            <label>Desde<input type="date" id="filtroFacturaDesde" value="${desde}"></label>
            <label>Hasta<input type="date" id="filtroFacturaHasta" value="${hasta}"></label>
        `
    );

    const campoDesde = document.getElementById("filtroFacturaDesde");
    const campoHasta = document.getElementById("filtroFacturaHasta");

    const actualizar = () => {
        renderizarContenidoFacturasEmitidas(campoDesde.value, campoHasta.value);
    };

    campoDesde.addEventListener("change", actualizar);
    campoHasta.addEventListener("change", actualizar);

    renderizarContenidoFacturasEmitidas(desde, hasta);
}

function renderizarContenidoFacturasEmitidas(desde, hasta) {
    if (desde && hasta && desde > hasta) {
        modalCuerpoEl.innerHTML = estadoVacioModal(
            "bi-calendar-x",
            "Rango de fechas inválido",
            "La fecha inicial no puede ser posterior a la fecha final."
        );
        return;
    }

    const facturas = Array.isArray(estadoDashboard.facturas) ? estadoDashboard.facturas : [];

    const filtradas = facturas.filter(factura => {
        const clave = claveDiaLocal(factura.Fecha);
        if (!clave) return false;
        if (desde && clave < desde) return false;
        if (hasta && clave > hasta) return false;
        return true;
    });

    const facturasValidas = facturasVigentes(filtradas);
    const total = facturasValidas.reduce((suma, factura) => suma + Number(factura.Total || 0), 0);
    const ticket = facturasValidas.length ? total / facturasValidas.length : 0;
    const hoy = hoyClave();
    const facturasHoy = facturas.filter(factura => claveDiaLocal(factura.Fecha) === hoy).length;
    const visibles = filtradas.slice(0, 200);

    const meses = [];
    const ahora = new Date();

    for (let i = 5; i >= 0; i--) {
        const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
        const clave = claveMesLocal(fecha);
        const delMes = facturas.filter(factura => claveMesLocal(factura.Fecha) === clave);
        const monto = facturasVigentes(delMes).reduce((suma, factura) => suma + Number(factura.Total || 0), 0);

        meses.push({
            etiqueta: fecha.toLocaleDateString("es-NI", { month: "short" }).replace(".", ""),
            valor: delMes.length,
            detalle: formatoCordobas(monto),
            esHoy: i === 0
        });
    }

    modalCuerpoEl.innerHTML = `
        <div class="modal-mini-stats">
            <div class="modal-mini-stat">
                <span>Facturas en el rango</span>
                <strong>${formatoNumero(filtradas.length)}</strong>
            </div>
            <div class="modal-mini-stat">
                <span>Total facturado</span>
                <strong>${formatoCordobas(total)}</strong>
            </div>
            <div class="modal-mini-stat">
                <span>Ticket promedio</span>
                <strong>${formatoCordobas(ticket)}</strong>
            </div>
            <div class="modal-mini-stat">
                <span>Emitidas hoy</span>
                <strong>${formatoNumero(facturasHoy)}</strong>
            </div>
        </div>

        <div class="modal-seccion">
            <div class="modal-seccion-titulo">
                <span>Facturas emitidas · últimos 6 meses</span>
            </div>
            ${htmlGraficoBarrasDashboard(meses, {
                formato: formatoNumero,
                compacto: valor => String(Math.round(Number(valor) || 0))
            })}
            <p class="modal-nota">
                Cada barra representa la cantidad de facturas emitidas en el mes; el detalle muestra su facturación.
            </p>
        </div>

        <div class="modal-seccion">
            <div class="modal-seccion-titulo">
                <span>Comprobantes</span>
                <span>${formatoNumero(filtradas.length)} registro${filtradas.length === 1 ? "" : "s"}</span>
            </div>
            ${htmlTablaFacturas(visibles)}
            ${filtradas.length > visibles.length
                ? `<p class="modal-nota">Mostrando las ${visibles.length} facturas más recientes de ${filtradas.length}.</p>`
                : `<p class="modal-nota">Seleccioná una factura para consultar su detalle.</p>`}
        </div>
    `;
}


// ==========================================
// MODAL: CATÁLOGO DE PRODUCTOS
// ==========================================

function abrirModalCatalogoProductos(valores) {
    const busqueda = valores.filtroCatalogoBuscar || "";
    const categoria = valores.filtroCatalogoCategoria || "";
    const productos = productosParaAnalisis();
    const opcionesCategoria = categoriasUnicas(productos)
        .map(nombre => `<option value="${escapeHtml(nombre)}" ${nombre === categoria ? "selected" : ""}>${escapeHtml(nombre)}</option>`)
        .join("");

    prepararModal(
        "Catálogo de Productos",
        "Referencias registradas, unidades físicas y valor real del catálogo",
        `
            <label>Buscar producto<input type="search" id="filtroCatalogoBuscar" value="${escapeHtml(busqueda)}" placeholder="Código, nombre, descripción o categoría"></label>
            <label>Categoría
                <select id="filtroCatalogoCategoria">
                    <option value="">Todas las categorías</option>
                    ${opcionesCategoria}
                </select>
            </label>
        `
    );

    const campoBuscar = document.getElementById("filtroCatalogoBuscar");
    const campoCategoria = document.getElementById("filtroCatalogoCategoria");

    const actualizar = () => {
        renderizarContenidoCatalogo(campoBuscar.value, campoCategoria.value);
    };

    campoBuscar.addEventListener("input", actualizar);
    campoCategoria.addEventListener("change", actualizar);

    renderizarContenidoCatalogo(busqueda, categoria);
}

function renderizarContenidoCatalogo(busqueda, categoria) {
    const productos = productosParaAnalisis();

    if (productos.length === 0) {
        modalCuerpoEl.innerHTML = estadoVacioModal(
            "bi-box-seam",
            "Sin productos registrados",
            "El catálogo todavía no tiene referencias."
        );
        return;
    }

    const termino = normalizarBusqueda(busqueda);
    const categoriaNormalizada = normalizarBusqueda(categoria);

    const filtrados = productos.filter(producto => {
        const nombreCategoria = String(producto.Categoria || "").trim() || "Sin categoría";

        if (categoriaNormalizada && normalizarBusqueda(nombreCategoria) !== categoriaNormalizada) {
            return false;
        }

        if (!termino) return true;

        return [
            producto.CodigoProducto,
            producto.Nombre,
            producto.Descripcion,
            nombreCategoria
        ].some(valor => normalizarBusqueda(valor).includes(termino));
    });

    const categorias = agruparProductosPorCategoria(productos);
    const totalUnidades = productos.reduce((suma, producto) => suma + (Number(producto.Stock) || 0), 0);
    const valorCatalogo = productos.reduce((suma, producto) => {
        const stock = Math.max(Number(producto.Stock) || 0, 0);
        return suma + stock * (Number(producto.Precio) || 0);
    }, 0);

    const itemsCategorias = categorias.slice(0, 8).map(item => ({
        etiqueta: item.nombre,
        valor: item.unidades,
        detalle: `${formatoNumero(item.productos)} producto${item.productos === 1 ? "" : "s"}`
    }));

    const filas = filtrados.slice(0, 300).map(producto => {
        const stock = Number(producto.Stock) || 0;
        const descripcion = String(producto.Descripcion || "").trim();

        return `
            <tr>
                <td><code>${escapeHtml(producto.CodigoProducto || "")}</code></td>
                <td>
                    <strong>${escapeHtml(producto.Nombre || "Sin nombre")}</strong>
                    ${descripcion
                        ? `<div class="compras-producto"><span>${escapeHtml(descripcion)}</span></div>`
                        : ""}
                </td>
                <td><span class="badge-categoria">${escapeHtml(producto.Categoria || "Sin categoría")}</span></td>
                <td class="celda-numero">${formatoCordobas(producto.Precio)}</td>
                <td class="celda-numero"><strong>${formatoNumero(stock)}</strong> unid.</td>
                <td>${estadoStockHtml(producto)}</td>
            </tr>
        `;
    }).join("");

    modalCuerpoEl.innerHTML = `
        <div class="modal-mini-stats">
            <div class="modal-mini-stat">
                <span>Referencias registradas</span>
                <strong>${formatoNumero(productos.length)}</strong>
            </div>
            <div class="modal-mini-stat">
                <span>Categorías</span>
                <strong>${formatoNumero(categorias.length)}</strong>
            </div>
            <div class="modal-mini-stat">
                <span>Unidades físicas en stock</span>
                <strong>${formatoNumero(totalUnidades)}</strong>
            </div>
            <div class="modal-mini-stat">
                <span>Valor a precio de venta</span>
                <strong>${formatoCordobas(valorCatalogo)}</strong>
            </div>
        </div>

        <div class="modal-seccion">
            <div class="modal-seccion-titulo">
                <span>Unidades físicas por categoría</span>
            </div>
            ${itemsCategorias.length > 0
                ? htmlGraficoBarrasDashboard(itemsCategorias, {
                    formato: valor => `${formatoNumero(valor)} unid.`,
                    compacto: valor => String(Math.round(Number(valor) || 0))
                })
                : estadoVacioModal("bi-box", "Sin categorías", "No hay categorías registradas en el catálogo.")}
        </div>

        <div class="modal-seccion">
            <div class="modal-seccion-titulo">
                <span>Productos</span>
                <span>${formatoNumero(filtrados.length)} resultado${filtrados.length === 1 ? "" : "s"}</span>
            </div>

            ${filtrados.length === 0
                ? estadoVacioModal("bi-search", "Sin resultados", "Ningún producto coincide con los filtros aplicados.")
                : `
                    <div class="modal-tabla-scroll">
                        <table class="tabla-amplia">
                            <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Producto</th>
                                    <th>Categoría</th>
                                    <th class="celda-numero">Precio</th>
                                    <th class="celda-numero">Stock</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>${filas}</tbody>
                        </table>
                    </div>
                `}

            ${filtrados.length > 300
                ? `<p class="modal-nota">Mostrando los primeros 300 productos de ${filtrados.length}.</p>`
                : `<p class="modal-nota">Las unidades físicas corresponden al stock registrado, no a ventas.</p>`}
        </div>
    `;
}


// ==========================================
// MODALES: STOCK BAJO Y AGOTADOS
// ==========================================

function abrirModalStockBajo(valores) {
    prepararModal(
        "Stock Bajo",
        "Productos en o por debajo de su stock mínimo configurado",
        ""
    );

    const productos = productosParaAnalisis();
    const afectados = productos.filter(producto => {
        const stock = Number(producto.Stock) || 0;
        return stock > 0 && stock <= stockMinimoProducto(producto);
    });

    const opciones = categoriasUnicas(afectados)
        .map(nombre => `<option value="${escapeHtml(nombre)}">${escapeHtml(nombre)}</option>`)
        .join("");

    modalFiltrosEl.hidden = afectados.length === 0;
    modalFiltrosEl.innerHTML = afectados.length === 0
        ? ""
        : `
            <label>Categoría
                <select id="filtroStockCategoria">
                    <option value="">Todas las categorías</option>
                    ${opciones}
                </select>
            </label>
        `;

    const campoCategoria = document.getElementById("filtroStockCategoria");
    if (campoCategoria) {
        campoCategoria.addEventListener("change", () => {
            renderizarContenidoStockBajo(afectados, productos, campoCategoria.value);
        });
    }

    renderizarContenidoStockBajo(afectados, productos, valores.filtroStockCategoria || "");
}

function renderizarContenidoStockBajo(afectados, productos, categoria) {
    if (afectados.length === 0) {
        modalCuerpoEl.innerHTML = estadoVacioModal(
            "bi-check2-circle",
            "Sin stock bajo",
            "Ningún producto se encuentra en o por debajo de su stock mínimo."
        );
        return;
    }

    const categoriaNormalizada = normalizarBusqueda(categoria);
    const visibles = afectados.filter(producto => {
        if (!categoriaNormalizada) return true;
        const nombreCategoria = String(producto.Categoria || "").trim() || "Sin categoría";
        return normalizarBusqueda(nombreCategoria) === categoriaNormalizada;
    });

    const unidades = afectados.reduce((suma, producto) => suma + (Number(producto.Stock) || 0), 0);
    const agotados = productos.filter(producto => (Number(producto.Stock) || 0) <= 0).length;
    const categoriasAfectadas = categoriasUnicas(afectados);

    const itemsCategorias = agruparProductosPorCategoria(afectados).map(item => ({
        etiqueta: item.nombre,
        valor: item.productos,
        detalle: `${formatoNumero(item.unidades)} unidades disponibles`
    }));

    const filas = visibles.map(producto => {
        const stock = Number(producto.Stock) || 0;

        return `
            <tr>
                <td><code>${escapeHtml(producto.CodigoProducto || "")}</code></td>
                <td><strong>${escapeHtml(producto.Nombre || "Sin nombre")}</strong></td>
                <td><span class="badge-categoria">${escapeHtml(producto.Categoria || "Sin categoría")}</span></td>
                <td class="celda-numero">${formatoCordobas(producto.Precio)}</td>
                <td class="celda-numero"><strong>${formatoNumero(stock)}</strong> unid.</td>
                <td class="celda-numero">${formatoNumero(stockMinimoProducto(producto))} unid.</td>
                <td>${estadoStockHtml(producto)}</td>
            </tr>
        `;
    }).join("");

    modalCuerpoEl.innerHTML = `
        <div class="modal-mini-stats">
            <div class="modal-mini-stat">
                <span>Referencias en alerta</span>
                <strong>${formatoNumero(afectados.length)}</strong>
            </div>
            <div class="modal-mini-stat">
                <span>Unidades disponibles</span>
                <strong>${formatoNumero(unidades)}</strong>
            </div>
            <div class="modal-mini-stat">
                <span>Categorías afectadas</span>
                <strong>${formatoNumero(categoriasAfectadas.length)}</strong>
            </div>
            <div class="modal-mini-stat">
                <span>Productos agotados</span>
                <strong>${formatoNumero(agotados)}</strong>
            </div>
        </div>

        <div class="modal-seccion">
            <div class="modal-seccion-titulo">
                <span>Productos en alerta por categoría</span>
            </div>
            ${htmlGraficoBarrasDashboard(itemsCategorias, {
                formato: valor => `${formatoNumero(valor)} producto${Number(valor) === 1 ? "" : "s"}`,
                compacto: valor => String(Math.round(Number(valor) || 0))
            })}
            <p class="modal-nota">
                Se consideran productos con stock disponible igual o inferior a su stock mínimo configurado. Los agotados se detallan en su propia tarjeta.
            </p>
        </div>

        <div class="modal-seccion">
            <div class="modal-seccion-titulo">
                <span>Productos por reponer</span>
                <span>${formatoNumero(visibles.length)} registro${visibles.length === 1 ? "" : "s"}</span>
            </div>

            ${visibles.length === 0
                ? estadoVacioModal("bi-search", "Sin resultados", "Ningún producto coincide con la categoría seleccionada.")
                : `
                    <div class="modal-tabla-scroll">
                        <table class="tabla-amplia">
                            <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Producto</th>
                                    <th>Categoría</th>
                                    <th class="celda-numero">Precio</th>
                                    <th class="celda-numero">Stock</th>
                                    <th class="celda-numero">Mínimo</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>${filas}</tbody>
                        </table>
                    </div>
                `}
        </div>
    `;
}

function abrirModalAgotados(valores) {
    prepararModal(
        "Productos Agotados",
        "Referencias sin existencias y categorías afectadas",
        ""
    );

    const productos = productosParaAnalisis();
    const agotados = productos.filter(producto => (Number(producto.Stock) || 0) <= 0);

    const opciones = categoriasUnicas(agotados)
        .map(nombre => `<option value="${escapeHtml(nombre)}">${escapeHtml(nombre)}</option>`)
        .join("");

    modalFiltrosEl.hidden = agotados.length === 0;
    modalFiltrosEl.innerHTML = agotados.length === 0
        ? ""
        : `
            <label>Categoría
                <select id="filtroAgotadosCategoria">
                    <option value="">Todas las categorías</option>
                    ${opciones}
                </select>
            </label>
        `;

    const campoCategoria = document.getElementById("filtroAgotadosCategoria");
    if (campoCategoria) {
        campoCategoria.addEventListener("change", () => {
            renderizarContenidoAgotados(agotados, productos, campoCategoria.value);
        });
    }

    renderizarContenidoAgotados(agotados, productos, valores.filtroAgotadosCategoria || "");
}

function renderizarContenidoAgotados(agotados, productos, categoria) {
    if (agotados.length === 0) {
        modalCuerpoEl.innerHTML = estadoVacioModal(
            "bi-check2-circle",
            "Sin productos agotados",
            "Todas las referencias del catálogo cuentan con existencias."
        );
        return;
    }

    const categoriaNormalizada = normalizarBusqueda(categoria);
    const visibles = agotados.filter(producto => {
        if (!categoriaNormalizada) return true;
        const nombreCategoria = String(producto.Categoria || "").trim() || "Sin categoría";
        return normalizarBusqueda(nombreCategoria) === categoriaNormalizada;
    });

    const categoriasAfectadas = categoriasUnicas(agotados);
    const unidadesCatalogo = productos.reduce((suma, producto) => suma + (Number(producto.Stock) || 0), 0);

    const itemsCategorias = agruparProductosPorCategoria(agotados).map(item => ({
        etiqueta: item.nombre,
        valor: item.productos,
        detalle: `${formatoNumero(item.productos)} sin existencias`
    }));

    const filas = visibles.map(producto => `
        <tr>
            <td><code>${escapeHtml(producto.CodigoProducto || "")}</code></td>
            <td><strong>${escapeHtml(producto.Nombre || "Sin nombre")}</strong></td>
            <td><span class="badge-categoria">${escapeHtml(producto.Categoria || "Sin categoría")}</span></td>
            <td class="celda-numero">${formatoCordobas(producto.Precio)}</td>
            <td class="celda-numero"><strong>0</strong> unid.</td>
            <td>${estadoStockHtml(producto)}</td>
        </tr>
    `).join("");

    modalCuerpoEl.innerHTML = `
        <div class="modal-mini-stats">
            <div class="modal-mini-stat">
                <span>Referencias agotadas</span>
                <strong>${formatoNumero(agotados.length)}</strong>
            </div>
            <div class="modal-mini-stat">
                <span>Categorías afectadas</span>
                <strong>${formatoNumero(categoriasAfectadas.length)}</strong>
            </div>
            <div class="modal-mini-stat">
                <span>Referencias del catálogo</span>
                <strong>${formatoNumero(productos.length)}</strong>
            </div>
            <div class="modal-mini-stat">
                <span>Unidades totales en stock</span>
                <strong>${formatoNumero(Math.max(unidadesCatalogo, 0))}</strong>
            </div>
        </div>

        <div class="modal-seccion">
            <div class="modal-seccion-titulo">
                <span>Productos agotados por categoría</span>
            </div>
            ${htmlGraficoBarrasDashboard(itemsCategorias, {
                formato: valor => `${formatoNumero(valor)} producto${Number(valor) === 1 ? "" : "s"}`,
                compacto: valor => String(Math.round(Number(valor) || 0))
            })}
        </div>

        <div class="modal-seccion">
            <div class="modal-seccion-titulo">
                <span>Referencias sin existencias</span>
                <span>${formatoNumero(visibles.length)} registro${visibles.length === 1 ? "" : "s"}</span>
            </div>

            ${visibles.length === 0
                ? estadoVacioModal("bi-search", "Sin resultados", "Ningún producto coincide con la categoría seleccionada.")
                : `
                    <div class="modal-tabla-scroll">
                        <table class="tabla-amplia">
                            <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Producto</th>
                                    <th>Categoría</th>
                                    <th class="celda-numero">Precio</th>
                                    <th class="celda-numero">Stock</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>${filas}</tbody>
                        </table>
                    </div>
                `}
        </div>
    `;
}


// ==========================================
// RENDERIZAR TOP PRODUCTOS MÁS VENDIDOS
// ==========================================

function renderizarTopProductos(productos) {
    const listaEl = document.getElementById("listaTopProductos");
    if (!listaEl) return;

    if (!Array.isArray(productos) || productos.length === 0) {
        listaEl.innerHTML = `
            <div class="top-productos-vacio">
                <i class="bi bi-box2"></i>
                <p>Las estadísticas de productos más vendidos se construirán conforme se emitan facturas.</p>
            </div>
        `;
        return;
    }

    let html = "";
    productos.slice(0, 5).forEach((p, index) => {
        const medalla = index === 0 ? "oro" : index === 1 ? "plata" : index === 2 ? "bronce" : "normal";
        const cantidad = Number(p.CantidadVendida || 0);
        const recaudado = formatoCordobas(p.TotalRecaudado);

        html += `
            <div class="item-top-producto">
                <div class="posicion-medalla ${medalla}">${index + 1}</div>
                <div class="top-prod-detalles">
                    <strong class="top-prod-nombre">${escapeHtml(p.Nombre || p.CodigoProducto)}</strong>
                    <span class="top-prod-categoria">${escapeHtml(p.Categoria || "Souvenirs")}</span>
                </div>
                <div class="top-prod-cifras">
                    <span class="top-prod-unidades">${formatoNumero(cantidad)} unid.</span>
                    <strong class="top-prod-recaudado">${recaudado}</strong>
                </div>
            </div>
        `;
    });

    listaEl.innerHTML = html;
}


// ==========================================
// CONTROL DE ACCESO VISUAL POR ROL
// ==========================================

function aplicarReglasDeRol() {
    const esAdmin = esAdministrador();

    const elementosAdmin = [
        "tarjetaVentasHoy",
        "tarjetaVentasMes",
        "tarjetaTicketPromedio",
        "seccionAnalisisFinanciero",
        "seccionVentasRecientes"
    ];

    elementosAdmin.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.display = esAdmin ? "" : "none";
        }
    });

    const gridKpis = document.querySelector(".kpi-bento-grid");
    if (gridKpis) {
        if (!esAdmin) {
            gridKpis.classList.add("kpi-vendedor-grid");
        } else {
            gridKpis.classList.remove("kpi-vendedor-grid");
        }
    }

    if (!esAdmin) {
        const tarjetaFacturas = document.getElementById("tarjetaTotalFacturas");
        if (tarjetaFacturas) {
            tarjetaFacturas.removeAttribute("data-modal-dashboard");
            tarjetaFacturas.removeAttribute("role");
            tarjetaFacturas.removeAttribute("tabindex");
            tarjetaFacturas.removeAttribute("aria-haspopup");
            tarjetaFacturas.removeAttribute("title");
            tarjetaFacturas.classList.remove("kpi-interactivo");
            const pista = tarjetaFacturas.querySelector(".kpi-ver-detalle");
            if (pista) pista.remove();
        }
    }
}


// ==========================================
// ACTUALIZACIÓN GLOBAL Y SINCRONIZACIÓN
// ==========================================

let actualizando = false;

async function actualizarDashboard() {
    if (actualizando) return;
    actualizando = true;

    const btnRecarga = document.getElementById("btnActualizarDashboard");
    const iconoRecarga = document.getElementById("iconoRecarga");

    if (btnRecarga) btnRecarga.disabled = true;
    if (iconoRecarga) iconoRecarga.classList.add("spin");

    try {
        actualizarEncabezadoFecha();

        await Promise.allSettled([
            cargarEstadisticas(),
            cargarVentasRecientes(),
            cargarAlertasInventario(),
            cargarProductosDashboard(),
            cargarClientesDashboard()
        ]);

        registrarHoraSincronizacion();

    } finally {
        actualizando = false;
        if (btnRecarga) btnRecarga.disabled = false;
        if (iconoRecarga) iconoRecarga.classList.remove("spin");
    }
}


// ==========================================
// SEGURIDAD DE CADENAS HTML
// ==========================================

function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ==========================================
// INICIALIZACIÓN DEL DASHBOARD
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    // 1. Verificar sesión activa
    const token = sessionStorage.getItem("token");
    if (!token) {
        window.location.replace("index.html");
        return;
    }

    // 2. Aplicar permisos de rol
    aplicarReglasDeRol();

    // 3. Cargar datos iniciales
    actualizarDashboard();

    // 4. Configurar botón de actualización manual
    const btnRecarga = document.getElementById("btnActualizarDashboard");
    if (btnRecarga) {
        btnRecarga.addEventListener("click", () => {
            actualizarDashboard();
        });
    }

    // 5. Configurar tarjetas interactivas y modal de detalle
    document.querySelectorAll("[data-modal-dashboard]").forEach(disparador => {
        disparador.addEventListener("click", () => {
            abrirModalDashboard(disparador.dataset.modalDashboard);
        });

        disparador.addEventListener("keydown", evento => {
            if (evento.key === "Enter" || evento.key === " ") {
                evento.preventDefault();
                abrirModalDashboard(disparador.dataset.modalDashboard);
            }
        });
    });

    const listaDistribucion = document.getElementById("distribucionLista");
    if (listaDistribucion) {
        listaDistribucion.addEventListener("click", evento => {
            const botonCategoria = evento.target.closest("[data-categoria-distribucion]");

            if (botonCategoria) {
                distribucionCategoriaActiva = botonCategoria.dataset.categoriaDistribucion;
                renderizarDistribucionInventario();
                return;
            }

            if (evento.target.closest(".distribucion-volver")) {
                distribucionCategoriaActiva = null;
                renderizarDistribucionInventario();
            }
        });
    }

    document.querySelectorAll("[data-cerrar-modal-dashboard]").forEach(cerrar => {
        cerrar.addEventListener("click", cerrarModalDashboard);
    });

    const btnVolverModal = document.getElementById("modalDashboardVolver");
    if (btnVolverModal) {
        btnVolverModal.addEventListener("click", () => {
            if (typeof modalDashboardRetorno === "function") {
                modalDashboardRetorno();
            }
        });
    }

    const cuerpoModal = document.getElementById("modalDashboardCuerpo");
    if (cuerpoModal) {
        cuerpoModal.addEventListener("click", evento => {
            const fila = evento.target.closest("[data-id-factura]");
            if (fila) {
                abrirDetalleFactura(Number(fila.dataset.idFactura));
            }
        });

        cuerpoModal.addEventListener("keydown", evento => {
            if (evento.key !== "Enter" && evento.key !== " ") return;

            const fila = evento.target.closest("[data-id-factura]");
            if (fila) {
                evento.preventDefault();
                abrirDetalleFactura(Number(fila.dataset.idFactura));
            }
        });
    }

    document.addEventListener("keydown", evento => {
        if (evento.key === "Escape" && modalContenedorEl && !modalContenedorEl.hidden) {
            cerrarModalDashboard();
        }
    });

    // 6. Actualizar automáticamente cada 30 segundos
    setInterval(() => {
        if (!document.hidden) {
            actualizarDashboard();
        }
    }, 30000);

    // 6. Actualizar al regresar a la pestaña
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            actualizarDashboard();
        }
    });
});
