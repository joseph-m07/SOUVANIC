"use strict";

// ========================================
// FACTURACIÓN: VENTAS, PAGOS E HISTORIAL
// ========================================

const esAdminFacturacion = esAdministrador();

// ── Elementos del formulario ──

const facturaClienteBusqueda = document.getElementById("facturaClienteBusqueda");
const facturaCliente = document.getElementById("facturaCliente");

const btnClienteRapido = document.getElementById("btnClienteRapido");
const formClienteRapido = document.getElementById("formClienteRapido");
const nuevoClienteId = document.getElementById("nuevoClienteId");
const nuevoClienteNombre = document.getElementById("nuevoClienteNombre");
const nuevoClienteTelefono = document.getElementById("nuevoClienteTelefono");
const nuevoClienteCorreo = document.getElementById("nuevoClienteCorreo");
const nuevoClienteDireccion = document.getElementById("nuevoClienteDireccion");
const btnGuardarClienteRapido = document.getElementById("btnGuardarClienteRapido");
const btnCancelarClienteRapido = document.getElementById("btnCancelarClienteRapido");
const clienteRapidoError = document.getElementById("clienteRapidoError");

const facturaProductoBusqueda = document.getElementById("facturaProductoBusqueda");
const menuDesplegableProductos = document.getElementById("menuDesplegableProductos");
const btnLimpiarBusquedaProducto = document.getElementById("btnLimpiarBusquedaProducto");
const listaProductosFactura = document.getElementById("listaProductosFactura");
const infoProductoFactura = document.getElementById("infoProductoFactura");
const facturaCantidad = document.getElementById("facturaCantidad");
const agregarProductoFactura = document.getElementById("agregarProductoFactura");

let indiceProductoResaltado = -1;
let cargandoCatalogoProductos = false;

const detalleFacturaBody = document.getElementById("detalleFacturaBody");
const tablaDetalleFacturaFormulario = document.querySelector(".tabla-detalle-factura");

const subtotalFactura = document.getElementById("subtotalFactura");
const descuentoProductosFactura = document.getElementById("descuentoProductosFactura");
const descuentoGeneralFactura = document.getElementById("descuentoGeneralFactura");
const bloqueDescuentoGeneral = document.getElementById("bloqueDescuentoGeneral");
const descuentoGeneralAplicado = document.getElementById("descuentoGeneralAplicado");
const baseImponibleFactura = document.getElementById("baseImponibleFactura");
const impuestoFactura = document.getElementById("impuestoFactura");
const bloqueImpuesto = document.getElementById("bloqueImpuesto");
const montoImpuestoFactura = document.getElementById("montoImpuestoFactura");
const totalFactura = document.getElementById("totalFactura");

const pagoMetodo = document.getElementById("pagoMetodo");
const pagoMonto = document.getElementById("pagoMonto");
const pagoMontoRecibido = document.getElementById("pagoMontoRecibido");
const campoMontoRecibido = document.getElementById("campoMontoRecibido");
const pagoBancoTarjeta = document.getElementById("pagoBancoTarjeta");
const campoBancoTarjeta = document.getElementById("campoBancoTarjeta");
const pagoBancoOrigen = document.getElementById("pagoBancoOrigen");
const campoBancoOrigen = document.getElementById("campoBancoOrigen");
const pagoBancoDestino = document.getElementById("pagoBancoDestino");
const campoBancoDestino = document.getElementById("campoBancoDestino");
const pagoCuentaDestino = document.getElementById("pagoCuentaDestino");
const campoCuentaDestino = document.getElementById("campoCuentaDestino");
const pagoReferencia = document.getElementById("pagoReferencia");
const campoReferencia = document.getElementById("campoReferencia");
const pagoObservaciones = document.getElementById("pagoObservaciones");
const btnAgregarPago = document.getElementById("btnAgregarPago");
const pagosFacturaLista = document.getElementById("pagosFacturaLista");

const totalPagadoFactura = document.getElementById("totalPagadoFactura");
const saldoFactura = document.getElementById("saldoFactura");
const vueltoFactura = document.getElementById("vueltoFactura");
const estadoPagoFactura = document.getElementById("estadoPagoFactura");

const guardarFactura = document.getElementById("guardarFactura");
const guardarEImprimirFactura = document.getElementById("guardarEImprimirFactura");
const btnLimpiarFactura = document.getElementById("btnLimpiarFactura");

// ── Historial ──

const filtroFacturaBuscar = document.getElementById("filtroFacturaBuscar");
const filtroFacturaDesde = document.getElementById("filtroFacturaDesde");
const filtroFacturaHasta = document.getElementById("filtroFacturaHasta");
const filtroFacturaEstado = document.getElementById("filtroFacturaEstado");
const filtroFacturaMetodo = document.getElementById("filtroFacturaMetodo");
const filtroFacturaResponsable = document.getElementById("filtroFacturaResponsable");
const filtroFacturaOrden = document.getElementById("filtroFacturaOrden");
const btnLimpiarFiltrosFacturas = document.getElementById("btnLimpiarFiltrosFacturas");
const btnExportarFacturas = document.getElementById("btnExportarFacturas");
const historialFacturasBody = document.getElementById("historialFacturasBody");
const contadorFacturas = document.getElementById("contadorFacturas");
const paginacionFacturas = document.getElementById("paginacionFacturas");

// ── Modal de detalle ──

const modalDetalleFactura = document.getElementById("modalDetalleFactura");
const cerrarDetalleFactura = document.getElementById("cerrarDetalleFactura");
const imprimirFactura = document.getElementById("imprimirFactura");
const imprimirVoucher = document.getElementById("imprimirVoucher");
const abrirModalVoucher = document.getElementById("abrirModalVoucher");
const cerrarModalVoucher = document.getElementById("cerrarModalVoucher");
const modalVoucherFactura = document.getElementById("modalVoucherFactura");
const voucherFacturaContenedor = document.getElementById("voucherFacturaContenedor");

const numeroFacturaDetalle = document.getElementById("numeroFacturaDetalle");
const estadoDetalleFactura = document.getElementById("estadoDetalleFactura");
const clienteDetalleFactura = document.getElementById("clienteDetalleFactura");
const fechaDetalleFactura = document.getElementById("fechaDetalleFactura");
const responsableDetalleFactura = document.getElementById("responsableDetalleFactura");
const metodoDetalleFactura = document.getElementById("metodoDetalleFactura");
const pagadoDetalleFactura = document.getElementById("pagadoDetalleFactura");
const saldoDetalleFactura = document.getElementById("saldoDetalleFactura");
const anulacionDetalleFactura = document.getElementById("anulacionDetalleFactura");
const textoAnulacionDetalle = document.getElementById("textoAnulacionDetalle");
const tablaDetalleFactura = document.getElementById("tablaDetalleFactura");
const resumenTotalesDetalle = document.getElementById("resumenTotalesDetalle");
const pagosDetalleFactura = document.getElementById("pagosDetalleFactura");

const bloqueAnularFactura = document.getElementById("bloqueAnularFactura");
const btnAnularFactura = document.getElementById("btnAnularFactura");
const confirmacionAnulacion = document.getElementById("confirmacionAnulacion");
const motivoAnulacionFactura = document.getElementById("motivoAnulacionFactura");
const confirmarAnulacionFactura = document.getElementById("confirmarAnulacionFactura");
const cancelarAnulacionFactura = document.getElementById("cancelarAnulacionFactura");

// ========================================
// ESTADO
// ========================================

const METODOS_PAGO_UI = ["Efectivo", "Tarjeta", "Transferencia"];
const BANCOS_TARJETA_UI = ["BAC", "LAFISE", "BANPRO"];
const FACTURAS_POR_PAGINA = 10;

let productosDisponibles = [];
let clientesFacturacion = [];
let detalleFactura = [];
let pagosFactura = [];
let facturasHistorial = [];
let facturasFiltradas = [];
let paginaFacturas = 1;
let facturaDetalleActual = null;
let claveIdempotenciaFactura = generarClaveIdempotencia();
let registrandoFactura = false;
let guardandoClienteRapido = false;
let cargandoHistorial = false;
let anulandoFactura = false;
let temporizadorBusquedaCliente = null;
let temporizadorBusquedaProducto = null;

// ========================================
// UTILIDADES
// ========================================

function redondearMoneda(valor) {
    return Math.round((Number(valor) + Number.EPSILON) * 100) / 100;
}

function formatearMoneda(valor) {
    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
        return "0.00";
    }

    return numero.toLocaleString("es-NI", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function normalizarTexto(valor) {
    return String(valor ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

function claveDiaLocal(fecha) {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");
    return `${anio}-${mes}-${dia}`;
}

function formatearFechaHora(valor) {
    const fecha = new Date(valor);

    if (Number.isNaN(fecha.getTime())) {
        return "—";
    }

    return fecha.toLocaleString("es-NI", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function generarClaveIdempotencia() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID().replace(/-/g, "");
    }

    return `fact-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function esFacturaAnulada(factura) {
    return normalizarTexto(factura?.Estado) === "anulada";
}

function etiquetaEstadoFactura(estado) {
    const clave = normalizarTexto(estado);

    if (clave === "pagada") return { texto: "Pagada", clase: "status-pagada" };
    if (clave === "anulada") return { texto: "Anulada", clase: "status-anulada" };
    if (clave === "pendiente") return { texto: "Pendiente", clase: "status-pendiente" };
    return { texto: estado || "Registrada", clase: "status-registrada" };
}

function crearBadgeEstado(estado) {
    const info = etiquetaEstadoFactura(estado);
    const badge = document.createElement("span");

    badge.className = `status ${info.clase}`;
    badge.textContent = info.texto;

    return badge;
}

function buscarProductoPorCodigo(codigo) {
    return productosDisponibles.find(producto =>
        String(producto.CodigoProducto) === String(codigo)
    ) || null;
}

function stockMinimoProducto(producto) {
    const minimo = Number(producto?.StockMinimo);
    return Number.isFinite(minimo) && minimo >= 0 ? minimo : 0;
}

function estadoStockProducto(producto) {
    const stock = Number(producto?.Stock) || 0;

    if (!producto?.Activo) {
        return { texto: "Inactivo", clase: "agotado" };
    }

    if (stock <= 0) {
        return { texto: "Agotado", clase: "agotado" };
    }

    if (stock <= stockMinimoProducto(producto)) {
        return { texto: "Stock bajo", clase: "bajo" };
    }

    return { texto: "Disponible", clase: "disponible" };
}

function etiquetaProducto(producto) {
    return [
        producto.Nombre,
        producto.CodigoProducto,
        `C$ ${formatearMoneda(producto.Precio)}`,
        `Stock ${producto.Stock}`
    ].join(" · ");
}

function resolverProducto(texto) {
    const consulta = normalizarTexto(texto);

    if (!consulta) {
        return null;
    }

    const porEtiqueta = productosDisponibles.find(producto =>
        normalizarTexto(etiquetaProducto(producto)) === consulta
    );

    if (porEtiqueta) {
        return porEtiqueta;
    }

    const porCodigo = productosDisponibles.find(producto =>
        normalizarTexto(producto.CodigoProducto) === consulta
    );

    if (porCodigo) {
        return porCodigo;
    }

    const porNombre = productosDisponibles.filter(producto =>
        normalizarTexto(producto.Nombre) === consulta
    );

    if (porNombre.length === 1) {
        return porNombre[0];
    }

    const coincidencias = productosDisponibles.filter(producto =>
        normalizarTexto(producto.Nombre).includes(consulta) ||
        normalizarTexto(producto.CodigoProducto).includes(consulta)
    );

    return coincidencias.length === 1 ? coincidencias[0] : null;
}

// ========================================
// CLIENTES
// ========================================

function opcionCliente(cliente) {
    const opcion = document.createElement("option");
    opcion.value = cliente.IdCliente;
    opcion.textContent = `${cliente.Nombre} — ${cliente.IdCliente}`;
    return opcion;
}

function aplicarFiltroClientes(idSeleccionado = null) {
    const consulta = normalizarTexto(facturaClienteBusqueda.value);
    const seleccion = idSeleccionado ?? facturaCliente.value;

    facturaCliente.innerHTML = "";
    facturaCliente.appendChild(new Option("Seleccione un cliente", ""));

    const visibles = clientesFacturacion
        .filter(cliente =>
            !consulta ||
            normalizarTexto(cliente.Nombre).includes(consulta) ||
            normalizarTexto(cliente.IdCliente).includes(consulta)
        )
        .sort((a, b) => String(a.Nombre).localeCompare(String(b.Nombre), "es"));

    visibles.forEach(cliente => {
        facturaCliente.appendChild(opcionCliente(cliente));
    });

    const existe = visibles.some(cliente =>
        String(cliente.IdCliente) === String(seleccion)
    );

    facturaCliente.value = existe ? seleccion : "";
}

async function cargarClientes(idSeleccionado = null) {
    try {
        const respuesta = await fetchAutenticado("/clientes");

        if (!respuesta.ok) {
            throw new Error("No se pudieron obtener los clientes.");
        }

        const datos = await respuesta.json();

        clientesFacturacion = Array.isArray(datos) ? datos : [];
        aplicarFiltroClientes(idSeleccionado);

    } catch (error) {
        console.error("Error al cargar clientes:", error);
        SouvanicUI.notificar(
            "No se pudieron cargar los clientes desde SQL Server.",
            "error"
        );
    }
}

function mostrarErrorClienteRapido(mensaje) {
    clienteRapidoError.textContent = mensaje;
    clienteRapidoError.hidden = !mensaje;
}

function abrirClienteRapido() {
    if (registrandoFactura) return;

    formClienteRapido.hidden = false;
    btnClienteRapido.setAttribute("aria-expanded", "true");
    mostrarErrorClienteRapido("");
    nuevoClienteId.focus();
}

function cerrarClienteRapido() {
    formClienteRapido.hidden = true;
    formClienteRapido.reset();
    mostrarErrorClienteRapido("");
    btnClienteRapido.setAttribute("aria-expanded", "false");
}

btnClienteRapido?.addEventListener("click", function() {
    if (formClienteRapido.hidden) {
        abrirClienteRapido();
    } else {
        cerrarClienteRapido();
    }
});

btnCancelarClienteRapido?.addEventListener("click", cerrarClienteRapido);

formClienteRapido?.addEventListener("submit", async function(event) {

    event.preventDefault();

    if (registrandoFactura || guardandoClienteRapido) return;

    const id = nuevoClienteId.value.trim();
    const nombre = nuevoClienteNombre.value.trim();
    const telefono = nuevoClienteTelefono.value.trim();
    const correo = nuevoClienteCorreo.value.trim();
    const direccion = nuevoClienteDireccion.value.trim();

    const camposObligatorios = [
        { valor: id, input: nuevoClienteId, nombre: "ID del cliente" },
        { valor: nombre, input: nuevoClienteNombre, nombre: "nombre" },
        { valor: telefono, input: nuevoClienteTelefono, nombre: "teléfono" }
    ];

    const faltante = camposObligatorios.find(campo => !campo.valor);

    if (faltante) {
        mostrarErrorClienteRapido(`Completá el campo ${faltante.nombre}.`);
        faltante.input.focus();
        return;
    }

    if (
        id.length > 29 ||
        nombre.length > 100 ||
        telefono.length > 20 ||
        (correo && correo.length > 100) ||
        (direccion && direccion.length > 200)
    ) {
        mostrarErrorClienteRapido("Uno de los campos supera la longitud permitida.");
        return;
    }

    if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
        mostrarErrorClienteRapido("Ingresá un correo electrónico válido o dejalo vacío.");
        nuevoClienteCorreo.focus();
        return;
    }

    const duplicado = clientesFacturacion.some(cliente =>
        normalizarTexto(cliente.IdCliente) === normalizarTexto(id)
    );

    if (duplicado) {
        mostrarErrorClienteRapido("Ya existe un cliente con ese ID.");
        nuevoClienteId.focus();
        return;
    }

    guardandoClienteRapido = true;
    btnGuardarClienteRapido.disabled = true;
    btnClienteRapido.disabled = true;

    try {
        const respuesta = await fetchAutenticado("/clientes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id,
                name: nombre,
                phone: telefono,
                email: correo,
                address: direccion
            })
        });

        let datos = {};

        try {
            datos = await respuesta.json();
        } catch (error) {
            datos = {};
        }

        if (!respuesta.ok) {
            throw new Error(datos.mensaje || "No se pudo registrar el cliente.");
        }

        facturaClienteBusqueda.value = "";
        await cargarClientes(id);
        cerrarClienteRapido();

        SouvanicUI.notificar(
            `Cliente "${nombre}" registrado y seleccionado para la factura.`,
            "success"
        );

        facturaCliente.focus();

    } catch (error) {
        console.error("Error al registrar cliente:", error);
        mostrarErrorClienteRapido(error.message);
    } finally {
        guardandoClienteRapido = false;
        btnGuardarClienteRapido.disabled = false;
        btnClienteRapido.disabled = registrandoFactura;
    }
});

facturaClienteBusqueda?.addEventListener("input", function() {
    window.clearTimeout(temporizadorBusquedaCliente);
    temporizadorBusquedaCliente = window.setTimeout(function() {
        aplicarFiltroClientes();
    }, 180);
});

// ========================================
// PRODUCTOS
// ========================================

function actualizarListaProductos() {
    if (listaProductosFactura) {
        listaProductosFactura.innerHTML = "";

        productosDisponibles
            .filter(producto => producto.Activo)
            .slice()
            .sort((a, b) => String(a.Nombre).localeCompare(String(b.Nombre), "es"))
            .forEach(producto => {
                const opcion = document.createElement("option");
                opcion.value = etiquetaProducto(producto);
                opcion.label = `${producto.CodigoProducto} · ${producto.Categoria || "Sin categoría"}`;
                listaProductosFactura.appendChild(opcion);
            });
    }
}

function abrirDesplegableProductos() {
    if (!menuDesplegableProductos) return;
    menuDesplegableProductos.hidden = false;
    facturaProductoBusqueda.setAttribute("aria-expanded", "true");
}

function escapeHtml(texto) {
    return String(texto ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function cerrarDesplegableProductos() {
    if (!menuDesplegableProductos) return;
    menuDesplegableProductos.hidden = true;
    facturaProductoBusqueda.setAttribute("aria-expanded", "false");
    indiceProductoResaltado = -1;
}

function resaltarElementoDesplegable(nuevoIndice) {
    if (!menuDesplegableProductos || menuDesplegableProductos.hidden) return;
    const items = menuDesplegableProductos.querySelectorAll(".producto-resultado-item");
    if (!items.length) return;

    items.forEach(it => it.classList.remove("item-activo"));

    if (nuevoIndice < 0) nuevoIndice = items.length - 1;
    if (nuevoIndice >= items.length) nuevoIndice = 0;

    indiceProductoResaltado = nuevoIndice;
    const itemActivo = items[indiceProductoResaltado];
    if (itemActivo) {
        itemActivo.classList.add("item-activo");
        itemActivo.scrollIntoView({ block: "nearest" });
    }
}

function renderizarMenuProductos(termino = "") {
    if (!menuDesplegableProductos) return;

    if (cargandoCatalogoProductos) {
        menuDesplegableProductos.innerHTML = `
            <div class="producto-resultado-estado">
                <i class="bi bi-arrow-repeat girando" aria-hidden="true"></i>
                <span>Cargando catálogo de productos...</span>
            </div>
        `;
        abrirDesplegableProductos();
        return;
    }

    const consulta = normalizarTexto(termino);
    const activos = productosDisponibles.filter(p => p.Activo);

    let filtrados = activos;
    if (consulta) {
        filtrados = activos.filter(producto => {
            const nom = normalizarTexto(producto.Nombre);
            const cod = normalizarTexto(producto.CodigoProducto);
            const cat = normalizarTexto(producto.Categoria || "");
            return nom.includes(consulta) || cod.includes(consulta) || cat.includes(consulta);
        });
    } else {
        filtrados = activos.slice(0, 10);
    }

    if (filtrados.length === 0) {
        menuDesplegableProductos.innerHTML = `
            <div class="producto-resultado-vacio">
                <i class="bi bi-search" aria-hidden="true"></i>
                <strong>No se encontraron productos</strong>
                <span>No hay coincidencias para "<strong>${escapeHtml(termino)}</strong>". Probá con otro código o nombre.</span>
            </div>
        `;
        abrirDesplegableProductos();
        return;
    }

    menuDesplegableProductos.innerHTML = "";

    const cabecera = document.createElement("div");
    cabecera.className = "producto-resultado-header";
    cabecera.innerHTML = consulta
        ? `<span>Resultados coincidentes (${filtrados.length})</span>`
        : `<span>Sugerencias de productos (${activos.length} disponibles)</span>`;
    menuDesplegableProductos.appendChild(cabecera);

    filtrados.forEach((producto, index) => {
        const item = document.createElement("div");
        item.className = "producto-resultado-item";
        item.setAttribute("role", "option");
        item.setAttribute("data-codigo", producto.CodigoProducto);
        item.tabIndex = -1;

        const stockNum = Number(producto.Stock) || 0;
        let badgeStockClass = "badge-stock-disponible";
        let badgeStockIcon = "bi-check-circle-fill";
        let badgeStockText = `${stockNum} disponibles`;

        if (stockNum <= 0) {
            badgeStockClass = "badge-stock-agotado";
            badgeStockIcon = "bi-x-circle-fill";
            badgeStockText = "Agotado";
        } else if (stockNum <= stockMinimoProducto(producto)) {
            badgeStockClass = "badge-stock-bajo";
            badgeStockIcon = "bi-exclamation-triangle-fill";
            badgeStockText = `Stock bajo (${stockNum})`;
        }

        item.innerHTML = `
            <div class="producto-resultado-icono">
                <i class="bi bi-box-seam" aria-hidden="true"></i>
            </div>
            <div class="producto-resultado-cuerpo">
                <div class="producto-resultado-titulo">
                    <span class="producto-nombre">${escapeHtml(producto.Nombre)}</span>
                    <span class="producto-codigo-badge">${escapeHtml(producto.CodigoProducto)}</span>
                    ${producto.Categoria ? `<span class="producto-categoria-badge">${escapeHtml(producto.Categoria)}</span>` : ""}
                </div>
                <div class="producto-resultado-meta">
                    <span class="badge-stock ${badgeStockClass}">
                        <i class="bi ${badgeStockIcon}" aria-hidden="true"></i>
                        ${badgeStockText}
                    </span>
                </div>
            </div>
            <div class="producto-resultado-precio">
                <small>Precio unitario</small>
                <strong>C$ ${formatearMoneda(producto.Precio)}</strong>
            </div>
        `;

        item.addEventListener("mousedown", (e) => {
            e.preventDefault();
            seleccionarProductoDesdeDesplegable(producto);
        });

        item.addEventListener("mouseenter", () => {
            const items = menuDesplegableProductos.querySelectorAll(".producto-resultado-item");
            items.forEach(it => it.classList.remove("item-activo"));
            item.classList.add("item-activo");
            indiceProductoResaltado = index;
        });

        menuDesplegableProductos.appendChild(item);
    });

    indiceProductoResaltado = -1;
    abrirDesplegableProductos();
}

function seleccionarProductoDesdeDesplegable(producto) {
    if (!producto) return;
    facturaProductoBusqueda.value = producto.Nombre;
    if (btnLimpiarBusquedaProducto) {
        btnLimpiarBusquedaProducto.hidden = false;
    }
    cerrarDesplegableProductos();
    mostrarInfoProducto(producto);
    facturaCantidad.value = 1;
    facturaCantidad.focus();
    facturaCantidad.select();
}

if (btnLimpiarBusquedaProducto) {
    btnLimpiarBusquedaProducto?.addEventListener("click", () => {
        facturaProductoBusqueda.value = "";
        btnLimpiarBusquedaProducto.hidden = true;
        infoProductoFactura.hidden = true;
        infoProductoFactura.innerHTML = "";
        cerrarDesplegableProductos();
        facturaProductoBusqueda.focus();
    });
}

async function cargarProductos() {
    cargandoCatalogoProductos = true;
    try {
        const respuesta = await fetchAutenticado("/productos");

        if (!respuesta.ok) {
            throw new Error("No se pudieron obtener los productos.");
        }

        const datos = await respuesta.json();

        productosDisponibles = Array.isArray(datos) ? datos : [];
        detalleFactura = detalleFactura.filter(item =>
            Boolean(buscarProductoPorCodigo(item.codigo))
        );

        actualizarListaProductos();
        mostrarDetalleFactura();
        renderizarCatalogoPOS();

        const productoActual = resolverProducto(facturaProductoBusqueda.value);

        if (productoActual) {
            mostrarInfoProducto(productoActual);
        }

    } catch (error) {
        console.error("Error al cargar productos:", error);
        SouvanicUI.notificar(
            "No se pudieron cargar los productos desde SQL Server.",
            "error"
        );
    } finally {
        cargandoCatalogoProductos = false;
    }
}

function mostrarInfoProducto(producto) {
    if (!producto) {
        infoProductoFactura.hidden = true;
        infoProductoFactura.innerHTML = "";
        return;
    }

    const estado = estadoStockProducto(producto);
    infoProductoFactura.innerHTML = "";

    const titulo = document.createElement("strong");
    titulo.className = "info-producto-titulo";
    titulo.textContent = producto.Nombre;

    const botonEstado = document.createElement("span");
    botonEstado.className = `info-producto-estado ${estado.clase}`;
    botonEstado.textContent = estado.texto;

    const datos = [
        ["Código", producto.CodigoProducto],
        ["Categoría", producto.Categoria || "Sin categoría"],
        ["Precio", `C$ ${formatearMoneda(producto.Precio)}`],
        ["Stock disponible", `${producto.Stock} unidades`],
        ["Stock mínimo", `${stockMinimoProducto(producto)} unidades`]
    ];

    infoProductoFactura.append(titulo, botonEstado);

    datos.forEach(([etiqueta, valor]) => {
        const bloque = document.createElement("div");
        bloque.className = "info-producto-dato";

        const nombre = document.createElement("span");
        nombre.textContent = etiqueta;

        const contenido = document.createElement("strong");
        contenido.textContent = valor;

        bloque.append(nombre, contenido);
        infoProductoFactura.appendChild(bloque);
    });

    infoProductoFactura.hidden = false;
}

facturaProductoBusqueda?.addEventListener("focus", function() {
    if (btnLimpiarBusquedaProducto) {
        btnLimpiarBusquedaProducto.hidden = !facturaProductoBusqueda.value.trim();
    }
    renderizarMenuProductos(facturaProductoBusqueda.value.trim());
});

facturaProductoBusqueda?.addEventListener("input", function() {
    if (btnLimpiarBusquedaProducto) {
        btnLimpiarBusquedaProducto.hidden = !facturaProductoBusqueda.value.trim();
    }
    window.clearTimeout(temporizadorBusquedaProducto);
    temporizadorBusquedaProducto = window.setTimeout(function() {
        renderizarMenuProductos(facturaProductoBusqueda.value.trim());
        mostrarInfoProducto(resolverProducto(facturaProductoBusqueda.value));
    }, 120);
});

document.addEventListener("click", function(event) {
    if (!event.target.closest(".buscador-producto-contenedor")) {
        cerrarDesplegableProductos();
    }
});

function agregarProducto() {

    if (registrandoFactura) return;

    const producto = resolverProducto(facturaProductoBusqueda.value);
    const cantidad = Number(facturaCantidad.value);

    if (!facturaProductoBusqueda.value.trim()) {
        SouvanicUI.notificar("Buscá y seleccioná un producto.", "warning");
        facturaProductoBusqueda.focus();
        return;
    }

    if (!producto) {
        SouvanicUI.notificar(
            "No se encontró el producto. Verificá el nombre o el código.",
            "warning"
        );
        facturaProductoBusqueda.focus();
        return;
    }

    if (!producto.Activo) {
        SouvanicUI.notificar(
            `El producto ${producto.Nombre} está inactivo y no se puede vender.`,
            "error"
        );
        return;
    }

    if (!Number.isInteger(cantidad) || cantidad <= 0) {
        SouvanicUI.notificar("Ingresá una cantidad válida mayor que cero.", "warning");
        facturaCantidad.focus();
        return;
    }

    const existente = detalleFactura.find(item => item.codigo === producto.CodigoProducto);
    const cantidadEnFactura = existente ? existente.cantidad : 0;
    const cantidadTotal = cantidad + cantidadEnFactura;
    const stockDisponible = Number(producto.Stock) || 0;

    if (cantidadTotal > stockDisponible) {
        SouvanicUI.notificar(
            `Stock insuficiente de ${producto.Nombre}. ` +
            `Stock disponible: ${stockDisponible}. ` +
            `Ya agregado: ${cantidadEnFactura}. ` +
            `Podés agregar como máximo: ${Math.max(0, stockDisponible - cantidadEnFactura)} unidades.`,
            "warning",
            { titulo: "Stock insuficiente", persistente: true }
        );
        return;
    }

    if (existente) {
        existente.cantidad = cantidadTotal;
    } else {
        detalleFactura.push({
            codigo: producto.CodigoProducto,
            nombre: producto.Nombre,
            categoria: producto.Categoria,
            precio: Number(producto.Precio),
            cantidad,
            descuento: 0
        });
    }

    mostrarDetalleFactura();

    facturaProductoBusqueda.value = "";
    if (btnLimpiarBusquedaProducto) {
        btnLimpiarBusquedaProducto.hidden = true;
    }
    cerrarDesplegableProductos();
    facturaCantidad.value = 1;
    infoProductoFactura.hidden = true;
    infoProductoFactura.innerHTML = "";
    facturaProductoBusqueda.focus();
}

agregarProductoFactura?.addEventListener("click", agregarProducto);

facturaProductoBusqueda?.addEventListener("keydown", function(event) {
    if (event.key === "ArrowDown") {
        event.preventDefault();
        if (menuDesplegableProductos && menuDesplegableProductos.hidden) {
            renderizarMenuProductos(facturaProductoBusqueda.value.trim());
        } else {
            resaltarElementoDesplegable(indiceProductoResaltado + 1);
        }
        return;
    }

    if (event.key === "ArrowUp") {
        event.preventDefault();
        if (menuDesplegableProductos && !menuDesplegableProductos.hidden) {
            resaltarElementoDesplegable(indiceProductoResaltado - 1);
        }
        return;
    }

    if (event.key === "Escape") {
        cerrarDesplegableProductos();
        return;
    }

    if (event.key === "Enter") {
        event.preventDefault();
        if (menuDesplegableProductos && !menuDesplegableProductos.hidden && indiceProductoResaltado >= 0) {
            const items = menuDesplegableProductos.querySelectorAll(".producto-resultado-item");
            const itemActivo = items[indiceProductoResaltado];
            if (itemActivo) {
                const cod = itemActivo.getAttribute("data-codigo");
                const prod = productosDisponibles.find(p => p.CodigoProducto === cod);
                if (prod) {
                    seleccionarProductoDesdeDesplegable(prod);
                    return;
                }
            }
        }
        cerrarDesplegableProductos();
        agregarProducto();
    }
});

facturaCantidad?.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        agregarProducto();
    }
});

// ========================================
// DETALLE Y TOTALES
// ========================================

function crearEntradaTabla(tipo, valor) {
    const entrada = document.createElement("input");
    entrada.type = "number";
    entrada.value = valor;
    entrada.className = "entrada-tabla";

    if (tipo === "cantidad") {
        entrada.min = "1";
        entrada.step = "1";
        entrada.dataset.campo = "cantidad";
        entrada.setAttribute("aria-label", "Cantidad");
    } else {
        entrada.min = "0";
        entrada.max = "100";
        entrada.step = "0.01";
        entrada.dataset.campo = "descuento";
        entrada.setAttribute("aria-label", "Descuento del producto");
    }

    return entrada;
}

function mostrarDetalleFactura() {
    if (!detalleFacturaBody) return;

    detalleFacturaBody.innerHTML = "";

    if (detalleFactura.length === 0) {
        const fila = document.createElement("tr");
        fila.className = "fila-detalle-vacia";

        const celda = document.createElement("td");
        celda.colSpan = 7;
        celda.textContent = "Todavía no agregaste productos a la factura.";

        fila.appendChild(celda);
        detalleFacturaBody.appendChild(fila);

        actualizarTotales();
        return;
    }

    detalleFactura.forEach((item, indice) => {

        const subtotalBruto = redondearMoneda(item.precio * item.cantidad);
        const descuentoLinea = redondearMoneda(
            subtotalBruto * ((Number(item.descuento) || 0) / 100)
        );

        const fila = document.createElement("tr");

        const celdaCodigo = document.createElement("td");
        celdaCodigo.textContent = item.codigo;

        const celdaNombre = document.createElement("td");
        celdaNombre.textContent = item.nombre;

        const celdaCantidad = document.createElement("td");
        const entradaCantidad = crearEntradaTabla("cantidad", item.cantidad);
        entradaCantidad.dataset.indice = indice;
        celdaCantidad.appendChild(entradaCantidad);

        const celdaPrecio = document.createElement("td");
        celdaPrecio.textContent = `C$ ${formatearMoneda(item.precio)}`;

        const celdaDescuento = document.createElement("td");
        if (esAdminFacturacion) {
            const entradaDescuento = crearEntradaTabla("descuento", item.descuento || 0);
            entradaDescuento.dataset.indice = indice;
            celdaDescuento.appendChild(entradaDescuento);
        } else {
            celdaDescuento.textContent = "—";
        }

        const celdaSubtotal = document.createElement("td");
        celdaSubtotal.className = "celda-dinero";
        celdaSubtotal.textContent = `C$ ${formatearMoneda(subtotalBruto - descuentoLinea)}`;

        const celdaAcciones = document.createElement("td");
        const botonEliminar = document.createElement("button");

        botonEliminar.type = "button";
        botonEliminar.textContent = "Quitar";
        botonEliminar.className = "quitar-producto-btn";
        botonEliminar.dataset.indice = indice;

        celdaAcciones.appendChild(botonEliminar);

        fila.append(
            celdaCodigo,
            celdaNombre,
            celdaCantidad,
            celdaPrecio,
            celdaDescuento,
            celdaSubtotal,
            celdaAcciones
        );

        detalleFacturaBody.appendChild(fila);
    });

    actualizarTotales();
}

function obtenerTotales() {

    let subtotalBruto = 0;
    let descuentoProductos = 0;

    detalleFactura.forEach(item => {
        const subtotalLinea = redondearMoneda(item.precio * item.cantidad);
        const descuentoLinea = redondearMoneda(
            subtotalLinea * ((Number(item.descuento) || 0) / 100)
        );

        subtotalBruto = redondearMoneda(subtotalBruto + subtotalLinea);
        descuentoProductos = redondearMoneda(descuentoProductos + descuentoLinea);
    });

    const descuentoGeneralPorcentaje = esAdminFacturacion
        ? Math.min(100, Math.max(0, Number(descuentoGeneralFactura.value) || 0))
        : 0;

    const baseAntesDescuentoGeneral = redondearMoneda(
        subtotalBruto - descuentoProductos
    );

    const descuentoGeneralMonto = redondearMoneda(
        baseAntesDescuentoGeneral * (descuentoGeneralPorcentaje / 100)
    );

    const baseImponible = redondearMoneda(
        baseAntesDescuentoGeneral - descuentoGeneralMonto
    );

    const impuestoPorcentaje = esAdminFacturacion
        ? Math.min(100, Math.max(0, Number(impuestoFactura.value) || 0))
        : 0;

    const impuesto = redondearMoneda(baseImponible * (impuestoPorcentaje / 100));
    const total = redondearMoneda(baseImponible + impuesto);

    return {
        subtotalBruto,
        descuentoProductos,
        descuentoGeneralPorcentaje,
        descuentoGeneralMonto,
        baseImponible,
        impuestoPorcentaje,
        impuesto,
        total
    };
}

function actualizarTotales() {

    const totales = obtenerTotales();

    subtotalFactura.textContent = formatearMoneda(totales.subtotalBruto);
    descuentoProductosFactura.textContent = formatearMoneda(totales.descuentoProductos);
    descuentoGeneralAplicado.textContent = formatearMoneda(totales.descuentoGeneralMonto);
    baseImponibleFactura.textContent = formatearMoneda(totales.baseImponible);
    montoImpuestoFactura.textContent = formatearMoneda(totales.impuesto);
    totalFactura.textContent = formatearMoneda(totales.total);

    actualizarResumenPagos(totales);
}

detalleFacturaBody?.addEventListener("click", function(event) {

    if (registrandoFactura) return;

    const boton = event.target.closest(".quitar-producto-btn");

    if (!boton) return;

    const indice = Number(boton.dataset.indice);

    if (!Number.isInteger(indice) || !detalleFactura[indice]) return;

    detalleFactura.splice(indice, 1);
    mostrarDetalleFactura();
});

detalleFacturaBody?.addEventListener("change", function(event) {

    if (registrandoFactura) return;

    const entrada = event.target.closest(".entrada-tabla");

    if (!entrada) return;

    const indice = Number(entrada.dataset.indice);
    const item = detalleFactura[indice];

    if (!item) return;

    if (entrada.dataset.campo === "cantidad") {

        const cantidad = Number(entrada.value);
        const producto = buscarProductoPorCodigo(item.codigo);

        if (!producto || !Number.isInteger(cantidad) || cantidad <= 0) {
            SouvanicUI.notificar(
                "La cantidad debe ser un número entero mayor que cero.",
                "warning"
            );
            entrada.value = item.cantidad;
            return;
        }

        if (cantidad > Number(producto.Stock)) {
            SouvanicUI.notificar(
                `Stock insuficiente de ${item.nombre}. Disponible: ${producto.Stock}.`,
                "warning"
            );
            entrada.value = item.cantidad;
            return;
        }

        item.cantidad = cantidad;
    }

    if (entrada.dataset.campo === "descuento") {

        if (!esAdminFacturacion) {
            entrada.value = 0;
            return;
        }

        const descuento = Number(entrada.value);

        if (!Number.isFinite(descuento) || descuento < 0 || descuento > 100) {
            SouvanicUI.notificar(
                "El descuento debe estar entre 0 y 100 %.",
                "warning"
            );
            entrada.value = item.descuento || 0;
            return;
        }

        item.descuento = descuento;
    }

    mostrarDetalleFactura();
});

descuentoGeneralFactura?.addEventListener("input", actualizarTotales);
impuestoFactura?.addEventListener("input", actualizarTotales);

// ========================================
// PAGOS
// ========================================

function actualizarCamposPago() {
    if (!pagoMetodo) return;

    const metodo = pagoMetodo.value;

    campoMontoRecibido.hidden = metodo !== "Efectivo";
    campoBancoTarjeta.hidden = metodo !== "Tarjeta";
    campoBancoOrigen.hidden = metodo !== "Transferencia";
    campoBancoDestino.hidden = metodo !== "Transferencia";
    campoCuentaDestino.hidden = metodo !== "Transferencia";
    campoReferencia.hidden = !(metodo === "Tarjeta" || metodo === "Transferencia");
}

pagoMetodo?.addEventListener("change", actualizarCamposPago);

function totalPagosRegistrados() {
    return redondearMoneda(
        pagosFactura.reduce((suma, pago) => suma + pago.monto, 0)
    );
}

function actualizarResumenPagos(totales = obtenerTotales()) {

    const pagado = totalPagosRegistrados();
    const saldo = redondearMoneda(totales.total - pagado);
    const excedido = saldo < -0.009;
    const vuelto = redondearMoneda(
        pagosFactura.reduce((suma, pago) => suma + (pago.vuelto || 0), 0)
    );

    totalPagadoFactura.textContent = formatearMoneda(pagado);
    saldoFactura.textContent = formatearMoneda(excedido ? 0 : saldo);
    vueltoFactura.textContent = formatearMoneda(vuelto);

    if (pagosFactura.length === 0) {
        estadoPagoFactura.textContent = "Sin pagos";
        estadoPagoFactura.className = "estado-pago-sin-pagos";
        return;
    }

    if (excedido) {
        estadoPagoFactura.textContent = "Pagos exceden el total";
        estadoPagoFactura.className = "estado-pago-excedido";
        return;
    }

    if (pagado >= redondearMoneda(totales.total - 0.009)) {
        estadoPagoFactura.textContent = "Pagada";
        estadoPagoFactura.className = "estado-pago-pagada";
    } else {
        estadoPagoFactura.textContent = "Pendiente";
        estadoPagoFactura.className = "estado-pago-pendiente";
    }
}

function referenciaDuplicadaEnLista(pago) {

    const referencia = normalizarTexto(pago.referencia);

    if (!referencia) return false;

    return pagosFactura.some(item =>
        item.metodo === pago.metodo &&
        normalizarTexto(item.banco) === normalizarTexto(pago.banco) &&
        normalizarTexto(item.referencia) === referencia
    );
}

function agregarPago() {

    if (registrandoFactura) return;

    const metodo = pagoMetodo.value;
    const totales = obtenerTotales();

    if (!METODOS_PAGO_UI.includes(metodo)) {
        SouvanicUI.notificar("Seleccioná un método de pago.", "warning");
        pagoMetodo.focus();
        return;
    }

    const monto = redondearMoneda(pagoMonto.value);

    if (!Number.isFinite(monto) || monto <= 0) {
        SouvanicUI.notificar("El monto del pago debe ser mayor que cero.", "warning");
        pagoMonto.focus();
        return;
    }

    if (totales.total <= 0) {
        SouvanicUI.notificar(
            "Agregá productos para que la factura tenga un total a pagar.",
            "warning"
        );
        return;
    }

    const saldoActual = redondearMoneda(totales.total - totalPagosRegistrados());

    if (monto > saldoActual + 0.009) {
        SouvanicUI.notificar(
            `El pago supera el saldo pendiente de C$ ${formatearMoneda(saldoActual)}.`,
            "warning",
            { titulo: "Monto excedido" }
        );
        pagoMonto.focus();
        return;
    }

    const pago = {
        metodo,
        monto,
        montoRecibido: null,
        vuelto: 0,
        banco: null,
        bancoDestino: null,
        cuentaDestino: null,
        referencia: null,
        observaciones: pagoObservaciones.value.trim()
    };

    if (metodo === "Efectivo") {

        const recibidoTexto = pagoMontoRecibido.value.trim();
        const recibido = recibidoTexto === "" ? monto : redondearMoneda(recibidoTexto);

        if (!Number.isFinite(recibido) || recibido < monto) {
            SouvanicUI.notificar(
                "El efectivo recibido no puede ser menor que el monto aplicado.",
                "warning"
            );
            pagoMontoRecibido.focus();
            return;
        }

        pago.montoRecibido = recibido;
        pago.vuelto = redondearMoneda(recibido - monto);

    } else if (metodo === "Tarjeta") {

        if (!BANCOS_TARJETA_UI.includes(pagoBancoTarjeta.value)) {
            SouvanicUI.notificar(
                "Seleccioná un banco emisor válido: BAC, LAFISE o BANPRO.",
                "warning"
            );
            pagoBancoTarjeta.focus();
            return;
        }

        pago.banco = pagoBancoTarjeta.value;
        pago.referencia = pagoReferencia.value.trim();

        if (!pago.referencia) {
            SouvanicUI.notificar(
                "La referencia o autorización de la tarjeta es obligatoria.",
                "warning"
            );
            pagoReferencia.focus();
            return;
        }

    } else {

        pago.banco = pagoBancoOrigen.value.trim();
        pago.referencia = pagoReferencia.value.trim();
        pago.bancoDestino = pagoBancoDestino.value.trim() || null;
        pago.cuentaDestino = pagoCuentaDestino.value.trim() || null;

        if (!pago.banco) {
            SouvanicUI.notificar(
                "El banco de origen de la transferencia es obligatorio.",
                "warning"
            );
            pagoBancoOrigen.focus();
            return;
        }

        if (!pago.referencia) {
            SouvanicUI.notificar(
                "La referencia de la transferencia es obligatoria.",
                "warning"
            );
            pagoReferencia.focus();
            return;
        }
    }

    if (pago.referencia && pago.referencia.length > 60) {
        SouvanicUI.notificar("La referencia supera los 60 caracteres.", "warning");
        pagoReferencia.focus();
        return;
    }

    if (pago.observaciones.length > 255) {
        SouvanicUI.notificar("Las observaciones superan los 255 caracteres.", "warning");
        pagoObservaciones.focus();
        return;
    }

    if (referenciaDuplicadaEnLista(pago)) {
        SouvanicUI.notificar(
            "Esa referencia ya fue agregada a un pago de la misma factura.",
            "warning",
            { titulo: "Referencia duplicada" }
        );
        pagoReferencia.focus();
        return;
    }

    pagosFactura.push(pago);
    renderPagos();
    actualizarResumenPagos(totales);

    pagoMetodo.value = "";
    pagoMonto.value = "";
    pagoMontoRecibido.value = "";
    pagoBancoTarjeta.value = "";
    pagoBancoOrigen.value = "";
    pagoBancoDestino.value = "";
    pagoCuentaDestino.value = "";
    pagoReferencia.value = "";
    pagoObservaciones.value = "";
    actualizarCamposPago();

    SouvanicUI.notificar("Pago agregado a la factura.", "success");
}

btnAgregarPago?.addEventListener("click", agregarPago);

pagoMonto?.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        agregarPago();
    }
});

function textoBancoReferencia(pago) {
    const partes = [];

    if (pago.banco) partes.push(pago.banco);
    if (pago.bancoDestino) partes.push(`→ ${pago.bancoDestino}`);
    if (pago.referencia) partes.push(`Ref. ${pago.referencia}`);

    return partes.length ? partes.join(" · ") : "Sin banco ni referencia";
}

function renderPagos() {
    if (!pagosFacturaLista) return;

    pagosFacturaLista.innerHTML = "";

    if (pagosFactura.length === 0) {
        const vacio = document.createElement("p");
        vacio.className = "pagos-vacio";
        vacio.textContent =
            "No agregaste pagos. La factura se guardará como Registrada con saldo pendiente.";
        pagosFacturaLista.appendChild(vacio);
        return;
    }

    pagosFactura.forEach((pago, indice) => {

        const item = document.createElement("div");
        item.className = "pago-item";

        const icono = document.createElement("span");
        icono.className = "pago-item-icono";

        const iconoInterno = document.createElement("i");
        iconoInterno.className = pago.metodo === "Efectivo"
            ? "bi bi-cash-coin"
            : pago.metodo === "Tarjeta"
                ? "bi bi-credit-card"
                : "bi bi-bank";
        iconoInterno.setAttribute("aria-hidden", "true");
        icono.appendChild(iconoInterno);

        const datos = document.createElement("div");
        datos.className = "pago-item-datos";

        const titulo = document.createElement("strong");
        titulo.textContent = `${pago.metodo} · C$ ${formatearMoneda(pago.monto)}`;

        const detalle = document.createElement("small");
        detalle.textContent = textoBancoReferencia(pago);

        datos.append(titulo, detalle);

        if (pago.metodo === "Efectivo" && pago.montoRecibido !== null) {
            const efectivo = document.createElement("small");
            efectivo.textContent =
                `Recibido C$ ${formatearMoneda(pago.montoRecibido)} · ` +
                `Vuelto C$ ${formatearMoneda(pago.vuelto)}`;
            datos.appendChild(efectivo);
        }

        if (pago.observaciones) {
            const observaciones = document.createElement("small");
            observaciones.textContent = `Obs.: ${pago.observaciones}`;
            datos.appendChild(observaciones);
        }

        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "quitar-pago-btn";
        boton.dataset.indice = indice;
        boton.textContent = "Quitar";

        item.append(icono, datos, boton);
        pagosFacturaLista.appendChild(item);
    });
}

pagosFacturaLista?.addEventListener("click", function(event) {

    if (registrandoFactura) return;

    const boton = event.target.closest(".quitar-pago-btn");

    if (!boton) return;

    const indice = Number(boton.dataset.indice);

    if (!Number.isInteger(indice) || !pagosFactura[indice]) return;

    pagosFactura.splice(indice, 1);
    renderPagos();
    actualizarResumenPagos();
});

// ========================================
// ROLES
// ========================================

function configurarRolFacturacion() {
    if (!bloqueDescuentoGeneral || !bloqueImpuesto) return;

    bloqueDescuentoGeneral.hidden = !esAdminFacturacion;
    bloqueImpuesto.hidden = !esAdminFacturacion;

    if (!esAdminFacturacion) {
        descuentoGeneralFactura.value = 0;
        impuestoFactura.value = 0;
        detalleFactura.forEach(item => {
            item.descuento = 0;
        });
        tablaDetalleFacturaFormulario.classList.add("sin-descuentos");
    }
}

// ========================================
// GUARDAR FACTURA
// ========================================

function controlesDelFormulario() {
    return [
        facturaClienteBusqueda,
        facturaCliente,
        btnClienteRapido,
        facturaProductoBusqueda,
        facturaCantidad,
        agregarProductoFactura,
        descuentoGeneralFactura,
        impuestoFactura,
        pagoMetodo,
        pagoMonto,
        pagoMontoRecibido,
        pagoBancoTarjeta,
        pagoBancoOrigen,
        pagoBancoDestino,
        pagoCuentaDestino,
        pagoReferencia,
        pagoObservaciones,
        btnAgregarPago,
        btnLimpiarFactura
    ];
}

function cambiarEstadoRegistro(ocupado) {

    registrandoFactura = ocupado;

    controlesDelFormulario().forEach(control => {
        if (control) control.disabled = ocupado;
    });

    guardarFactura.disabled = ocupado;
    guardarEImprimirFactura.disabled = ocupado;

    detalleFacturaBody.querySelectorAll("input, button").forEach(control => {
        control.disabled = ocupado;
    });

    pagosFacturaLista.querySelectorAll("button").forEach(control => {
        control.disabled = ocupado;
    });

    guardarFactura.innerHTML = ocupado
        ? '<i class="bi bi-arrow-repeat spin" aria-hidden="true"></i> Guardando...'
        : '<i class="bi bi-check2-circle" aria-hidden="true"></i> Guardar factura';
}

function validarDetalleAntesDeGuardar() {

    if (detalleFactura.length === 0) {
        SouvanicUI.notificar(
            "Agregá al menos un producto a la factura.",
            "warning"
        );
        return false;
    }

    for (const item of detalleFactura) {

        const producto = buscarProductoPorCodigo(item.codigo);

        if (!producto) {
            SouvanicUI.notificar(
                `El producto ${item.codigo} ya no existe. Quitalo de la factura.`,
                "error"
            );
            return false;
        }

        if (!producto.Activo) {
            SouvanicUI.notificar(
                `El producto ${producto.Nombre} está inactivo y no se puede vender.`,
                "error"
            );
            return false;
        }

        if (item.cantidad > Number(producto.Stock)) {
            SouvanicUI.notificar(
                `Stock insuficiente de ${producto.Nombre}. ` +
                `Disponible: ${producto.Stock}. Solicitado: ${item.cantidad}.`,
                "warning",
                { titulo: "Stock insuficiente", persistente: true }
            );
            return false;
        }

        if (!Number.isInteger(item.cantidad) || item.cantidad <= 0) {
            SouvanicUI.notificar(
                "Todas las cantidades deben ser enteros mayores que cero.",
                "warning"
            );
            return false;
        }
    }

    return true;
}

function validarPagosAntesDeGuardar(totales) {

    const pagado = totalPagosRegistrados();

    if (pagado > totales.total + 0.009) {
        SouvanicUI.notificar(
            `Los pagos registrados (C$ ${formatearMoneda(pagado)}) superan ` +
            `el total de la factura (C$ ${formatearMoneda(totales.total)}).`,
            "warning",
            { titulo: "Pagos excedidos", persistente: true }
        );
        return false;
    }

    for (const pago of pagosFactura) {
        if (referenciaDuplicadaEnLista(pago)) {
            SouvanicUI.notificar(
                "Hay referencias repetidas entre los pagos de esta factura.",
                "warning"
            );
            return false;
        }
    }

    return true;
}

function cuerpoFactura(totales) {
    return {
        idCliente: facturaCliente.value,
        productos: detalleFactura.map(item => ({
            codigo: item.codigo,
            cantidad: item.cantidad,
            descuentoPorcentaje: esAdminFacturacion
                ? Number(item.descuento) || 0
                : 0
        })),
        pagos: pagosFactura.map(pago => ({
            metodo: pago.metodo,
            monto: pago.monto,
            montoRecibido: pago.montoRecibido,
            banco: pago.banco,
            bancoDestino: pago.bancoDestino,
            cuentaDestino: pago.cuentaDestino,
            referencia: pago.referencia,
            observaciones: pago.observaciones
        })),
        descuentoGeneral: esAdminFacturacion
            ? totales.descuentoGeneralMonto
            : 0,
        impuestoPorcentaje: esAdminFacturacion
            ? totales.impuestoPorcentaje
            : 0,
        claveIdempotencia: claveIdempotenciaFactura
    };
}

async function registrarFactura(imprimirDespues = false) {

    if (registrandoFactura) return;

    if (!facturaCliente.value) {
        SouvanicUI.notificar(
            "Seleccioná un cliente para generar la factura.",
            "warning"
        );
        facturaCliente.focus();
        return;
    }

    if (!validarDetalleAntesDeGuardar()) return;

    const totales = obtenerTotales();

    if (totales.total <= 0) {
        SouvanicUI.notificar(
            "El total de la factura debe ser mayor que cero.",
            "warning"
        );
        return;
    }

    if (totales.descuentoGeneralMonto > totales.subtotalBruto - totales.descuentoProductos) {
        SouvanicUI.notificar(
            "El descuento general supera el subtotal disponible.",
            "warning"
        );
        return;
    }

    if (!validarPagosAntesDeGuardar(totales)) return;

    if (pagosFactura.length === 0) {

        const continuar = await SouvanicUI.confirmar({
            titulo: "Factura sin pagos",
            mensaje: "No registraste ningún pago para esta factura.",
            detalle:
                `Se guardará como Registrada con un saldo pendiente de C$ ${formatearMoneda(totales.total)}. ` +
                "Más adelante podés verificar o completar el pago.",
            confirmar: "Guardar sin pagos",
            cancelar: "Volver",
            icono: "bi-exclamation-triangle-fill"
        });

        if (!continuar) return;
    }

    cambiarEstadoRegistro(true);

    const editando = Number.isInteger(idFacturaEditando) && idFacturaEditando > 0;
    const rutaEnvio = editando
        ? `/facturas/${encodeURIComponent(idFacturaEditando)}`
        : "/facturas";
    const metodoEnvio = editando ? "PUT" : "POST";

    try {
        const respuesta = await fetchAutenticado(rutaEnvio, {
            method: metodoEnvio,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(cuerpoFactura(totales))
        });

        let datos = {};

        try {
            datos = await respuesta.json();
        } catch (error) {
            datos = {};
        }

        if (!respuesta.ok) {
            throw new Error(datos.mensaje || "No se pudo guardar la factura.");
        }

        const fueDuplicado = Boolean(datos.duplicado);
        const idFactura = datos.idFactura;

        if (fueDuplicado) {
            SouvanicUI.notificar(
                `La factura N.° ${idFactura} ya estaba registrada. No se generaron movimientos duplicados.`,
                "info",
                { titulo: "Registro ya existente", persistente: true }
            );
        } else {
            const mensajeVuelto = Number(datos.vuelto) > 0
                ? ` Vuelto: C$ ${formatearMoneda(datos.vuelto)}.`
                : "";

            SouvanicUI.notificar(
                `Factura N.° ${idFactura} guardada. Total: C$ ${formatearMoneda(datos.total)}. ` +
                `Estado: ${datos.estado}. Saldo: C$ ${formatearMoneda(datos.saldo)}.${mensajeVuelto}`,
                "success",
                { titulo: "Venta registrada" }
            );
        }

        claveIdempotenciaFactura = generarClaveIdempotencia();

        limpiarFormularioFactura();
        irAPasoWizard(1, false);
        if (editando && !imprimirDespues) {
            window.location.href = "historial-facturas.html";
            return;
        }
        await Promise.all([cargarProductos(), cargarHistorialFacturas()]);

        if (imprimirDespues && idFactura) {
            const abierto = await abrirDetalleFactura(idFactura);

            if (abierto) {
                window.setTimeout(() => window.print(), 300);
            }
        }

    } catch (error) {

        console.error("Error al guardar factura:", error);

        SouvanicUI.notificar(
            error.message || "No se pudo guardar la factura.",
            "error",
            {
                titulo: "No se guardó la factura",
                persistente: true
            }
        );

    } finally {
        cambiarEstadoRegistro(false);
    }
}

guardarFactura?.addEventListener("click", function() {
    registrarFactura(false);
});

guardarEImprimirFactura?.addEventListener("click", function() {
    registrarFactura(true);
});

// ========================================
// LIMPIAR FORMULARIO
// ========================================

function limpiarFormularioFactura() {

    facturaClienteBusqueda.value = "";
    aplicarFiltroClientes("");
    cerrarClienteRapido();

    facturaProductoBusqueda.value = "";
    facturaCantidad.value = 1;
    infoProductoFactura.hidden = true;
    infoProductoFactura.innerHTML = "";

    detalleFactura = [];
    pagosFactura = [];

    descuentoGeneralFactura.value = 0;
    impuestoFactura.value = 0;

    pagoMetodo.value = "";
    pagoMonto.value = "";
    pagoMontoRecibido.value = "";
    pagoBancoTarjeta.value = "";
    pagoBancoOrigen.value = "";
    pagoBancoDestino.value = "";
    pagoCuentaDestino.value = "";
    pagoReferencia.value = "";
    pagoObservaciones.value = "";
    actualizarCamposPago();

    mostrarDetalleFactura();
    renderPagos();
    actualizarResumenPagos();
    salirModoEdicionWizard();
    renderizarCatalogoPOS();
}

async function confirmarLimpiarFormulario() {

    if (registrandoFactura) return;

    const tieneDatos = detalleFactura.length > 0 || pagosFactura.length > 0;

    if (tieneDatos) {
        const continuar = await SouvanicUI.confirmar({
            titulo: "Limpiar formulario",
            mensaje: "Se quitarán los productos y pagos agregados a esta factura.",
            detalle: "La factura todavía no fue guardada.",
            confirmar: "Limpiar",
            cancelar: "Cancelar",
            peligro: true
        });

        if (!continuar) return;
    }

    limpiarFormularioFactura();
    claveIdempotenciaFactura = generarClaveIdempotencia();

    SouvanicUI.notificar("Formulario listo para una nueva factura.", "info");
}

btnLimpiarFactura?.addEventListener("click", confirmarLimpiarFormulario);

// ========================================
// HISTORIAL
// ========================================

async function cargarHistorialFacturas() {

    if (cargandoHistorial) return;

    cargandoHistorial = true;

    mostrarEstadoTabla(historialFacturasBody, {
        tipo: "cargando",
        colspan: 8,
        mensaje: "Cargando facturas..."
    });

    if (paginacionFacturas) {
        paginacionFacturas.innerHTML = "";
    }

    if (contadorFacturas) {
        contadorFacturas.textContent = "Cargando facturas...";
    }

    try {
        const respuesta = await fetchAutenticado("/facturas");

        if (!respuesta.ok) {
            throw new Error("No se pudieron obtener las facturas.");
        }

        const datos = await respuesta.json();

        facturasHistorial = Array.isArray(datos) ? datos : [];
        actualizarFiltroResponsables();
        aplicarFiltrosFacturas();

    } catch (error) {

        console.error("Error al cargar historial:", error);

        mostrarEstadoTabla(historialFacturasBody, {
            tipo: "error",
            colspan: 8,
            titulo: "No se pudo cargar el historial",
            mensaje: "Verificá la conexión con el servidor e intentá nuevamente."
        });

        if (contadorFacturas) {
            contadorFacturas.textContent = "No se pudo cargar el historial";
        }

    } finally {
        cargandoHistorial = false;
    }
}

function actualizarFiltroResponsables() {

    const seleccionado = filtroFacturaResponsable.value;

    const responsables = Array.from(new Set(
        facturasHistorial
            .map(factura => String(factura.Responsable || "").trim())
            .filter(Boolean)
    )).sort((a, b) => a.localeCompare(b, "es"));

    filtroFacturaResponsable.innerHTML = "";
    filtroFacturaResponsable.appendChild(new Option("Todos", ""));

    responsables.forEach(nombre => {
        filtroFacturaResponsable.appendChild(new Option(nombre, nombre));
    });

    if (responsables.includes(seleccionado)) {
        filtroFacturaResponsable.value = seleccionado;
    }
}

function aplicarFiltrosFacturas() {
    if (!historialFacturasBody) return;

    const consulta = normalizarTexto(filtroFacturaBuscar.value);
    const desde = filtroFacturaDesde.value;
    const hasta = filtroFacturaHasta.value;
    const estado = filtroFacturaEstado.value;
    const metodo = filtroFacturaMetodo.value;
    const responsable = filtroFacturaResponsable.value;
    const orden = filtroFacturaOrden.value;

    facturasFiltradas = facturasHistorial.filter(factura => {

        const numero = String(factura.IdFactura);
        const cliente = normalizarTexto(factura.Cliente);

        if (
            consulta &&
            !normalizarTexto(numero).includes(consulta) &&
            !cliente.includes(consulta)
        ) {
            return false;
        }

        const fecha = new Date(factura.Fecha);

        if (!Number.isNaN(fecha.getTime())) {

            const dia = claveDiaLocal(fecha);

            if (desde && dia < desde) return false;
            if (hasta && dia > hasta) return false;
        }

        if (estado && normalizarTexto(factura.Estado) !== normalizarTexto(estado)) {
            return false;
        }

        if (metodo) {
            const metodos = String(factura.MetodosPago || "")
                .split(",")
                .map(item => item.trim());

            if (!metodos.includes(metodo)) return false;
        }

        if (responsable && String(factura.Responsable || "").trim() !== responsable) {
            return false;
        }

        return true;
    });

    facturasFiltradas.sort((a, b) => {

        if (orden === "total-desc") {
            return Number(b.Total) - Number(a.Total);
        }

        if (orden === "total-asc") {
            return Number(a.Total) - Number(b.Total);
        }

        const fechaA = new Date(a.Fecha).getTime() || 0;
        const fechaB = new Date(b.Fecha).getTime() || 0;

        if (orden === "antiguas") {
            return fechaA - fechaB || Number(a.IdFactura) - Number(b.IdFactura);
        }

        return fechaB - fechaA || Number(b.IdFactura) - Number(a.IdFactura);
    });

    const totalPaginas = Math.max(
        1,
        Math.ceil(facturasFiltradas.length / FACTURAS_POR_PAGINA)
    );

    if (paginaFacturas > totalPaginas) {
        paginaFacturas = totalPaginas;
    }

    if (paginaFacturas < 1) {
        paginaFacturas = 1;
    }

    renderHistorialFacturas();
}

function renderHistorialFacturas() {

    if (facturasHistorial.length === 0) {

        mostrarEstadoTabla(historialFacturasBody, {
            tipo: "vacio",
            colspan: 8,
            icono: "bi-receipt",
            titulo: "No hay facturas registradas",
            mensaje: "Las ventas que generes aparecerán en este historial."
        });

        if (contadorFacturas) {
            contadorFacturas.textContent = "Sin facturas registradas";
        }

        if (paginacionFacturas) {
            paginacionFacturas.innerHTML = "";
        }

        return;
    }

    const total = facturasHistorial.length;

    if (facturasFiltradas.length === 0) {

        mostrarEstadoTabla(historialFacturasBody, {
            tipo: "vacio",
            colspan: 8,
            icono: "bi-search",
            titulo: "Sin resultados",
            mensaje: "No hay facturas que coincidan con los filtros aplicados."
        });

        if (contadorFacturas) {
            contadorFacturas.textContent = `0 de ${total.toLocaleString("es-NI")} facturas`;
        }

        if (paginacionFacturas) {
            paginacionFacturas.innerHTML = "";
        }

        return;
    }

    const inicio = (paginaFacturas - 1) * FACTURAS_POR_PAGINA;
    const pagina = facturasFiltradas.slice(inicio, inicio + FACTURAS_POR_PAGINA);

    historialFacturasBody.innerHTML = "";

    pagina.forEach(factura => {

        const fila = document.createElement("tr");

        const celdaNumero = document.createElement("td");
        const badge = document.createElement("span");
        badge.className = "badge-factura-num";
        badge.textContent = factura.IdFactura;
        celdaNumero.appendChild(badge);

        const celdaFecha = document.createElement("td");
        celdaFecha.textContent = formatearFechaHora(factura.Fecha);

        const celdaCliente = document.createElement("td");
        celdaCliente.textContent = factura.Cliente || "—";

        const celdaResponsable = document.createElement("td");
        celdaResponsable.textContent = factura.Responsable || "—";

        const celdaTotal = document.createElement("td");
        celdaTotal.className = "celda-dinero";
        celdaTotal.textContent = `C$ ${formatearMoneda(factura.Total)}`;

        const celdaEstado = document.createElement("td");
        celdaEstado.appendChild(crearBadgeEstado(factura.Estado));

        const celdaSaldo = document.createElement("td");
        celdaSaldo.className = "celda-dinero";

        if (esFacturaAnulada(factura)) {
            celdaSaldo.textContent = "—";
        } else {
            const saldo = redondearMoneda(
                Number(factura.Total) - Number(factura.Pagado || 0)
            );

            celdaSaldo.textContent = saldo > 0.009
                ? `C$ ${formatearMoneda(saldo)}`
                : "Pagado";

            if (saldo > 0.009) {
                celdaSaldo.classList.add("saldo-pendiente");
            }
        }

        const celdaAcciones = document.createElement("td");
        celdaAcciones.className = "col-chevron";
        const botonDetalle = document.createElement("button");

        botonDetalle.type = "button";
        botonDetalle.className = "socio-chevron-btn ver-detalle-factura";
        botonDetalle.dataset.id = factura.IdFactura;
        botonDetalle.setAttribute("aria-label", `Ver opciones de factura ${factura.IdFactura}`);
        botonDetalle.innerHTML = '<i class="bi bi-chevron-right" aria-hidden="true"></i>';

        celdaAcciones.appendChild(botonDetalle);

        fila.className = "socio-fila";
        fila.tabIndex = 0;
        fila.setAttribute("role", "button");
        fila.dataset.id = factura.IdFactura;

        fila.append(
            celdaNumero,
            celdaFecha,
            celdaCliente,
            celdaResponsable,
            celdaTotal,
            celdaEstado,
            celdaSaldo,
            celdaAcciones
        );

        historialFacturasBody.appendChild(fila);
    });

    if (contadorFacturas) {
        const visibles = facturasFiltradas.length;

        contadorFacturas.textContent = visibles === total
            ? `${total.toLocaleString("es-NI")} facturas registradas`
            : `${visibles.toLocaleString("es-NI")} de ${total.toLocaleString("es-NI")} facturas`;
    }

    renderPaginacionFacturas();
}

function renderPaginacionFacturas() {

    if (!paginacionFacturas) return;

    paginacionFacturas.innerHTML = "";

    const totalPaginas = Math.ceil(
        facturasFiltradas.length / FACTURAS_POR_PAGINA
    );

    if (totalPaginas <= 1) return;

    const info = document.createElement("span");
    info.className = "paginacion-info";
    info.textContent = `Página ${paginaFacturas} de ${totalPaginas}`;
    paginacionFacturas.appendChild(info);

    function boton(texto, pagina, etiqueta, deshabilitado, activo) {
        const elemento = document.createElement("button");
        elemento.type = "button";
        elemento.textContent = texto;

        if (etiqueta) elemento.setAttribute("aria-label", etiqueta);
        if (deshabilitado) elemento.disabled = true;
        if (activo) {
            elemento.classList.add("activa");
            elemento.setAttribute("aria-current", "page");
        }

        if (!deshabilitado && !activo) {
            elemento.addEventListener("click", function() {
                paginaFacturas = pagina;
                renderHistorialFacturas();
                document.getElementById("historial")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
            });
        }

        return elemento;
    }

    paginacionFacturas.appendChild(
        boton("« Anterior", paginaFacturas - 1, "Página anterior", paginaFacturas <= 1, false)
    );

    const inicio = Math.max(1, paginaFacturas - 2);
    const fin = Math.min(totalPaginas, inicio + 4);

    for (let numero = inicio; numero <= fin; numero++) {
        paginacionFacturas.appendChild(
            boton(String(numero), numero, `Ir a la página ${numero}`, false, numero === paginaFacturas)
        );
    }

    paginacionFacturas.appendChild(
        boton("Siguiente »", paginaFacturas + 1, "Página siguiente", paginaFacturas >= totalPaginas, false)
    );
}

historialFacturasBody?.addEventListener("click", function(event) {
    const fila = event.target.closest("tr.socio-fila");
    if (!fila) return;

    const idFactura = Number(fila.dataset.id);
    if (!Number.isInteger(idFactura) || idFactura <= 0) return;

    abrirDetalleFactura(idFactura);
});

historialFacturasBody?.addEventListener("keydown", function(event) {
    if (event.key !== "Enter" && event.key !== " ") return;
    const fila = event.target.closest("tr.socio-fila");
    if (!fila) return;
    event.preventDefault();

    const idFactura = Number(fila.dataset.id);
    if (!Number.isInteger(idFactura) || idFactura <= 0) return;

    abrirDetalleFactura(idFactura);
});

filtroFacturaBuscar?.addEventListener("input", function() {
    paginaFacturas = 1;
    aplicarFiltrosFacturas();
});

[
    filtroFacturaDesde,
    filtroFacturaHasta,
    filtroFacturaEstado,
    filtroFacturaMetodo,
    filtroFacturaResponsable,
    filtroFacturaOrden
].forEach(control => {
    control?.addEventListener("change", function() {
        paginaFacturas = 1;
        aplicarFiltrosFacturas();
    });
});

btnLimpiarFiltrosFacturas?.addEventListener("click", function() {
    filtroFacturaBuscar.value = "";
    filtroFacturaDesde.value = "";
    filtroFacturaHasta.value = "";
    filtroFacturaEstado.value = "";
    filtroFacturaMetodo.value = "";
    filtroFacturaResponsable.value = "";
    filtroFacturaOrden.value = "recientes";
    paginaFacturas = 1;
    aplicarFiltrosFacturas();
});

btnExportarFacturas?.addEventListener("click", function() {

    if (!window.ExportadorXLSX || typeof window.ExportadorXLSX.exportarFacturasXLSX !== "function") {
        SouvanicUI.notificar(
            "El exportador XLSX no está disponible en esta página.",
            "error"
        );
        return;
    }

    if (facturasFiltradas.length === 0) {
        SouvanicUI.notificar(
            "No hay facturas para exportar con los filtros actuales.",
            "warning"
        );
        return;
    }

    try {
        window.ExportadorXLSX.exportarFacturasXLSX(facturasFiltradas);
        SouvanicUI.notificar(
            `Se exportaron ${facturasFiltradas.length.toLocaleString("es-NI")} facturas a XLSX.`,
            "success"
        );
    } catch (error) {
        console.error("Error al exportar facturas:", error);
        SouvanicUI.notificar("No se pudo generar el archivo XLSX.", "error");
    }
});

// ========================================
// DETALLE DE FACTURA
// ========================================

function agregarFilaResumen(etiqueta, valor, esTotal = false) {

    const fila = document.createElement("div");
    fila.className = esTotal
        ? "detalle-resumen-fila fila-total"
        : "detalle-resumen-fila";

    const nombre = document.createElement("span");
    nombre.textContent = etiqueta;

    const monto = document.createElement("strong");
    monto.textContent = `C$ ${formatearMoneda(valor)}`;

    fila.append(nombre, monto);

    return fila;
}

function metodoPagoDetalle(pagos) {

    const metodos = Array.from(new Set(
        (Array.isArray(pagos) ? pagos : [])
            .filter(pago => normalizarTexto(pago.Estado) !== "anulado")
            .map(pago => String(pago.Metodo || "").trim())
            .filter(Boolean)
    ));

    return metodos.length ? metodos.join(", ") : "Sin pagos";
}

function pagadoDetalle(pagos) {
    return redondearMoneda(
        (Array.isArray(pagos) ? pagos : [])
            .filter(pago => normalizarTexto(pago.Estado) !== "anulado")
            .reduce((suma, pago) => suma + Number(pago.Monto || 0), 0)
    );
}

function estadoPagoClase(estado) {
    const clave = normalizarTexto(estado);

    if (clave === "verificado") return "verificado";
    if (clave === "anulado") return "anulado";
    if (clave === "reversion pendiente") return "reversion";

    return "registrado";
}

function renderPagosDetalle(pagos) {

    pagosDetalleFactura.innerHTML = "";

    if (!Array.isArray(pagos) || pagos.length === 0) {

        const fila = document.createElement("tr");
        const celda = document.createElement("td");
        celda.colSpan = 5;
        celda.className = "celda-pagos-vacia";
        celda.textContent = "No se registraron pagos para esta factura.";
        fila.appendChild(celda);
        pagosDetalleFactura.appendChild(fila);
        return;
    }

    pagos.forEach(pago => {

        const fila = document.createElement("tr");

        const celdaMetodo = document.createElement("td");
        celdaMetodo.textContent = pago.Metodo;

        const celdaMonto = document.createElement("td");
        celdaMonto.className = "celda-dinero";
        celdaMonto.textContent = `C$ ${formatearMoneda(pago.Monto)}`;

        const celdaBanco = document.createElement("td");
        const partes = [];

        if (pago.Banco) partes.push(pago.Banco);
        if (pago.BancoDestino) partes.push(`→ ${pago.BancoDestino}`);
        if (pago.CuentaDestino) partes.push(`Cta. ${pago.CuentaDestino}`);
        if (pago.Referencia) partes.push(`Ref. ${pago.Referencia}`);

        celdaBanco.textContent = partes.length ? partes.join(" · ") : "—";

        const celdaEstado = document.createElement("td");
        const badge = document.createElement("span");
        badge.className = `pago-estado ${estadoPagoClase(pago.Estado)}`;
        badge.textContent = pago.Estado || "Registrado";
        celdaEstado.appendChild(badge);

        const celdaFecha = document.createElement("td");
        celdaFecha.textContent = formatearFechaHora(pago.Fecha);

        fila.append(celdaMetodo, celdaMonto, celdaBanco, celdaEstado, celdaFecha);
        pagosDetalleFactura.appendChild(fila);
    });
}

function renderDetalleProductos(detalle) {

    tablaDetalleFactura.innerHTML = "";

    (Array.isArray(detalle) ? detalle : []).forEach(item => {

        const fila = document.createElement("tr");

        const celdaCodigo = document.createElement("td");
        celdaCodigo.className = "celda-codigo";
        celdaCodigo.textContent = item.CodigoProducto || "—";

        const celdaProducto = document.createElement("td");
        celdaProducto.className = "celda-producto";
        celdaProducto.textContent = item.Producto || "—";

        const celdaCantidad = document.createElement("td");
        celdaCantidad.className = "celda-numero text-derecha";
        celdaCantidad.textContent = item.Cantidad;

        const celdaPrecio = document.createElement("td");
        celdaPrecio.className = "celda-dinero text-derecha";
        celdaPrecio.textContent = `C$ ${formatearMoneda(item.PrecioUnitario)}`;

        const celdaDesc = document.createElement("td");
        celdaDesc.className = "celda-dinero text-derecha";
        celdaDesc.textContent = Number(item.DescuentoAplicado) > 0
            ? `- C$ ${formatearMoneda(item.DescuentoAplicado)}`
            : "—";

        const celdaSubtotal = document.createElement("td");
        celdaSubtotal.className = "celda-dinero celda-subtotal text-derecha";
        celdaSubtotal.textContent = `C$ ${formatearMoneda(item.Subtotal)}`;

        fila.append(celdaCodigo, celdaProducto, celdaCantidad, celdaPrecio, celdaDesc, celdaSubtotal);
        tablaDetalleFactura.appendChild(fila);
    });
}

async function abrirDetalleFactura(idFactura) {

    try {
        const respuesta = await fetchAutenticado(
            `/facturas/${encodeURIComponent(idFactura)}/completo`
        );

        if (!respuesta.ok) {
            throw new Error("No se pudo consultar la factura.");
        }

        const datos = await respuesta.json();

        if (!datos || !datos.factura) {
            throw new Error("La factura no existe.");
        }

        facturaDetalleActual = datos;

        const factura = datos.factura;
        const pagos = Array.isArray(datos.pagos) ? datos.pagos : [];
        const pagado = pagadoDetalle(pagos);
        const saldo = redondearMoneda(Number(factura.Total) - pagado);

        numeroFacturaDetalle.textContent = `Factura N.º ${factura.IdFactura}`;

        estadoDetalleFactura.className = "status " + etiquetaEstadoFactura(factura.Estado).clase;
        estadoDetalleFactura.textContent = etiquetaEstadoFactura(factura.Estado).texto;

        clienteDetalleFactura.textContent = factura.Cliente || "—";
        fechaDetalleFactura.textContent = formatearFechaHora(factura.Fecha);
        responsableDetalleFactura.textContent = factura.Responsable || "—";
        metodoDetalleFactura.textContent = metodoPagoDetalle(pagos);
        pagadoDetalleFactura.textContent = formatearMoneda(pagado);
        saldoDetalleFactura.textContent = formatearMoneda(saldo > 0 ? saldo : 0);
        renderizarVoucherFactura(
            factura,
            Array.isArray(datos.detalle) ? datos.detalle : [],
            pagos,
            pagado,
            saldo
        );

        if (esFacturaAnulada(factura)) {

            const partes = [];

            if (factura.FechaAnulacion) {
                partes.push(`Anulada el ${formatearFechaHora(factura.FechaAnulacion)}`);
            } else {
                partes.push("Factura anulada");
            }

            if (factura.UsuarioAnulacion) {
                partes.push(`por ${factura.UsuarioAnulacion}`);
            }

            if (factura.MotivoAnulacion) {
                partes.push(`Motivo: ${factura.MotivoAnulacion}`);
            }

            textoAnulacionDetalle.textContent = partes.join(". ") + ".";
            anulacionDetalleFactura.hidden = false;

        } else {
            anulacionDetalleFactura.hidden = true;
            textoAnulacionDetalle.textContent = "";
        }

        renderDetalleProductos(datos.detalle);

        const btnEditarDetalle = document.getElementById("btnEditarFacturaDetalle");
        if (btnEditarDetalle) {
            btnEditarDetalle.hidden = !(esAdminFacturacion && !esFacturaAnulada(factura));
        }
        renderPagosDetalle(pagos);

        resumenTotalesDetalle.innerHTML = "";
        resumenTotalesDetalle.append(
            agregarFilaResumen("Subtotal de productos", factura.Subtotal),
            agregarFilaResumen("Descuento aplicado", factura.Descuento),
            agregarFilaResumen("Impuesto", factura.Impuesto),
            agregarFilaResumen("Total", factura.Total, true)
        );

        const filaPagado = document.createElement("div");
        filaPagado.className = "detalle-resumen-fila fila-pagado";
        filaPagado.innerHTML = `<span>Monto pagado</span><strong class="celda-dinero">C$ ${formatearMoneda(pagado)}</strong>`;

        const filaSaldo = document.createElement("div");
        filaSaldo.className = "detalle-resumen-fila fila-saldo" + (saldo <= 0 ? " saldo-cero" : " saldo-pendiente");
        filaSaldo.innerHTML = `<span>Saldo pendiente</span><strong class="celda-dinero">C$ ${formatearMoneda(saldo > 0 ? saldo : 0)}</strong>`;

        resumenTotalesDetalle.append(filaPagado, filaSaldo);

        const puedeAnular = esAdminFacturacion && !esFacturaAnulada(factura);

        bloqueAnularFactura.hidden = !puedeAnular;
        confirmacionAnulacion.hidden = true;
        btnAnularFactura.hidden = false;
        btnAnularFactura.disabled = false;
        motivoAnulacionFactura.value = "";

        modalDetalleFactura.hidden = false;
        cerrarDetalleFactura.focus();

        return true;

    } catch (error) {

        console.error("Error al abrir detalle:", error);

        SouvanicUI.notificar(
            error.message || "No se pudo abrir el detalle de la factura.",
            "error"
        );

        return false;
    }
}

function cerrarModalDetalle() {
    modalDetalleFactura.hidden = true;
    facturaDetalleActual = null;
    confirmacionAnulacion.hidden = true;
    motivoAnulacionFactura.value = "";
}

cerrarDetalleFactura.addEventListener("click", cerrarModalDetalle);

modalDetalleFactura.addEventListener("click", function(event) {
    if (event.target === modalDetalleFactura) {
        cerrarModalDetalle();
    }
});

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape" && !modalDetalleFactura.hidden) {
        cerrarModalDetalle();
    }
});

function renderizarVoucherFactura(factura, detalle, pagos, totalPagado, saldo) {
    if (!voucherFacturaContenedor) return;

    document.getElementById("voucherNumero").textContent = `#${factura.IdFactura}`;
    document.getElementById("voucherFecha").textContent = formatearFechaHora(factura.Fecha);
    document.getElementById("voucherCliente").textContent = factura.Cliente || "Consumidor Final";
    document.getElementById("voucherResponsable").textContent = factura.Responsable || "Sistema";

    const anuladaEl = document.getElementById("voucherEstadoAnulada");
    if (anuladaEl) {
        anuladaEl.hidden = !esFacturaAnulada(factura);
    }

    const voucherItems = document.getElementById("voucherItems");
    voucherItems.innerHTML = "";
    detalle.forEach(item => {
        const fila = document.createElement("div");
        fila.className = "voucher-item-fila";

        const linea1 = document.createElement("div");
        linea1.className = "voucher-item-principal";

        const nombre = document.createElement("span");
        nombre.textContent = item.Producto || item.CodigoProducto;

        const subtotal = document.createElement("strong");
        subtotal.textContent = `C$ ${formatearMoneda(item.Subtotal)}`;

        linea1.append(nombre, subtotal);

        const linea2 = document.createElement("div");
        linea2.className = "voucher-item-detalle";
        const desc = Number(item.DescuentoAplicado || 0);
        linea2.textContent = `${item.Cantidad} x C$ ${formatearMoneda(item.PrecioUnitario)}` +
            (desc > 0 ? ` (-C$ ${formatearMoneda(desc)})` : "");

        fila.append(linea1, linea2);
        voucherItems.appendChild(fila);
    });

    const voucherTotales = document.getElementById("voucherTotales");
    voucherTotales.innerHTML = "";

    const agregarLineaTotal = (etiqueta, valor, esFinal = false) => {
        const div = document.createElement("div");
        if (esFinal) div.className = "voucher-total-final";
        const s1 = document.createElement("span");
        s1.textContent = etiqueta;
        const s2 = document.createElement("span");
        s2.textContent = valor;
        div.append(s1, s2);
        voucherTotales.appendChild(div);
    };

    agregarLineaTotal("Subtotal:", `C$ ${formatearMoneda(factura.Subtotal ?? factura.Total)}`);
    if (Number(factura.Descuento || 0) > 0) {
        agregarLineaTotal("Descuento:", `-C$ ${formatearMoneda(factura.Descuento)}`);
    }
    if (Number(factura.Impuesto || 0) > 0) {
        agregarLineaTotal("Impuesto:", `C$ ${formatearMoneda(factura.Impuesto)}`);
    }
    agregarLineaTotal("TOTAL:", `C$ ${formatearMoneda(factura.Total)}`, true);

    const voucherPagos = document.getElementById("voucherPagos");
    voucherPagos.innerHTML = "";

    const pagosActivos = pagos.filter(p => p.Estado !== "Anulado");
    let vueltoTotal = 0;
    pagosActivos.forEach(p => {
        vueltoTotal += Number(p.Vuelto || 0);
        const div = document.createElement("div");
        const s1 = document.createElement("span");
        s1.textContent = `${p.Metodo}${p.Banco ? ` (${p.Banco})` : ""}:`;
        const s2 = document.createElement("span");
        s2.textContent = `C$ ${formatearMoneda(p.Monto)}`;
        div.append(s1, s2);
        voucherPagos.appendChild(div);
    });

    const divPagado = document.createElement("div");
    divPagado.innerHTML = `<span>Pagado:</span><strong>C$ ${formatearMoneda(totalPagado)}</strong>`;
    voucherPagos.appendChild(divPagado);

    if (vueltoTotal > 0.009) {
        const divVuelto = document.createElement("div");
        divVuelto.innerHTML = `<span>Vuelto:</span><span>C$ ${formatearMoneda(vueltoTotal)}</span>`;
        voucherPagos.appendChild(divVuelto);
    }

    if (saldo > 0.009) {
        const divSaldo = document.createElement("div");
        divSaldo.innerHTML = `<span>Saldo pendiente:</span><strong>C$ ${formatearMoneda(saldo)}</strong>`;
        voucherPagos.appendChild(divSaldo);
    }
}

abrirModalVoucher?.addEventListener("click", function() {
    if (!modalVoucherFactura) return;
    modalVoucherFactura.hidden = false;
});

function cerrarVoucherModal() {
    if (modalVoucherFactura) {
        modalVoucherFactura.hidden = true;
    }
}

cerrarModalVoucher?.addEventListener("click", cerrarVoucherModal);

modalVoucherFactura?.addEventListener("click", function(event) {
    if (event.target === modalVoucherFactura) {
        cerrarVoucherModal();
    }
});

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape" && modalVoucherFactura && !modalVoucherFactura.hidden) {
        cerrarVoucherModal();
    }
});

imprimirVoucher?.addEventListener("click", function() {
    if (!modalVoucherFactura || modalVoucherFactura.hidden || !voucherFacturaContenedor) return;
    document.body.classList.add("imprimiendo-voucher");

    const restaurar = () => {
        document.body.classList.remove("imprimiendo-voucher");
        window.removeEventListener("afterprint", restaurar);
    };

    window.addEventListener("afterprint", restaurar);
    window.print();
    window.setTimeout(restaurar, 1000);
});

imprimirFactura.addEventListener("click", function() {
    if (modalDetalleFactura.hidden) return;
    window.print();
});

// ========================================
// ANULACIÓN
// ========================================

btnAnularFactura.addEventListener("click", function() {
    if (btnAnularFactura.disabled) return;

    btnAnularFactura.hidden = true;
    confirmacionAnulacion.hidden = false;
    motivoAnulacionFactura.focus();
});

cancelarAnulacionFactura.addEventListener("click", function() {
    confirmacionAnulacion.hidden = true;
    btnAnularFactura.hidden = false;
    motivoAnulacionFactura.value = "";
});

confirmarAnulacionFactura.addEventListener("click", async function() {

    if (anulandoFactura || !facturaDetalleActual) return;

    const motivo = motivoAnulacionFactura.value.trim();

    if (!motivo) {
        SouvanicUI.notificar(
            "Ingresá el motivo de la anulación.",
            "warning"
        );
        motivoAnulacionFactura.focus();
        return;
    }

    if (motivo.length > 255) {
        SouvanicUI.notificar(
            "El motivo no puede superar los 255 caracteres.",
            "warning"
        );
        motivoAnulacionFactura.focus();
        return;
    }

    const factura = facturaDetalleActual.factura;

    const continuar = await SouvanicUI.confirmar({
        titulo: `Anular factura N.° ${factura.IdFactura}`,
        mensaje: "Esta acción no elimina la factura ni su historial.",
        detalle:
            "Se restaurará el stock con movimientos compensatorios y los pagos quedarán " +
            "marcados para revisión. No se asume ninguna devolución bancaria automática.",
        confirmar: "Anular factura",
        cancelar: "Cancelar",
        peligro: true
    });

    if (!continuar) return;

    anulandoFactura = true;
    confirmarAnulacionFactura.disabled = true;
    cancelarAnulacionFactura.disabled = true;

    try {
        const respuesta = await fetchAutenticado(
            `/facturas/${encodeURIComponent(factura.IdFactura)}/anular`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ motivo })
            }
        );

        let datos = {};

        try {
            datos = await respuesta.json();
        } catch (error) {
            datos = {};
        }

        if (!respuesta.ok) {
            throw new Error(datos.mensaje || "No se pudo anular la factura.");
        }

        SouvanicUI.notificar(
            datos.mensaje || `Factura N.° ${factura.IdFactura} anulada.`,
            "success",
            { titulo: "Factura anulada" }
        );

        await Promise.all([cargarHistorialFacturas(), cargarProductos()]);
        await abrirDetalleFactura(factura.IdFactura);

    } catch (error) {

        console.error("Error al anular factura:", error);

        SouvanicUI.notificar(
            error.message || "No se pudo anular la factura.",
            "error",
            { persistente: true }
        );

    } finally {
        anulandoFactura = false;
        confirmarAnulacionFactura.disabled = false;
        cancelarAnulacionFactura.disabled = false;
    }
});

const posCatalogoGrid = document.getElementById("posCatalogoGrid");
const posCategoriaFiltros = document.getElementById("posCategoriaFiltros");
let posCategoriaActiva = "todas";

function renderizarCatalogoPOS() {
    if (!posCatalogoGrid) return;

    const activos = productosDisponibles.filter(p => p.Activo !== false);

    if (posCategoriaFiltros) {
        const categorias = ["todas", ...new Set(activos.map(p => p.Categoria || "Sin categoría"))];
        posCategoriaFiltros.innerHTML = "";
        categorias.forEach(cat => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "socio-filtro-btn" + (posCategoriaActiva === cat ? " active" : "");
            btn.textContent = cat === "todas" ? "Todas" : cat;
            btn.addEventListener("click", () => {
                posCategoriaActiva = cat;
                renderizarCatalogoPOS();
            });
            posCategoriaFiltros.appendChild(btn);
        });
    }

    const termino = (facturaProductoBusqueda?.value || "").trim().toLowerCase();
    const filtrados = activos.filter(p => {
        const cat = p.Categoria || "Sin categoría";
        const coincideCat = posCategoriaActiva === "todas" || cat === posCategoriaActiva;
        const coincideTexto = !termino ||
            String(p.Nombre || "").toLowerCase().includes(termino) ||
            String(p.CodigoProducto || "").toLowerCase().includes(termino);
        return coincideCat && coincideTexto;
    });

    posCatalogoGrid.innerHTML = "";

    if (filtrados.length === 0) {
        const vacio = document.createElement("p");
        vacio.className = "texto-secundario";
        vacio.textContent = "No hay productos que coincidan con el filtro.";
        posCatalogoGrid.appendChild(vacio);
        return;
    }

    filtrados.forEach(prod => {
        const stock = Number(prod.Stock) || 0;
        const enCarritoItem = detalleFactura.find(d => d.codigo === prod.CodigoProducto);
        const cantCarrito = enCarritoItem ? Number(enCarritoItem.cantidad) : 0;

        const card = document.createElement("button");
        card.type = "button";
        card.className = "pos-producto-card" + (cantCarrito > 0 ? " en-carrito" : "");
        card.dataset.codigo = prod.CodigoProducto;
        card.disabled = stock <= 0 || cantCarrito >= stock;

        if (cantCarrito > 0) {
            const badge = document.createElement("span");
            badge.className = "pos-card-badge-carrito";
            badge.textContent = String(cantCarrito);
            card.appendChild(badge);
        }

        const catEl = document.createElement("span");
        catEl.className = "pos-card-categoria";
        catEl.textContent = prod.Categoria || "General";

        const nomEl = document.createElement("strong");
        nomEl.className = "pos-card-nombre";
        nomEl.textContent = prod.Nombre;

        const codEl = document.createElement("span");
        codEl.className = "pos-card-codigo";
        codEl.textContent = prod.CodigoProducto;

        const pie = document.createElement("div");
        pie.className = "pos-card-pie";

        const precioEl = document.createElement("span");
        precioEl.className = "pos-card-precio";
        precioEl.textContent = `C$ ${formatearMoneda(prod.Precio)}`;

        const stockEl = document.createElement("span");
        stockEl.className = "pos-card-stock" + (stock <= 0 ? " agotado" : "");
        stockEl.textContent = stock <= 0 ? "Agotado" : `Stock: ${stock}`;

        pie.append(precioEl, stockEl);
        card.append(catEl, nomEl, codEl, pie);

        card.addEventListener("click", () => {
            if (registrandoFactura) return;
            facturaProductoBusqueda.value = prod.CodigoProducto;
            facturaCantidad.value = "1";
            agregarProducto();
            renderizarCatalogoPOS();
        });

        posCatalogoGrid.appendChild(card);
    });
}

facturaProductoBusqueda?.addEventListener("input", renderizarCatalogoPOS);

document.addEventListener("click", function(event) {
    if (event.target.closest("#detalleFacturaBody .quitar-linea-factura") ||
        event.target.closest("#detalleFacturaBody input")) {
        window.setTimeout(renderizarCatalogoPOS, 0);
    }
});

// ========================================
// WIZARD DE CREACIÓN / EDICIÓN Y VISTAS
// ========================================

let idFacturaEditando = null;
let pasoWizardActual = 1;

const vistaWizardFactura = document.getElementById("vistaWizardFactura");
const seccionHistorialFacturas = document.getElementById("historial");
const btnVerListadoFacturas = document.getElementById("btnVerListadoFacturas");
const btnNuevaFacturaWizard = document.getElementById("btnNuevaFacturaWizard");
const wizardModoEdicionBanner = document.getElementById("wizardModoEdicionBanner");
const wizardModoEdicionTexto = document.getElementById("wizardModoEdicionTexto");
const btnCancelarEdicionWizard = document.getElementById("btnCancelarEdicionWizard");
const btnEditarFacturaDetalle = document.getElementById("btnEditarFacturaDetalle");

function salirModoEdicionWizard() {
    idFacturaEditando = null;
    if (wizardModoEdicionBanner) wizardModoEdicionBanner.hidden = true;
    if (guardarFactura) {
        guardarFactura.innerHTML = '<i class="bi bi-check2-circle" aria-hidden="true"></i> Guardar factura';
    }
}

function mostrarVistaFacturacion(vista) {
    const esListado = vista === "listado";
    if (vistaWizardFactura) vistaWizardFactura.hidden = esListado;
    if (seccionHistorialFacturas) seccionHistorialFacturas.hidden = !esListado;

    if (btnVerListadoFacturas) {
        btnVerListadoFacturas.classList.toggle("btn-primario", esListado);
        btnVerListadoFacturas.classList.toggle("btn-secundario", !esListado);
    }
    if (btnNuevaFacturaWizard) {
        btnNuevaFacturaWizard.classList.toggle("btn-primario", !esListado);
        btnNuevaFacturaWizard.classList.toggle("btn-secundario", esListado);
    }
}

function validarPasoWizard(pasoActual) {
    if (pasoActual === 1) {
        if (!facturaCliente.value) {
            SouvanicUI.notificar("Seleccioná un cliente para continuar al paso de productos.", "warning");
            facturaCliente.focus();
            return false;
        }
    }
    if (pasoActual === 2) {
        if (detalleFactura.length === 0) {
            SouvanicUI.notificar("Agregá al menos un producto antes de pasar a pagos.", "warning");
            facturaProductoBusqueda?.focus();
            return false;
        }
    }
    return true;
}

function irAPasoWizard(nuevoPaso, validar = true) {
    const destino = Math.max(1, Math.min(3, Number(nuevoPaso) || 1));

    if (validar && destino > pasoWizardActual) {
        for (let p = pasoWizardActual; p < destino; p++) {
            if (!validarPasoWizard(p)) return;
        }
    }

    pasoWizardActual = destino;

    [1, 2, 3].forEach(num => {
        const seccion = document.getElementById(`wizardPaso${num}`);
        if (seccion) seccion.hidden = num !== destino;
    });

    document.querySelectorAll(".wizard-paso-btn").forEach(btn => {
        const target = Number(btn.dataset.wizardTarget);
        btn.classList.toggle("active", target === destino);
        btn.classList.toggle("completado", target < destino);
    });
}

function iniciarEdicionFactura(datosCompletos) {
    if (!datosCompletos || !datosCompletos.factura) return;

    const fac = datosCompletos.factura;
    const items = Array.isArray(datosCompletos.detalle) ? datosCompletos.detalle : [];
    const pagos = Array.isArray(datosCompletos.pagos) ? datosCompletos.pagos : [];

    limpiarFormularioFactura();
    idFacturaEditando = fac.IdFactura;

    if (wizardModoEdicionBanner) wizardModoEdicionBanner.hidden = false;
    if (wizardModoEdicionTexto) {
        wizardModoEdicionTexto.textContent = `Editando factura N.° ${fac.IdFactura}`;
    }
    if (guardarFactura) {
        guardarFactura.innerHTML = '<i class="bi bi-check2-circle" aria-hidden="true"></i> Guardar cambios';
    }

    // Precargar cliente
    aplicarFiltroClientes("");
    if (facturaCliente) {
        facturaCliente.value = fac.IdCliente || "";
    }

    // Precargar productos
    detalleFactura = items.map(it => {
        const prodCatalogo = productosDisponibles.find(p => p.CodigoProducto === it.CodigoProducto);
        const cantidad = Number(it.Cantidad) || 1;
        const precio = Number(it.PrecioUnitario) || 0;
        const lineaBruto = redondearMoneda(cantidad * precio);
        const descMonto = Number(it.DescuentoAplicado || 0);
        const descPorc = lineaBruto > 0 ? redondearMoneda((descMonto / lineaBruto) * 100) : 0;

        return {
            codigo: it.CodigoProducto,
            nombre: it.Producto || prodCatalogo?.Nombre || it.CodigoProducto,
            precio,
            cantidad,
            stockDisponible: (Number(prodCatalogo?.Stock) || 0) + cantidad,
            descuentoPorcentaje: descPorc
        };
    });

    // Precargar descuento general e impuesto
    const subtotalBruto = detalleFactura.reduce((s, d) => s + d.precio * d.cantidad, 0);
    const descProd = detalleFactura.reduce((s, d) => s + (d.precio * d.cantidad) * (d.descuentoPorcentaje / 100), 0);
    const descGen = Math.max(0, redondearMoneda(Number(fac.Descuento || 0) - descProd));
    descuentoGeneralFactura.value = descGen;

    const baseImp = Math.max(0, redondearMoneda(subtotalBruto - descProd - descGen));
    const impPorc = baseImp > 0 ? redondearMoneda((Number(fac.Impuesto || 0) / baseImp) * 100) : 0;
    impuestoFactura.value = impPorc;

    // Precargar pagos activos
    pagosFactura = pagos
        .filter(p => p.Estado !== "Anulado")
        .map(p => ({
            metodo: p.Metodo,
            monto: Number(p.Monto),
            montoRecibido: p.MontoRecibido !== null && p.MontoRecibido !== undefined ? Number(p.MontoRecibido) : null,
            vuelto: p.Vuelto !== null && p.Vuelto !== undefined ? Number(p.Vuelto) : null,
            banco: p.Banco || "",
            bancoDestino: p.BancoDestino || "",
            cuentaDestino: p.CuentaDestino || "",
            referencia: p.Referencia || "",
            observaciones: p.Observaciones || ""
        }));

    mostrarDetalleFactura();
    renderPagos();
    actualizarResumenPagos();

    cerrarModalDetalle();
    mostrarVistaFacturacion("wizard");
    irAPasoWizard(1, false);
}

btnCancelarEdicionWizard?.addEventListener("click", () => {
    limpiarFormularioFactura();
    if (new URLSearchParams(window.location.search).has("editar")) {
        window.location.href = "historial-facturas.html";
        return;
    }
    irAPasoWizard(1, false);
});

btnEditarFacturaDetalle?.addEventListener("click", () => {
    if (!facturaDetalleActual || !esAdminFacturacion) return;
    if (!vistaWizardFactura) {
        window.location.href = `facturas.html?editar=${encodeURIComponent(facturaDetalleActual.factura.IdFactura)}`;
        return;
    }
    iniciarEdicionFactura(facturaDetalleActual);
});

document.querySelectorAll(".wizard-paso-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        irAPasoWizard(Number(btn.dataset.wizardTarget), true);
    });
});

document.querySelectorAll("[data-wizard-next]").forEach(btn => {
    btn.addEventListener("click", () => {
        irAPasoWizard(Number(btn.dataset.wizardNext), true);
    });
});

document.querySelectorAll("[data-wizard-prev]").forEach(btn => {
    btn.addEventListener("click", () => {
        irAPasoWizard(Number(btn.dataset.wizardPrev), false);
    });
});

// ========================================
// INICIALIZACIÓN
// ========================================

configurarRolFacturacion();
actualizarCamposPago();
renderPagos();
mostrarDetalleFactura();
if (vistaWizardFactura) {
    irAPasoWizard(1, false);
}

(async function iniciarFacturacion() {
    if (vistaWizardFactura) {
        await Promise.all([
            cargarClientes(),
            cargarProductos()
        ]);

        const idEditarParam = Number(new URLSearchParams(window.location.search).get("editar"));
        if (Number.isInteger(idEditarParam) && idEditarParam > 0 && esAdminFacturacion) {
            try {
                const resp = await fetchAutenticado(`/facturas/${encodeURIComponent(idEditarParam)}/completo`);
                if (resp.ok) {
                    const datosCompletos = await resp.json();
                    iniciarEdicionFactura(datosCompletos);
                }
            } catch (e) {
                console.error("Error al cargar factura para edición:", e);
            }
        }
    }

    if (historialFacturasBody) {
        await cargarHistorialFacturas();
    }
})();
