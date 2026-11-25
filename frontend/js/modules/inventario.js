"use strict";

// ==========================================
// ELEMENTOS DEL INVENTARIO
// ==========================================

const inventarioStockBody = document.getElementById("inventarioStockBody");
const buscarInventario = document.getElementById("buscarInventario");
const filtroCategoriaInventario = document.getElementById("filtroCategoriaInventario");
const filtroEstadoInventario = document.getElementById("filtroEstadoInventario");
const contadorInventario = document.getElementById("contadorInventario");

const paginacionInventario = document.getElementById("paginacionInventario");
const paginaInventarioAnterior = document.getElementById("paginaInventarioAnterior");
const paginaInventarioSiguiente = document.getElementById("paginaInventarioSiguiente");
const paginaInventarioInfo = document.getElementById("paginaInventarioInfo");

const historialMovimientosBody = document.getElementById("historialMovimientosBody");
const contadorHistorial = document.getElementById("contadorHistorial");
const historialFechaDesde = document.getElementById("historialFechaDesde");
const historialFechaHasta = document.getElementById("historialFechaHasta");
const historialProducto = document.getElementById("historialProducto");
const historialTipo = document.getElementById("historialTipo");
const historialUsuario = document.getElementById("historialUsuario");
const btnLimpiarHistorial = document.getElementById("btnLimpiarHistorial");

const paginacionHistorial = document.getElementById("paginacionHistorial");
const paginaHistorialAnterior = document.getElementById("paginaHistorialAnterior");
const paginaHistorialSiguiente = document.getElementById("paginaHistorialSiguiente");
const paginaHistorialInfo = document.getElementById("paginaHistorialInfo");

const btnAbrirMovimientoInventario = document.getElementById("btnAbrirMovimientoInventario");
const modalMovimientoInventario = document.getElementById("modalMovimientoInventario");
const cerrarModalMovimiento = document.getElementById("cerrarModalMovimiento");
const formMovimiento = document.getElementById("formMovimiento");
const productoMovimientoBusqueda = document.getElementById("productoMovimientoBusqueda");
const listaProductosMovimiento = document.getElementById("listaProductosMovimiento");
const movimientoProductoInfo = document.getElementById("movimientoProductoInfo");
const tipoMovimiento = document.getElementById("tipoMovimiento");
const cantidadMovimiento = document.getElementById("cantidadMovimiento");
const movimientoStockActual = document.getElementById("movimientoStockActual");
const movimientoStockResultante = document.getElementById("movimientoStockResultante");
const motivoMovimiento = document.getElementById("motivoMovimiento");
const observacionesMovimiento = document.getElementById("observacionesMovimiento");
const movimientoResponsable = document.getElementById("movimientoResponsable");
const guardarMovimiento = document.getElementById("guardarMovimiento");
const cancelarMovimiento = document.getElementById("cancelarMovimiento");

const modalStockMinimo = document.getElementById("modalStockMinimo");
const cerrarStockMinimo = document.getElementById("cerrarStockMinimo");
const stockMinimoProductoTexto = document.getElementById("stockMinimoProducto");
const formStockMinimo = document.getElementById("formStockMinimo");
const stockMinimoInput = document.getElementById("stockMinimoInput");
const guardarStockMinimo = document.getElementById("guardarStockMinimo");
const cancelarStockMinimo = document.getElementById("cancelarStockMinimo");

const modalResumenInventario = document.getElementById("modalResumenInventario");
const cerrarResumenInventario = document.getElementById("cerrarResumenInventario");
const resumenInventarioTitulo = document.getElementById("resumenInventarioTitulo");
const resumenInventarioDescripcion = document.getElementById("resumenInventarioDescripcion");
const resumenInventarioContador = document.getElementById("resumenInventarioContador");
const resumenInventarioBuscar = document.getElementById("resumenInventarioBuscar");
const resumenInventarioBody = document.getElementById("resumenInventarioBody");
const paginacionResumenInventario = document.getElementById("paginacionResumenInventario");
const paginaResumenAnterior = document.getElementById("paginaResumenAnterior");
const paginaResumenSiguiente = document.getElementById("paginaResumenSiguiente");
const paginaResumenInfo = document.getElementById("paginaResumenInfo");

const btnNuevaCategoriaInventario = document.getElementById("btnNuevaCategoriaInventario");
const btnEliminarCategoriaInventario = document.getElementById("btnEliminarCategoriaInventario");
const panelNuevaCategoriaInventario = document.getElementById("panelNuevaCategoriaInventario");
const nuevaCategoriaInventarioInput = document.getElementById("nuevaCategoriaInventarioInput");
const btnGuardarCategoriaInventario = document.getElementById("btnGuardarCategoriaInventario");
const btnCancelarCategoriaInventario = document.getElementById("btnCancelarCategoriaInventario");
const categoriaInventarioError = document.getElementById("categoriaInventarioError");

const modalComprobanteMovimiento = document.getElementById("modalComprobanteMovimiento");
const comprobanteTipo = document.getElementById("comprobanteTipo");
const comprobanteTitulo = document.getElementById("comprobanteTitulo");
const comprobanteConsecutivo = document.getElementById("comprobanteConsecutivo");
const comprobanteDetalle = document.getElementById("comprobanteDetalle");
const comprobanteEmision = document.getElementById("comprobanteEmision");
const btnCerrarComprobante = document.getElementById("btnCerrarComprobante");
const btnImprimirComprobante = document.getElementById("btnImprimirComprobante");

const btnExportarInventario = document.getElementById("btnExportarInventario");
const menuExportacion = document.getElementById("menuExportacion");

const btnAgregarProductoInventario = document.getElementById("btnAgregarProductoInventario");
const modalProductoInventario = document.getElementById("modalProductoInventario");
const cerrarProductoInventario = document.getElementById("cerrarProductoInventario");
const cancelarProductoInventario = document.getElementById("cancelarProductoInventario");
const formProductoInventario = document.getElementById("formProductoInventario");
const codigoProductoInventario = document.getElementById("codigoProductoInventario");
const nombreProductoInventario = document.getElementById("nombreProductoInventario");
const descripcionProductoInventario = document.getElementById("descripcionProductoInventario");
const categoriaProductoInventario = document.getElementById("categoriaProductoInventario");
const btnNuevaCategoriaModalInventario = document.getElementById("btnNuevaCategoriaModalInventario");
const campoNuevaCategoriaModalInventario = document.getElementById("campoNuevaCategoriaModalInventario");
const nuevaCategoriaModalInventarioInput = document.getElementById("nuevaCategoriaModalInventarioInput");
const btnGuardarCategoriaModalInventario = document.getElementById("btnGuardarCategoriaModalInventario");
const btnCancelarCategoriaModalInventario = document.getElementById("btnCancelarCategoriaModalInventario");
const categoriaModalInventarioError = document.getElementById("categoriaModalInventarioError");
const precioProductoInventario = document.getElementById("precioProductoInventario");
const stockProductoInventario = document.getElementById("stockProductoInventario");
const guardarProductoInventario = document.getElementById("guardarProductoInventario");

// ==========================================
// CONSTANTES Y ESTADO
// ==========================================

const PRODUCTOS_POR_PAGINA = 10;
const MOVIMIENTOS_POR_PAGINA = 10;
const RESUMEN_POR_PAGINA = 8;

const TIPOS_MOVIMIENTO = [
    "Entrada",
    "Salida",
    "Ajuste positivo",
    "Ajuste negativo"
];

const CONFIG_RESUMEN = {
    todos: "Todos los productos",
    unidades: "Unidades en stock",
    bajo: "Productos con stock bajo",
    agotado: "Productos agotados"
};

let productosInventario = [];
let movimientosInventario = [];

let ordenInventario = { campo: "producto", direccion: "asc" };
let paginaInventario = 1;

let paginaHistorial = 1;

let resumenTipo = "todos";
let resumenFiltro = "";
let paginaResumen = 1;

let productoMovimientoSeleccionado = null;
let productoStockMinimo = null;

let registrandoMovimiento = false;
let guardandoStockMinimo = false;
let guardandoProductoInventario = false;

// ==========================================
// UTILIDADES
// ==========================================

function normalizarTexto(valor) {

    return String(valor ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function numeroSeguro(valor) {

    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : 0;
}

function usuarioSesionNombre() {

    try {

        const usuario = JSON.parse(sessionStorage.getItem("usuario"));

        return usuario?.nombre || "Usuario no identificado";

    } catch (error) {

        return "Usuario no identificado";
    }
}

function claveFechaLocal(fecha) {

    const objeto = fecha instanceof Date ? fecha : new Date(fecha);

    if (Number.isNaN(objeto.getTime())) {
        return "";
    }

    const anio = objeto.getFullYear();
    const mes = String(objeto.getMonth() + 1).padStart(2, "0");
    const dia = String(objeto.getDate()).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
}

function formatearFechaHora(fecha) {

    const objeto = new Date(fecha);

    if (Number.isNaN(objeto.getTime())) {
        return "Sin fecha";
    }

    return objeto.toLocaleString("es-NI");
}

// ==========================================
// ESTADO DEL STOCK POR PRODUCTO
// ==========================================

function stockMinimoDe(producto) {

    return Math.max(0, Math.trunc(numeroSeguro(producto?.StockMinimo)));
}

function obtenerEstadoStock(producto) {

    const stock = numeroSeguro(producto?.Stock);
    const minimo = stockMinimoDe(producto);

    if (stock <= 0) {
        return {
            clave: "agotado",
            etiqueta: "Agotado",
            clase: "stock-agotado"
        };
    }

    if (stock <= minimo) {
        return {
            clave: "bajo",
            etiqueta: "Stock bajo",
            clase: "stock-bajo"
        };
    }

    return {
        clave: "disponible",
        etiqueta: "Disponible",
        clase: "stock-disponible"
    };
}

function esTipoSuma(tipo) {

    return tipo === "Entrada" || tipo === "Ajuste positivo";
}

// ==========================================
// MODALES: APERTURA Y CIERRE
// ==========================================

function sincronizarBloqueoScroll() {

    const hayModalAbierto = Boolean(
        document.querySelector(".modal.active") ||
        (modalComprobanteMovimiento && !modalComprobanteMovimiento.hidden)
    );

    document.body.classList.toggle("modal-dashboard-abierto", hayModalAbierto);
}

function abrirModal(elemento) {

    if (!elemento) return;

    elemento.classList.add("active");
    sincronizarBloqueoScroll();
}

function cerrarModal(elemento) {

    if (!elemento) return;

    elemento.classList.remove("active");
    sincronizarBloqueoScroll();
}

function configurarCierreModal(elemento, botonCerrar) {

    if (!elemento) return;

    elemento.addEventListener("click", function(event) {
        if (event.target === elemento) {
            cerrarModal(elemento);
        }
    });

    if (botonCerrar) {
        botonCerrar.addEventListener("click", function() {
            cerrarModal(elemento);
        });
    }
}

configurarCierreModal(modalMovimientoInventario, cerrarModalMovimiento);
configurarCierreModal(modalStockMinimo, cerrarStockMinimo);
configurarCierreModal(modalResumenInventario, cerrarResumenInventario);
configurarCierreModal(modalProductoInventario, cerrarProductoInventario);
cerrarProductoInventario?.addEventListener("click", () => {
    if (typeof cerrarEditorCategoriaModalInventario === "function") {
        cerrarEditorCategoriaModalInventario();
    }
});

// ==========================================
// CATEGORÍAS
// ==========================================

function categoriasInventarioActuales() {

    return window.CategoriasSouvanic.listar(
        productosInventario
            .map(producto => producto.Categoria)
            .filter(Boolean)
    );
}

function categoriasConProductosInventario() {

    return productosInventario
        .map(producto => String(producto.Categoria || "").trim())
        .filter(Boolean);
}

function actualizarCategorias() {

    const seleccionada = filtroCategoriaInventario.value;

    const categorias = window.CategoriasSouvanic.listar(
        productosInventario
            .map(producto => producto.Categoria)
            .filter(Boolean)
    );

    filtroCategoriaInventario.innerHTML = "";

    const opcionTodas = document.createElement("option");
    opcionTodas.value = "";
    opcionTodas.textContent = "Todas las categorías";

    filtroCategoriaInventario.appendChild(opcionTodas);

    categorias.forEach(categoria => {

        const opcion = document.createElement("option");

        opcion.value = categoria;
        opcion.textContent = categoria;

        filtroCategoriaInventario.appendChild(opcion);
    });

    const coincidencia = categorias.find(categoria =>
        normalizarTexto(categoria) === normalizarTexto(seleccionada)
    );

    if (coincidencia) {
        filtroCategoriaInventario.value = coincidencia;
    }

    actualizarBotonEliminarCategoria();
}

function actualizarBotonEliminarCategoria() {

    if (!btnEliminarCategoriaInventario) return;

    btnEliminarCategoriaInventario.disabled =
        !filtroCategoriaInventario.value;
}

function mostrarErrorCategoriaInventario(mensaje) {

    categoriaInventarioError.textContent = mensaje;
    categoriaInventarioError.hidden = !mensaje;
}

function cerrarEditorCategoriaInventario() {

    panelNuevaCategoriaInventario.hidden = true;
    nuevaCategoriaInventarioInput.value = "";
    mostrarErrorCategoriaInventario("");
}

if (!esAdministrador()) {

    btnNuevaCategoriaInventario.hidden = true;

    if (btnEliminarCategoriaInventario) {
        btnEliminarCategoriaInventario.hidden = true;
    }

    if (btnAgregarProductoInventario) {
        btnAgregarProductoInventario.hidden = true;
    }
}

filtroCategoriaInventario.addEventListener(
    "change",
    function() {
        actualizarBotonEliminarCategoria();
        paginaInventario = 1;
        renderizarInventario();
    }
);

btnNuevaCategoriaInventario.addEventListener("click", function() {

    panelNuevaCategoriaInventario.hidden = false;
    nuevaCategoriaInventarioInput.value = "";
    mostrarErrorCategoriaInventario("");
    nuevaCategoriaInventarioInput.focus();
});

btnCancelarCategoriaInventario.addEventListener(
    "click",
    cerrarEditorCategoriaInventario
);

btnGuardarCategoriaInventario.addEventListener("click", function() {

    const resultado = window.CategoriasSouvanic.crear(
        nuevaCategoriaInventarioInput.value,
        categoriasInventarioActuales()
    );

    if (!resultado.ok) {
        mostrarErrorCategoriaInventario(resultado.mensaje);
        nuevaCategoriaInventarioInput.focus();
        return;
    }

    actualizarCategorias();
    filtroCategoriaInventario.value = resultado.nombre;
    actualizarBotonEliminarCategoria();
    cerrarEditorCategoriaInventario();
    paginaInventario = 1;
    renderizarInventario();
});

btnEliminarCategoriaInventario.addEventListener("click", async function() {

    const categoria = filtroCategoriaInventario.value.trim();

    if (!categoria) {
        SouvanicUI.notificar(
            "Seleccioná una categoría en el filtro para eliminarla.",
            "warning"
        );
        return;
    }

    const categoriasConProductos = categoriasConProductosInventario();
    const clave = window.CategoriasSouvanic.normalizar(categoria);
    const asociada = categoriasConProductos.some(nombre =>
        window.CategoriasSouvanic.normalizar(nombre) === clave
    );

    if (asociada) {
        SouvanicUI.notificar(
            `La categoría "${categoria}" tiene productos asociados. Asigná esos productos a otra categoría antes de eliminarla.`,
            "error",
            { titulo: "Categoría en uso", persistente: true }
        );
        return;
    }

    const confirmado = await SouvanicUI.confirmar({
        titulo: "Eliminar categoría",
        mensaje: `¿Querés eliminar la categoría "${categoria}"?`,
        detalle: "Solo se quitará de los selectores. No se eliminará ningún producto ni se modificará su categoría.",
        confirmar: "Eliminar categoría",
        cancelar: "Cancelar",
        peligro: true,
        icono: "bi-trash3-fill"
    });

    if (!confirmado) return;

    const resultado = window.CategoriasSouvanic.eliminar(
        categoria,
        categoriasConProductos
    );

    if (!resultado.ok) {
        SouvanicUI.notificar(resultado.mensaje, "error", {
            titulo: "No se pudo eliminar"
        });
        return;
    }

    actualizarCategorias();
    filtroCategoriaInventario.value = "";
    actualizarBotonEliminarCategoria();
    paginaInventario = 1;
    renderizarInventario();

    SouvanicUI.notificar(
        `La categoría "${resultado.nombre}" fue eliminada de los selectores.`,
        "success",
        { titulo: "Categoría eliminada" }
    );
});

nuevaCategoriaInventarioInput.addEventListener("keydown", function(evento) {

    if (evento.key === "Enter") {
        evento.preventDefault();
        btnGuardarCategoriaInventario.click();
    }
});

window.addEventListener("storage", evento => {

    if (!evento.key || !evento.key.startsWith("souvanic_categorias")) return;

    actualizarCategorias();
    renderizarInventario();
});

// ==========================================
// RESUMEN DEL INVENTARIO
// ==========================================

function calcularResumenInventario() {

    let unidades = 0;
    let stockBajo = 0;
    let agotados = 0;

    productosInventario.forEach(producto => {

        const stock = numeroSeguro(producto.Stock);
        const estado = obtenerEstadoStock(producto);

        unidades += Math.max(0, stock);

        if (estado.clave === "agotado") {
            agotados++;
        } else if (estado.clave === "bajo") {
            stockBajo++;
        }
    });

    return {
        productos: productosInventario.length,
        unidades,
        stockBajo,
        agotados
    };
}

function actualizarResumen() {

    const resumen = calcularResumenInventario();

    document.getElementById("resumenTotalProductos").textContent =
        resumen.productos.toLocaleString("es-NI");

    document.getElementById("resumenUnidades").textContent =
        resumen.unidades.toLocaleString("es-NI");

    document.getElementById("resumenStockBajo").textContent =
        resumen.stockBajo.toLocaleString("es-NI");

    document.getElementById("resumenAgotados").textContent =
        resumen.agotados.toLocaleString("es-NI");
}

// ==========================================
// TABLA DE STOCK
// ==========================================

const COMPARADORES_INVENTARIO = {
    codigo: (a, b) =>
        String(a.CodigoProducto ?? "").localeCompare(
            String(b.CodigoProducto ?? ""),
            "es",
            { numeric: true, sensitivity: "base" }
        ),
    producto: (a, b) =>
        String(a.Nombre ?? "").localeCompare(
            String(b.Nombre ?? ""),
            "es",
            { sensitivity: "base" }
        ),
    categoria: (a, b) =>
        String(a.Categoria ?? "").localeCompare(
            String(b.Categoria ?? ""),
            "es",
            { sensitivity: "base" }
        ),
    stock: (a, b) => numeroSeguro(a.Stock) - numeroSeguro(b.Stock),
    minimo: (a, b) => stockMinimoDe(a) - stockMinimoDe(b),
    estado: (a, b) => {
        const orden = { agotado: 0, bajo: 1, disponible: 2 };
        return orden[obtenerEstadoStock(a).clave] -
            orden[obtenerEstadoStock(b).clave];
    }
};

function obtenerProductosFiltrados() {

    const texto = normalizarTexto(buscarInventario.value.trim());
    const categoria = normalizarTexto(filtroCategoriaInventario.value);
    const estado = filtroEstadoInventario.value;

    return productosInventario.filter(producto => {

        const coincideTexto = !texto || normalizarTexto(
            `${producto.CodigoProducto ?? ""} ` +
            `${producto.Nombre ?? ""} ` +
            `${producto.Categoria ?? ""}`
        ).includes(texto);

        const coincideCategoria =
            !categoria ||
            normalizarTexto(producto.Categoria) === categoria;

        const coincideEstado =
            !estado ||
            obtenerEstadoStock(producto).clave === estado;

        return coincideTexto && coincideCategoria && coincideEstado;
    });
}

function ordenarProductos(lista) {

    const comparador = COMPARADORES_INVENTARIO[ordenInventario.campo] ||
        COMPARADORES_INVENTARIO.producto;

    const factor = ordenInventario.direccion === "desc" ? -1 : 1;

    return [...lista].sort((a, b) => comparador(a, b) * factor);
}

function crearBotonAccionInventario(accion, codigo, icono, texto) {

    const boton = document.createElement("button");
    const elementoIcono = document.createElement("i");

    boton.type = "button";
    boton.className = "btn-accion-mini";
    boton.dataset.accion = accion;
    boton.dataset.codigo = codigo;

    elementoIcono.className = icono;
    elementoIcono.setAttribute("aria-hidden", "true");

    boton.append(elementoIcono, document.createTextNode(" " + texto));

    return boton;
}

function crearFilaStock(producto) {

    const fila = document.createElement("tr");

    const codigo = producto.CodigoProducto ?? "";
    const stock = numeroSeguro(producto.Stock);
    const minimo = stockMinimoDe(producto);
    const estado = obtenerEstadoStock(producto);

    const celdaCodigo = document.createElement("td");
    const codigoTexto = document.createElement("span");

    codigoTexto.className = "codigo-producto";
    codigoTexto.textContent = codigo;

    celdaCodigo.appendChild(codigoTexto);

    const celdaNombre = document.createElement("td");
    const nombreTexto = document.createElement("span");

    nombreTexto.textContent = producto.Nombre ?? "";

    celdaNombre.appendChild(nombreTexto);

    if (producto.Activo === false) {

        const inactivo = document.createElement("span");

        inactivo.className = "estado-producto estado-inactivo";
        inactivo.textContent = "Inactivo";

        celdaNombre.appendChild(inactivo);
    }

    const celdaCategoria = document.createElement("td");
    const categoriaTexto = document.createElement("span");

    categoriaTexto.className = "badge-categoria";
    categoriaTexto.textContent = producto.Categoria || "Sin categoría";

    celdaCategoria.appendChild(categoriaTexto);

    const celdaStock = document.createElement("td");
    const stockNumero = document.createElement("span");

    stockNumero.className = "stock-numero";
    stockNumero.textContent = stock;

    celdaStock.appendChild(stockNumero);

    const celdaMinimo = document.createElement("td");
    celdaMinimo.textContent = minimo;

    const celdaEstado = document.createElement("td");
    const estadoTexto = document.createElement("span");

    estadoTexto.className = estado.clase;
    estadoTexto.textContent = estado.etiqueta;

    celdaEstado.appendChild(estadoTexto);

    const celdaAcciones = document.createElement("td");
    celdaAcciones.className = "col-chevron";

    const btnChevron = document.createElement("button");
    btnChevron.type = "button";
    btnChevron.className = "socio-chevron-btn";
    btnChevron.setAttribute("aria-label", `Opciones de ${producto.Nombre || codigo}`);
    btnChevron.innerHTML = '<i class="bi bi-chevron-right" aria-hidden="true"></i>';
    celdaAcciones.appendChild(btnChevron);

    fila.className = "socio-fila";
    fila.tabIndex = 0;
    fila.setAttribute("role", "button");
    fila._productoInventario = producto;

    fila.append(
        celdaCodigo,
        celdaNombre,
        celdaCategoria,
        celdaStock,
        celdaMinimo,
        celdaEstado,
        celdaAcciones
    );

    return fila;
}

function actualizarIndicadoresOrden() {

    document.querySelectorAll("[data-orden-inventario]").forEach(boton => {

        const th = boton.closest("th");
        const campo = boton.dataset.ordenInventario;
        const activo = campo === ordenInventario.campo;
        const icono = boton.querySelector("i");

        if (th) {
            th.setAttribute(
                "aria-sort",
                activo
                    ? (ordenInventario.direccion === "asc"
                        ? "ascending"
                        : "descending")
                    : "none"
            );
        }

        if (icono) {

            icono.className = "bi " + (
                activo
                    ? (ordenInventario.direccion === "asc"
                        ? "bi-sort-down"
                        : "bi-sort-up")
                    : "bi-arrow-down-up"
            );
        }
    });
}

function configurarPaginacion(contenedor, anterior, info, siguiente, pagina, totalPaginas, etiqueta, total) {

    if (!contenedor) return;

    contenedor.hidden = totalPaginas <= 1;

    if (anterior) anterior.disabled = pagina <= 1;
    if (siguiente) siguiente.disabled = pagina >= totalPaginas;

    if (info) {
        info.textContent =
            `Página ${pagina} de ${totalPaginas} · ` +
            `${total.toLocaleString("es-NI")} ${etiqueta}`;
    }
}

function renderizarInventario() {

    const filtrados = ordenarProductos(obtenerProductosFiltrados());

    inventarioStockBody.innerHTML = "";

    if (productosInventario.length === 0) {

        mostrarEstadoTabla(inventarioStockBody, {
            tipo: "vacio",
            colspan: 7,
            icono: "bi-box-seam",
            titulo: "No hay productos registrados",
            mensaje: "Agregá productos al catálogo para controlar el stock."
        });

        contadorInventario.textContent = "Sin productos para mostrar";
        configurarPaginacion(
            paginacionInventario,
            paginaInventarioAnterior,
            paginaInventarioInfo,
            paginaInventarioSiguiente,
            1,
            1,
            "productos",
            0
        );

        actualizarIndicadoresOrden();
        return;
    }

    if (filtrados.length === 0) {

        mostrarEstadoTabla(inventarioStockBody, {
            tipo: "vacio",
            colspan: 7,
            icono: "bi-search",
            titulo: "Sin resultados",
            mensaje: "No hay productos que coincidan con los filtros aplicados."
        });

        contadorInventario.textContent =
            "0 de " +
            `${productosInventario.length.toLocaleString("es-NI")} productos`;

        configurarPaginacion(
            paginacionInventario,
            paginaInventarioAnterior,
            paginaInventarioInfo,
            paginaInventarioSiguiente,
            1,
            1,
            "productos",
            0
        );

        actualizarIndicadoresOrden();
        return;
    }

    const totalPaginas = Math.max(
        1,
        Math.ceil(filtrados.length / PRODUCTOS_POR_PAGINA)
    );

    paginaInventario = Math.min(Math.max(1, paginaInventario), totalPaginas);

    const inicio = (paginaInventario - 1) * PRODUCTOS_POR_PAGINA;
    const pagina = filtrados.slice(inicio, inicio + PRODUCTOS_POR_PAGINA);

    const fragmento = document.createDocumentFragment();

    pagina.forEach(producto => {
        fragmento.appendChild(crearFilaStock(producto));
    });

    inventarioStockBody.appendChild(fragmento);

    contadorInventario.textContent =
        `${filtrados.length.toLocaleString("es-NI")} de ` +
        `${productosInventario.length.toLocaleString("es-NI")} productos` +
        (filtrados.length !== productosInventario.length
            ? " (filtros aplicados)"
            : "");

    configurarPaginacion(
        paginacionInventario,
        paginaInventarioAnterior,
        paginaInventarioInfo,
        paginaInventarioSiguiente,
        paginaInventario,
        totalPaginas,
        "productos",
        filtrados.length
    );

    actualizarIndicadoresOrden();
}

// ==========================================
// HISTORIAL DE MOVIMIENTOS
// ==========================================

function obtenerMovimientosFiltrados() {

    const desde = historialFechaDesde.value;
    const hasta = historialFechaHasta.value;
    const producto = normalizarTexto(historialProducto.value.trim());
    const tipo = historialTipo.value;
    const responsable = normalizarTexto(historialUsuario.value.trim());

    return movimientosInventario.filter(movimiento => {

        const claveFecha = claveFechaLocal(movimiento.Fecha);

        if (desde && (!claveFecha || claveFecha < desde)) {
            return false;
        }

        if (hasta && (!claveFecha || claveFecha > hasta)) {
            return false;
        }

        if (producto) {

            const textoProducto = normalizarTexto(
                `${movimiento.CodigoProducto ?? ""} ` +
                `${movimiento.Producto ?? ""}`
            );

            if (!textoProducto.includes(producto)) {
                return false;
            }
        }

        if (tipo && movimiento.TipoMovimiento !== tipo) {
            return false;
        }

        if (
            responsable &&
            !normalizarTexto(movimiento.Responsable).includes(responsable)
        ) {
            return false;
        }

        return true;
    });
}

function crearCeldaMotivo(movimiento) {

    const celda = document.createElement("td");
    const motivo = document.createElement("span");

    motivo.textContent = movimiento.Motivo || "—";
    celda.appendChild(motivo);

    if (movimiento.Observaciones) {

        const observaciones = document.createElement("small");

        observaciones.className = "movimiento-observaciones";
        observaciones.textContent = movimiento.Observaciones;

        celda.appendChild(observaciones);
    }

    return celda;
}

function crearCeldaFactura(movimiento) {

    const celda = document.createElement("td");

    if (!movimiento.IdFactura) {
        celda.textContent = "—";
        return celda;
    }

    const etiqueta = document.createElement("span");

    etiqueta.className = "badge-factura-num";
    etiqueta.textContent = `N° ${movimiento.IdFactura}`;

    celda.appendChild(etiqueta);

    if (movimiento.EstadoFactura === "Anulada") {

        const anulada = document.createElement("span");

        anulada.className = "estado-producto estado-inactivo";
        anulada.textContent = "Anulada";

        celda.appendChild(anulada);
    }

    return celda;
}

function crearFilaHistorial(movimiento) {

    const fila = document.createElement("tr");

    const suma = esTipoSuma(movimiento.TipoMovimiento);
    const claseMovimiento = suma ? "movimiento-entrada" : "movimiento-salida";
    const cantidad = numeroSeguro(movimiento.Cantidad);

    const celdas = [
        formatearFechaHora(movimiento.Fecha),
        movimiento.CodigoProducto ?? "",
        movimiento.Producto ?? "",
        movimiento.TipoMovimiento ?? "",
        (suma ? "+" : "-") + cantidad,
        movimiento.Responsable || "Sin registrar"
    ];

    celdas.forEach((valor, indice) => {

        const celda = document.createElement("td");

        celda.textContent = valor;

        if (indice === 3 || indice === 4) {
            celda.classList.add(claseMovimiento);
        }

        fila.appendChild(celda);
    });

    fila.appendChild(crearCeldaMotivo(movimiento));
    fila.appendChild(crearCeldaFactura(movimiento));

    const celdaComprobante = document.createElement("td");
    celdaComprobante.className = "col-chevron";
    const botonComprobante = document.createElement("button");

    botonComprobante.type = "button";
    botonComprobante.className = "socio-chevron-btn btn-comprobante";
    botonComprobante.dataset.movimiento = String(movimiento.IdMovimiento);
    botonComprobante.setAttribute(
        "aria-label",
        "Ver comprobante del movimiento"
    );
    botonComprobante.innerHTML = '<i class="bi bi-chevron-right" aria-hidden="true"></i>';

    celdaComprobante.appendChild(botonComprobante);
    fila.className = "socio-fila";
    fila.tabIndex = 0;
    fila.setAttribute("role", "button");
    fila.dataset.movimiento = String(movimiento.IdMovimiento);
    fila.appendChild(celdaComprobante);

    return fila;
}

function renderizarHistorial() {

    const filtrados = obtenerMovimientosFiltrados();

    historialMovimientosBody.innerHTML = "";

    if (movimientosInventario.length === 0) {

        mostrarEstadoTabla(historialMovimientosBody, {
            tipo: "vacio",
            colspan: 9,
            icono: "bi-clock-history",
            titulo: "Sin movimientos registrados",
            mensaje: "Las entradas, salidas y ajustes aparecerán acá."
        });

        contadorHistorial.textContent = "Sin movimientos registrados";

        configurarPaginacion(
            paginacionHistorial,
            paginaHistorialAnterior,
            paginaHistorialInfo,
            paginaHistorialSiguiente,
            1,
            1,
            "movimientos",
            0
        );

        return;
    }

    if (filtrados.length === 0) {

        mostrarEstadoTabla(historialMovimientosBody, {
            tipo: "vacio",
            colspan: 9,
            icono: "bi-search",
            titulo: "Sin resultados",
            mensaje: "No hay movimientos que coincidan con los filtros aplicados."
        });

        contadorHistorial.textContent =
            "0 de " +
            `${movimientosInventario.length.toLocaleString("es-NI")} movimientos`;

        configurarPaginacion(
            paginacionHistorial,
            paginaHistorialAnterior,
            paginaHistorialInfo,
            paginaHistorialSiguiente,
            1,
            1,
            "movimientos",
            0
        );

        return;
    }

    const totalPaginas = Math.max(
        1,
        Math.ceil(filtrados.length / MOVIMIENTOS_POR_PAGINA)
    );

    paginaHistorial = Math.min(Math.max(1, paginaHistorial), totalPaginas);

    const inicio = (paginaHistorial - 1) * MOVIMIENTOS_POR_PAGINA;
    const pagina = filtrados.slice(inicio, inicio + MOVIMIENTOS_POR_PAGINA);

    const fragmento = document.createDocumentFragment();

    pagina.forEach(movimiento => {
        fragmento.appendChild(crearFilaHistorial(movimiento));
    });

    historialMovimientosBody.appendChild(fragmento);

    contadorHistorial.textContent =
        `${filtrados.length.toLocaleString("es-NI")} de ` +
        `${movimientosInventario.length.toLocaleString("es-NI")} movimientos` +
        (filtrados.length !== movimientosInventario.length
            ? " (filtros aplicados)"
            : "");

    configurarPaginacion(
        paginacionHistorial,
        paginaHistorialAnterior,
        paginaHistorialInfo,
        paginaHistorialSiguiente,
        paginaHistorial,
        totalPaginas,
        "movimientos",
        filtrados.length
    );
}

// ==========================================
// CARGA DE DATOS
// ==========================================

async function cargarProductosInventario() {

    mostrarEstadoTabla(inventarioStockBody, {
        tipo: "cargando",
        colspan: 7,
        mensaje: "Cargando inventario..."
    });

    contadorInventario.textContent = "Cargando inventario...";

    try {

        const respuesta = await fetchAutenticado("/productos");

        if (!respuesta.ok) {
            throw new Error("No se pudieron cargar los productos.");
        }

        const productos = await respuesta.json();

        productosInventario = Array.isArray(productos) ? productos : [];

        actualizarCategorias();
        actualizarResumen();
        actualizarOpcionesMovimiento();
        renderizarInventario();

        if (modalResumenInventario.classList.contains("active")) {
            renderizarResumenInventario();
        }

    } catch (error) {

        console.error("Error al cargar productos:", error);

        productosInventario = [];

        actualizarCategorias();
        actualizarResumen();
        actualizarOpcionesMovimiento();

        contadorInventario.textContent = "No se pudo cargar el inventario";

        mostrarEstadoTabla(inventarioStockBody, {
            tipo: "error",
            colspan: 7,
            titulo: "No se pudo cargar el inventario",
            mensaje: "Verificá la conexión con el servidor e intentá nuevamente."
        });

        if (sessionStorage.getItem("token")) {
            SouvanicUI.notificar(error.message, "error");
        }
    }
}

async function cargarHistorialInventario() {

    mostrarEstadoTabla(historialMovimientosBody, {
        tipo: "cargando",
        colspan: 9,
        mensaje: "Cargando movimientos..."
    });

    contadorHistorial.textContent = "Cargando movimientos...";

    try {

        const respuesta = await fetchAutenticado("/inventario/movimientos");

        if (!respuesta.ok) {
            throw new Error("No se pudo cargar el historial.");
        }

        const movimientos = await respuesta.json();

        movimientosInventario = Array.isArray(movimientos) ? movimientos : [];

        renderizarHistorial();

    } catch (error) {

        console.error("Error al cargar historial:", error);

        movimientosInventario = [];

        contadorHistorial.textContent = "No se pudo cargar el historial";

        mostrarEstadoTabla(historialMovimientosBody, {
            tipo: "error",
            colspan: 9,
            titulo: "No se pudo cargar el historial",
            mensaje: "Verificá la conexión con el servidor e intentá nuevamente."
        });
    }
}

// ==========================================
// MODAL DE MOVIMIENTO
// ==========================================

function textoOpcionProducto(producto) {

    return `${producto.CodigoProducto ?? ""} — ${producto.Nombre ?? ""}`;
}

function actualizarOpcionesMovimiento() {

    if (!listaProductosMovimiento) return;

    listaProductosMovimiento.innerHTML = "";

    const fragmento = document.createDocumentFragment();

    productosInventario.forEach(producto => {

        const opcion = document.createElement("option");

        opcion.value = textoOpcionProducto(producto);
        opcion.label = `Stock: ${numeroSeguro(producto.Stock)}`;

        fragmento.appendChild(opcion);
    });

    listaProductosMovimiento.appendChild(fragmento);

    if (productoMovimientoSeleccionado) {

        const actualizado = productosInventario.find(producto =>
            producto.CodigoProducto ===
            productoMovimientoSeleccionado.CodigoProducto
        );

        if (actualizado) {
            productoMovimientoSeleccionado = actualizado;
            productoMovimientoBusqueda.value = textoOpcionProducto(actualizado);
        } else {
            productoMovimientoSeleccionado = null;
        }

        actualizarVistaMovimiento();
    }
}

function resolverProductoMovimiento(texto) {

    const limpio = String(texto || "").trim();

    if (!limpio) {
        return null;
    }

    const directo = productosInventario.find(producto =>
        producto.CodigoProducto === limpio ||
        textoOpcionProducto(producto) === limpio
    );

    if (directo) {
        return directo;
    }

    const clave = normalizarTexto(limpio);

    const coincidencias = productosInventario.filter(producto =>
        normalizarTexto(textoOpcionProducto(producto)).includes(clave)
    );

    return coincidencias.length === 1 ? coincidencias[0] : null;
}

function calcularStockResultante() {

    const producto = productoMovimientoSeleccionado;

    if (!producto) {
        return null;
    }

    const cantidad = Number(cantidadMovimiento.value);

    if (
        !tipoMovimiento.value ||
        !Number.isSafeInteger(cantidad) ||
        cantidad <= 0
    ) {
        return null;
    }

    const stock = numeroSeguro(producto.Stock);

    return esTipoSuma(tipoMovimiento.value)
        ? stock + cantidad
        : stock - cantidad;
}

function actualizarVistaMovimiento() {

    const producto = productoMovimientoSeleccionado;

    if (!producto) {

        movimientoProductoInfo.textContent =
            "Seleccioná un producto de la lista para ver su stock actual.";

        movimientoStockActual.textContent = "—";
        movimientoStockResultante.textContent = "—";
        movimientoStockResultante.classList.remove("stock-preview-error");

        return;
    }

    movimientoProductoInfo.textContent =
        `${producto.Nombre} · Código ${producto.CodigoProducto} · ` +
        `Categoría ${producto.Categoria || "sin categoría"} · ` +
        `Stock actual ${numeroSeguro(producto.Stock)} · ` +
        `Stock mínimo ${stockMinimoDe(producto)}`;

    movimientoStockActual.textContent =
        numeroSeguro(producto.Stock).toLocaleString("es-NI");

    const resultante = calcularStockResultante();

    if (resultante === null) {

        movimientoStockResultante.textContent = "—";
        movimientoStockResultante.classList.remove("stock-preview-error");
        return;
    }

    movimientoStockResultante.textContent =
        resultante.toLocaleString("es-NI");

    movimientoStockResultante.classList.toggle(
        "stock-preview-error",
        resultante < 0
    );
}

function reiniciarFormularioMovimiento() {

    formMovimiento.reset();

    productoMovimientoSeleccionado = null;

    if (productoMovimientoBusqueda) {
        productoMovimientoBusqueda.value = "";
    }

    actualizarVistaMovimiento();
}

function abrirModalMovimiento(codigo) {

    if (!esAdministrador()) {
        return;
    }

    reiniciarFormularioMovimiento();

    movimientoResponsable.textContent = usuarioSesionNombre();

    actualizarOpcionesMovimiento();

    if (codigo) {

        const producto = productosInventario.find(item =>
            item.CodigoProducto === codigo
        );

        if (producto) {

            productoMovimientoSeleccionado = producto;
            productoMovimientoBusqueda.value = textoOpcionProducto(producto);
        }
    }

    actualizarVistaMovimiento();
    abrirModal(modalMovimientoInventario);

    productoMovimientoBusqueda.focus({ preventScroll: true });
}

btnAbrirMovimientoInventario.addEventListener("click", function() {
    abrirModalMovimiento(null);
});

productoMovimientoBusqueda.addEventListener("input", function() {

    productoMovimientoSeleccionado =
        resolverProductoMovimiento(productoMovimientoBusqueda.value);

    actualizarVistaMovimiento();
});

productoMovimientoBusqueda.addEventListener("change", function() {

    productoMovimientoSeleccionado =
        resolverProductoMovimiento(productoMovimientoBusqueda.value);

    actualizarVistaMovimiento();
});

tipoMovimiento.addEventListener("change", actualizarVistaMovimiento);
cantidadMovimiento.addEventListener("input", actualizarVistaMovimiento);

cancelarMovimiento.addEventListener("click", function() {

    if (registrandoMovimiento) return;

    cerrarModal(modalMovimientoInventario);
});

formMovimiento.addEventListener("submit", async function(event) {

    event.preventDefault();

    if (registrandoMovimiento) {
        return;
    }

    const producto = productoMovimientoSeleccionado;
    const tipo = tipoMovimiento.value;
    const cantidad = Number(cantidadMovimiento.value);
    const motivo = motivoMovimiento.value.trim();
    const observaciones = observacionesMovimiento.value.trim();

    if (!producto) {

        SouvanicUI.notificar(
            "Seleccioná un producto válido de la lista.",
            "warning"
        );

        productoMovimientoBusqueda.focus();
        return;
    }

    if (!TIPOS_MOVIMIENTO.includes(tipo)) {

        SouvanicUI.notificar(
            "Seleccioná un tipo de movimiento válido.",
            "warning"
        );

        tipoMovimiento.focus();
        return;
    }

    if (!Number.isSafeInteger(cantidad) || cantidad <= 0) {

        SouvanicUI.notificar(
            "Ingresá una cantidad entera mayor que cero.",
            "warning"
        );

        cantidadMovimiento.focus();
        return;
    }

    if (!motivo) {

        SouvanicUI.notificar(
            "El motivo del movimiento es obligatorio.",
            "warning"
        );

        motivoMovimiento.focus();
        return;
    }

    if (motivo.length > 255 || observaciones.length > 255) {

        SouvanicUI.notificar(
            "El motivo y las observaciones no pueden superar 255 caracteres.",
            "warning"
        );

        return;
    }

    const resultante = calcularStockResultante();

    if (resultante !== null && resultante < 0) {

        SouvanicUI.notificar(
            `Stock insuficiente. El producto tiene ` +
            `${numeroSeguro(producto.Stock)} unidades disponibles.`,
            "error",
            { titulo: "No se puede registrar el movimiento" }
        );

        cantidadMovimiento.focus();
        return;
    }

    registrandoMovimiento = true;
    guardarMovimiento.disabled = true;
    btnAbrirMovimientoInventario.disabled = true;

    try {

        const respuesta = await fetchAutenticado(
            "/inventario/movimientos",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    codigoProducto: producto.CodigoProducto,
                    tipoMovimiento: tipo,
                    cantidad,
                    motivo,
                    observaciones
                })
            }
        );

        let datos = {};

        try {
            datos = await respuesta.json();
        } catch (error) {
            datos = {};
        }

        if (!respuesta.ok) {
            throw new Error(
                datos.mensaje ||
                "No se pudo registrar el movimiento."
            );
        }

        SouvanicUI.notificar(
            `Movimiento registrado. Stock anterior: ${datos.stockAnterior}. Stock nuevo: ${datos.stockNuevo}.`,
            "success",
            { titulo: "Inventario actualizado" }
        );

        cerrarModal(modalMovimientoInventario);
        reiniciarFormularioMovimiento();

        await Promise.all([
            cargarProductosInventario(),
            cargarHistorialInventario()
        ]);

    } catch (error) {

        console.error("Error al registrar movimiento:", error);

        if (sessionStorage.getItem("token")) {
            SouvanicUI.notificar(error.message, "error");
        }

    } finally {

        registrandoMovimiento = false;
        guardarMovimiento.disabled = false;
        btnAbrirMovimientoInventario.disabled = false;
    }
});

// ==========================================
// MODAL DE STOCK MÍNIMO
// ==========================================

function abrirModalStockMinimo(codigo) {

    if (!esAdministrador()) {
        return;
    }

    const producto = productosInventario.find(item =>
        item.CodigoProducto === codigo
    );

    if (!producto) {
        return;
    }

    productoStockMinimo = producto;

    stockMinimoProductoTexto.textContent =
        `${producto.Nombre} · Código ${producto.CodigoProducto} · ` +
        `Stock actual ${numeroSeguro(producto.Stock)}`;

    stockMinimoInput.value = stockMinimoDe(producto);

    abrirModal(modalStockMinimo);
    stockMinimoInput.focus({ preventScroll: true });
    stockMinimoInput.select();
}

cancelarStockMinimo.addEventListener("click", function() {

    if (guardandoStockMinimo) return;

    cerrarModal(modalStockMinimo);
});

formStockMinimo.addEventListener("submit", async function(event) {

    event.preventDefault();

    if (guardandoStockMinimo || !productoStockMinimo) {
        return;
    }

    const valor = Number(stockMinimoInput.value);

    if (!Number.isSafeInteger(valor) || valor < 0) {

        SouvanicUI.notificar(
            "El stock mínimo debe ser un número entero igual o mayor que cero.",
            "warning"
        );

        stockMinimoInput.focus();
        return;
    }

    if (valor === stockMinimoDe(productoStockMinimo)) {
        cerrarModal(modalStockMinimo);
        return;
    }

    guardandoStockMinimo = true;
    guardarStockMinimo.disabled = true;

    const codigo = productoStockMinimo.CodigoProducto;

    try {

        const respuesta = await fetchAutenticado(
            `/productos/${encodeURIComponent(codigo)}/stock-minimo`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ stockMinimo: valor })
            }
        );

        let datos = {};

        try {
            datos = await respuesta.json();
        } catch (error) {
            datos = {};
        }

        if (!respuesta.ok) {
            throw new Error(
                datos.mensaje ||
                "No se pudo actualizar el stock mínimo."
            );
        }

        const actualizado = productosInventario.find(item =>
            item.CodigoProducto === codigo
        );

        if (actualizado) {
            actualizado.StockMinimo = valor;
        }

        actualizarResumen();
        renderizarInventario();

        if (modalResumenInventario.classList.contains("active")) {
            renderizarResumenInventario();
        }

        cerrarModal(modalStockMinimo);
        productoStockMinimo = null;

        SouvanicUI.notificar(
            `Stock mínimo actualizado a ${valor} unidades.`,
            "success"
        );

    } catch (error) {

        console.error("Error al actualizar stock mínimo:", error);

        if (sessionStorage.getItem("token")) {
            SouvanicUI.notificar(error.message, "error");
        }

    } finally {

        guardandoStockMinimo = false;
        guardarStockMinimo.disabled = false;
    }
});

// ==========================================
// MODAL DE ALTA DE PRODUCTO
// ==========================================

function mostrarErrorCategoriaModalInventario(mensaje) {
    if (!categoriaModalInventarioError) return;
    categoriaModalInventarioError.textContent = mensaje || "";
    categoriaModalInventarioError.hidden = !mensaje;
}

function cerrarEditorCategoriaModalInventario() {
    if (campoNuevaCategoriaModalInventario) {
        campoNuevaCategoriaModalInventario.hidden = true;
    }
    if (nuevaCategoriaModalInventarioInput) {
        nuevaCategoriaModalInventarioInput.value = "";
    }
    mostrarErrorCategoriaModalInventario("");
}

function actualizarCategoriasProductoInventario(seleccionForzada = null) {

    if (!categoriaProductoInventario) return;

    const seleccionada = seleccionForzada ?? categoriaProductoInventario.value;
    const categorias = categoriasInventarioActuales();

    categoriaProductoInventario.innerHTML = "";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Seleccionar categoría";
    categoriaProductoInventario.appendChild(placeholder);

    categorias.forEach(categoria => {

        const opcion = document.createElement("option");
        opcion.value = categoria;
        opcion.textContent = categoria;

        categoriaProductoInventario.appendChild(opcion);
    });

    const coincidencia = categorias.find(categoria =>
        normalizarTexto(categoria) === normalizarTexto(seleccionada)
    );

    categoriaProductoInventario.value = coincidencia || "";
}

if (btnNuevaCategoriaModalInventario) {
    if (!esAdministrador()) {
        btnNuevaCategoriaModalInventario.hidden = true;
    }

    btnNuevaCategoriaModalInventario.addEventListener("click", () => {
        if (!campoNuevaCategoriaModalInventario) return;
        campoNuevaCategoriaModalInventario.hidden = false;
        if (nuevaCategoriaModalInventarioInput) {
            nuevaCategoriaModalInventarioInput.value = "";
            mostrarErrorCategoriaModalInventario("");
            nuevaCategoriaModalInventarioInput.focus();
        }
    });
}

if (btnCancelarCategoriaModalInventario) {
    btnCancelarCategoriaModalInventario.addEventListener("click", cerrarEditorCategoriaModalInventario);
}

if (btnGuardarCategoriaModalInventario) {
    btnGuardarCategoriaModalInventario.addEventListener("click", () => {
        const nombreIngresado = nuevaCategoriaModalInventarioInput ? nuevaCategoriaModalInventarioInput.value : "";
        const resultado = window.CategoriasSouvanic.crear(
            nombreIngresado,
            categoriasInventarioActuales()
        );

        if (!resultado.ok) {
            mostrarErrorCategoriaModalInventario(resultado.mensaje);
            nuevaCategoriaModalInventarioInput?.focus();
            return;
        }

        actualizarCategorias();
        actualizarCategoriasProductoInventario(resultado.nombre);
        cerrarEditorCategoriaModalInventario();

        SouvanicUI.notificar(
            `Categoría "${resultado.nombre}" creada y seleccionada.`,
            "success"
        );

        precioProductoInventario?.focus();
    });
}

if (nuevaCategoriaModalInventarioInput) {
    nuevaCategoriaModalInventarioInput.addEventListener("keydown", evento => {
        if (evento.key === "Enter") {
            evento.preventDefault();
            btnGuardarCategoriaModalInventario?.click();
        } else if (evento.key === "Escape") {
            evento.preventDefault();
            cerrarEditorCategoriaModalInventario();
        }
    });
}

function abrirModalProductoInventario() {

    if (!esAdministrador()) {
        return;
    }

    formProductoInventario.reset();
    cerrarEditorCategoriaModalInventario();
    actualizarCategoriasProductoInventario();
    abrirModal(modalProductoInventario);

    codigoProductoInventario.focus({ preventScroll: true });
}

btnAgregarProductoInventario.addEventListener(
    "click",
    abrirModalProductoInventario
);

cancelarProductoInventario.addEventListener("click", function() {

    if (guardandoProductoInventario) return;

    cerrarEditorCategoriaModalInventario();
    cerrarModal(modalProductoInventario);
});

formProductoInventario.addEventListener("submit", async function(event) {

    event.preventDefault();

    if (!esAdministrador()) {

        SouvanicUI.notificar(
            "No tenés permisos para agregar productos.",
            "warning"
        );
        return;
    }

    if (guardandoProductoInventario) {
        return;
    }

    const codigo = codigoProductoInventario.value.trim();
    const nombre = nombreProductoInventario.value.trim();
    const categoria = categoriaProductoInventario.value.trim();
    const descripcion = descripcionProductoInventario.value.trim();
    const precioTexto = precioProductoInventario.value.trim();
    const stockTexto = stockProductoInventario.value.trim();

    if (!codigo || !nombre || !categoria || precioTexto === "" || stockTexto === "") {

        SouvanicUI.notificar(
            "Completá el código, el nombre, la categoría, el precio y el stock inicial.",
            "warning"
        );
        return;
    }

    const precio = Number(precioTexto);
    const stock = Number(stockTexto);

    if (!Number.isFinite(precio) || precio <= 0) {

        SouvanicUI.notificar(
            "El precio debe ser mayor que cero.",
            "warning"
        );

        precioProductoInventario.focus();
        return;
    }

    if (!Number.isSafeInteger(stock) || stock < 0) {

        SouvanicUI.notificar(
            "El stock inicial debe ser un número entero mayor o igual a cero.",
            "warning"
        );

        stockProductoInventario.focus();
        return;
    }

    const codigoDuplicado = productosInventario.some(producto =>
        String(producto.CodigoProducto || "").trim().toLowerCase() ===
        codigo.toLowerCase()
    );

    if (codigoDuplicado) {

        SouvanicUI.notificar(
            "Ya existe un producto con ese código.",
            "warning"
        );

        codigoProductoInventario.focus();
        return;
    }

    guardandoProductoInventario = true;
    guardarProductoInventario.disabled = true;

    try {

        const respuesta = await fetchAutenticado("/productos", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                codigo,
                nombre,
                categoria,
                descripcion,
                precio,
                stock
            })
        });

        let datos = {};

        try {
            datos = await respuesta.json();
        } catch (error) {
            datos = {};
        }

        if (!respuesta.ok) {
            throw new Error(
                datos.mensaje ||
                "No se pudo registrar el producto."
            );
        }

        cerrarModal(modalProductoInventario);
        formProductoInventario.reset();

        SouvanicUI.notificar(
            `El producto "${nombre}" fue agregado al inventario.`,
            "success",
            { titulo: "Producto registrado" }
        );

        await cargarProductosInventario();

    } catch (error) {

        console.error("Error al registrar producto:", error);

        if (sessionStorage.getItem("token")) {
            SouvanicUI.notificar(error.message, "error");
        }

    } finally {

        guardandoProductoInventario = false;
        guardarProductoInventario.disabled = false;
    }
});

// ==========================================
// ACCIONES DE LA TABLA DE STOCK
// ==========================================

let productoInventarioSeleccionado = null;
const inventarioOpcionesModal = document.getElementById("inventarioOpcionesModal");
const cerrarInventarioOpcionesBtn = document.getElementById("cerrarInventarioOpciones");

function cerrarModalOpcionesInventario() {
    if (inventarioOpcionesModal) {
        inventarioOpcionesModal.classList.remove("active");
    }
}

function abrirModalOpcionesInventario(producto) {
    if (!inventarioOpcionesModal) return;
    productoInventarioSeleccionado = producto;

    document.getElementById("inventarioOpcionesNombre").textContent = producto.Nombre || "Producto";
    document.getElementById("inventarioOpcionesCodigo").textContent = `Código: ${producto.CodigoProducto || "-"}`;
    document.getElementById("inventarioOpcionesCategoria").textContent = producto.Categoria || "Sin categoría";
    document.getElementById("inventarioOpcionesStock").textContent = `${numeroSeguro(producto.Stock)} unidades`;
    document.getElementById("inventarioOpcionesMinimo").textContent = `${stockMinimoDe(producto)} unidades`;

    const accionesCont = document.getElementById("inventarioOpcionesAcciones");
    if (accionesCont) {
        accionesCont.style.display = esAdministrador() ? "flex" : "none";
    }

    inventarioOpcionesModal.classList.add("active");
}

cerrarInventarioOpcionesBtn?.addEventListener("click", cerrarModalOpcionesInventario);
inventarioOpcionesModal?.addEventListener("click", e => {
    if (e.target === inventarioOpcionesModal) cerrarModalOpcionesInventario();
});

document.getElementById("btnInventarioOpcionMovimiento")?.addEventListener("click", () => {
    if (!productoInventarioSeleccionado || !esAdministrador()) return;
    const codigo = productoInventarioSeleccionado.CodigoProducto;
    cerrarModalOpcionesInventario();
    abrirModalMovimiento(codigo);
});

document.getElementById("btnInventarioOpcionMinimo")?.addEventListener("click", () => {
    if (!productoInventarioSeleccionado || !esAdministrador()) return;
    const codigo = productoInventarioSeleccionado.CodigoProducto;
    cerrarModalOpcionesInventario();
    abrirModalStockMinimo(codigo);
});

inventarioStockBody.addEventListener("click", function(event) {
    const fila = event.target.closest("tr.socio-fila");
    if (!fila || !fila._productoInventario) return;
    abrirModalOpcionesInventario(fila._productoInventario);
});

inventarioStockBody.addEventListener("keydown", function(event) {
    if (event.key !== "Enter" && event.key !== " ") return;
    const fila = event.target.closest("tr.socio-fila");
    if (!fila || !fila._productoInventario) return;
    event.preventDefault();
    abrirModalOpcionesInventario(fila._productoInventario);
});

buscarInventario.addEventListener("input", function() {
    paginaInventario = 1;
    renderizarInventario();
});

filtroEstadoInventario.addEventListener("change", function() {
    paginaInventario = 1;
    renderizarInventario();
});

document.querySelectorAll("[data-orden-inventario]").forEach(boton => {

    boton.addEventListener("click", function() {

        const campo = boton.dataset.ordenInventario;

        if (ordenInventario.campo === campo) {

            ordenInventario.direccion =
                ordenInventario.direccion === "asc" ? "desc" : "asc";

        } else {

            ordenInventario.campo = campo;
            ordenInventario.direccion = "asc";
        }

        paginaInventario = 1;
        renderizarInventario();
    });
});

paginaInventarioAnterior.addEventListener("click", function() {

    if (paginaInventario <= 1) return;

    paginaInventario--;
    renderizarInventario();
});

paginaInventarioSiguiente.addEventListener("click", function() {

    paginaInventario++;
    renderizarInventario();
});

// ==========================================
// FILTROS Y PAGINACIÓN DEL HISTORIAL
// ==========================================

function reiniciarPaginaHistorial() {
    paginaHistorial = 1;
    renderizarHistorial();
}

historialFechaDesde.addEventListener("change", reiniciarPaginaHistorial);
historialFechaHasta.addEventListener("change", reiniciarPaginaHistorial);
historialTipo.addEventListener("change", reiniciarPaginaHistorial);

historialProducto.addEventListener("input", function() {
    paginaHistorial = 1;
    renderizarHistorial();
});

historialUsuario.addEventListener("input", function() {
    paginaHistorial = 1;
    renderizarHistorial();
});

btnLimpiarHistorial.addEventListener("click", function() {

    historialFechaDesde.value = "";
    historialFechaHasta.value = "";
    historialProducto.value = "";
    historialTipo.value = "";
    historialUsuario.value = "";

    paginaHistorial = 1;
    renderizarHistorial();
});

paginaHistorialAnterior.addEventListener("click", function() {

    if (paginaHistorial <= 1) return;

    paginaHistorial--;
    renderizarHistorial();
});

paginaHistorialSiguiente.addEventListener("click", function() {

    paginaHistorial++;
    renderizarHistorial();
});

// ==========================================
// MODAL REUTILIZABLE DE RESUMEN
// ==========================================

function productosDelResumen() {

    let lista = productosInventario;

    if (resumenTipo === "unidades") {

        lista = lista.filter(producto =>
            numeroSeguro(producto.Stock) > 0
        );
    }

    if (resumenTipo === "bajo" || resumenTipo === "agotado") {

        lista = lista.filter(producto =>
            obtenerEstadoStock(producto).clave === resumenTipo
        );
    }

    if (resumenFiltro) {

        const texto = normalizarTexto(resumenFiltro);

        lista = lista.filter(producto =>
            normalizarTexto(
                `${producto.CodigoProducto ?? ""} ` +
                `${producto.Nombre ?? ""} ` +
                `${producto.Categoria ?? ""}`
            ).includes(texto)
        );
    }

    return [...lista].sort((a, b) =>
        String(a.Nombre ?? "").localeCompare(
            String(b.Nombre ?? ""),
            "es",
            { sensitivity: "base" }
        )
    );
}

function crearFilaResumen(producto) {

    const fila = document.createElement("tr");
    const estado = obtenerEstadoStock(producto);

    const valores = [
        producto.CodigoProducto ?? "",
        producto.Nombre ?? "",
        producto.Categoria || "Sin categoría",
        numeroSeguro(producto.Stock),
        stockMinimoDe(producto)
    ];

    valores.forEach((valor, indice) => {

        const celda = document.createElement("td");

        if (indice === 0) {

            const codigo = document.createElement("span");

            codigo.className = "codigo-producto";
            codigo.textContent = valor;

            celda.appendChild(codigo);

        } else {
            celda.textContent = valor;
        }

        fila.appendChild(celda);
    });

    const celdaEstado = document.createElement("td");
    const estadoTexto = document.createElement("span");

    estadoTexto.className = estado.clase;
    estadoTexto.textContent = estado.etiqueta;

    celdaEstado.appendChild(estadoTexto);
    fila.appendChild(celdaEstado);

    return fila;
}

function renderizarResumenInventario() {

    const lista = productosDelResumen();
    const totalPaginas = Math.max(
        1,
        Math.ceil(lista.length / RESUMEN_POR_PAGINA)
    );

    paginaResumen = Math.min(Math.max(1, paginaResumen), totalPaginas);

    const inicio = (paginaResumen - 1) * RESUMEN_POR_PAGINA;
    const pagina = lista.slice(inicio, inicio + RESUMEN_POR_PAGINA);

    resumenInventarioBody.innerHTML = "";

    if (lista.length === 0) {

        mostrarEstadoTabla(resumenInventarioBody, {
            tipo: "vacio",
            colspan: 6,
            icono: "bi-search",
            titulo: "Sin productos",
            mensaje: resumenFiltro
                ? "No hay productos que coincidan con la búsqueda."
                : "No hay productos en esta categoría del resumen."
        });

        resumenInventarioContador.textContent = "0 productos";

        configurarPaginacion(
            paginacionResumenInventario,
            paginaResumenAnterior,
            paginaResumenInfo,
            paginaResumenSiguiente,
            1,
            1,
            "productos",
            0
        );

        return;
    }

    const fragmento = document.createDocumentFragment();

    pagina.forEach(producto => {
        fragmento.appendChild(crearFilaResumen(producto));
    });

    resumenInventarioBody.appendChild(fragmento);

    resumenInventarioContador.textContent =
        `${lista.length.toLocaleString("es-NI")} productos · ` +
        `${lista.reduce((suma, producto) =>
            suma + Math.max(0, numeroSeguro(producto.Stock)), 0)
            .toLocaleString("es-NI")} unidades disponibles`;

    configurarPaginacion(
        paginacionResumenInventario,
        paginaResumenAnterior,
        paginaResumenInfo,
        paginaResumenSiguiente,
        paginaResumen,
        totalPaginas,
        "productos",
        lista.length
    );
}

function abrirResumenInventario(tipo) {

    const resumen = calcularResumenInventario();

    resumenTipo = CONFIG_RESUMEN[tipo] ? tipo : "todos";
    resumenFiltro = "";
    paginaResumen = 1;

    resumenInventarioBuscar.value = "";

    resumenInventarioTitulo.textContent = CONFIG_RESUMEN[resumenTipo];

    if (resumenTipo === "todos") {

        resumenInventarioDescripcion.textContent =
            `Productos registrados en el catálogo: ` +
            `${resumen.productos.toLocaleString("es-NI")}.`;

    } else if (resumenTipo === "unidades") {

        resumenInventarioDescripcion.textContent =
            `Unidades físicas disponibles en total: ` +
            `${resumen.unidades.toLocaleString("es-NI")}. ` +
            "Se listan los productos con existencias.";

    } else if (resumenTipo === "bajo") {

        resumenInventarioDescripcion.textContent =
            `Productos con stock mayor que cero e igual o inferior a ` +
            `su mínimo configurado: ` +
            `${resumen.stockBajo.toLocaleString("es-NI")}.`;

    } else {

        resumenInventarioDescripcion.textContent =
            `Productos sin unidades disponibles: ` +
            `${resumen.agotados.toLocaleString("es-NI")}.`;
    }

    renderizarResumenInventario();
    abrirModal(modalResumenInventario);
}

document.querySelectorAll("[data-resumen-inventario]").forEach(tarjeta => {

    tarjeta.addEventListener("click", function() {
        abrirResumenInventario(tarjeta.dataset.resumenInventario);
    });
});

resumenInventarioBuscar.addEventListener("input", function() {

    resumenFiltro = resumenInventarioBuscar.value;
    paginaResumen = 1;

    renderizarResumenInventario();
});

paginaResumenAnterior.addEventListener("click", function() {

    if (paginaResumen <= 1) return;

    paginaResumen--;
    renderizarResumenInventario();
});

paginaResumenSiguiente.addEventListener("click", function() {

    paginaResumen++;
    renderizarResumenInventario();
});

// ==========================================
// COMPROBANTES DE MOVIMIENTO
// ==========================================

function crearResumenComprobante(etiqueta, valor, clase) {

    const contenedor = document.createElement("div");
    const titulo = document.createElement("span");
    const numero = document.createElement("strong");

    titulo.textContent = etiqueta;
    numero.textContent = valor;

    if (clase) {
        numero.className = clase;
    }

    contenedor.append(titulo, numero);

    return contenedor;
}

function crearCampoComprobante(etiqueta, valor) {

    const campo = document.createElement("div");
    const titulo = document.createElement("span");
    const contenido = document.createElement("strong");

    campo.className = "comprobante-campo";
    titulo.textContent = etiqueta;
    contenido.textContent = valor;

    campo.append(titulo, contenido);

    return campo;
}

function abrirComprobanteMovimiento(idMovimiento) {

    const movimiento = movimientosInventario.find(item =>
        String(item.IdMovimiento) === String(idMovimiento)
    );

    if (!movimiento) {
        return;
    }

    const suma = esTipoSuma(movimiento.TipoMovimiento);
    const tipo = movimiento.TipoMovimiento || "Movimiento";
    const id = Number(movimiento.IdMovimiento) || 0;

    comprobanteTipo.textContent = tipo;
    comprobanteTipo.className =
        "comprobante-tipo " + (suma ? "entrada" : "salida");

    comprobanteTitulo.textContent =
        `Comprobante de ${tipo.toLowerCase()} de inventario`;

    comprobanteConsecutivo.textContent =
        `Movimiento N° ${String(id).padStart(6, "0")} · ` +
        formatearFechaHora(movimiento.Fecha);

    const resumen = document.createElement("div");

    resumen.className = "comprobante-resumen";

    resumen.append(
        crearResumenComprobante(
            "Stock anterior",
            numeroSeguro(movimiento.StockAnterior).toLocaleString("es-NI")
        ),
        crearResumenComprobante(
            suma ? "Unidades ingresadas" : "Unidades retiradas",
            (suma ? "+" : "-") +
            numeroSeguro(movimiento.Cantidad).toLocaleString("es-NI"),
            suma ? "entrada" : "salida"
        ),
        crearResumenComprobante(
            "Stock nuevo",
            numeroSeguro(movimiento.StockNuevo).toLocaleString("es-NI")
        )
    );

    const campos = document.createElement("div");

    campos.className = "comprobante-campos";

    campos.append(
        crearCampoComprobante("Producto", movimiento.Producto ?? ""),
        crearCampoComprobante("Código", movimiento.CodigoProducto ?? ""),
        crearCampoComprobante("Tipo de movimiento", tipo),
        crearCampoComprobante("Motivo", movimiento.Motivo ?? "")
    );

    if (movimiento.Observaciones) {
        campos.appendChild(
            crearCampoComprobante("Observaciones", movimiento.Observaciones)
        );
    }

    campos.appendChild(
        crearCampoComprobante(
            "Responsable",
            movimiento.Responsable || "Sin registrar"
        )
    );

    if (movimiento.IdFactura) {

        const estadoFactura = movimiento.EstadoFactura
            ? ` · ${movimiento.EstadoFactura}`
            : "";

        campos.appendChild(
            crearCampoComprobante(
                "Factura asociada",
                `N° ${movimiento.IdFactura}${estadoFactura}`
            )
        );
    }

    comprobanteDetalle.replaceChildren(resumen, campos);

    comprobanteEmision.textContent =
        `Registrado por ${movimiento.Responsable || "usuario no registrado"} ` +
        `el ${formatearFechaHora(movimiento.Fecha)}.`;

    modalComprobanteMovimiento.hidden = false;
    sincronizarBloqueoScroll();

    btnCerrarComprobante.focus();
}

function cerrarComprobanteMovimiento() {

    modalComprobanteMovimiento.hidden = true;
    sincronizarBloqueoScroll();
}

historialMovimientosBody.addEventListener("click", function(event) {
    const fila = event.target.closest("tr.socio-fila");
    if (!fila || !fila.dataset.movimiento) return;
    abrirComprobanteMovimiento(fila.dataset.movimiento);
});

historialMovimientosBody.addEventListener("keydown", function(event) {
    if (event.key !== "Enter" && event.key !== " ") return;
    const fila = event.target.closest("tr.socio-fila");
    if (!fila || !fila.dataset.movimiento) return;
    event.preventDefault();
    abrirComprobanteMovimiento(fila.dataset.movimiento);
});

modalComprobanteMovimiento.addEventListener("click", function(event) {

    if (event.target === modalComprobanteMovimiento) {
        cerrarComprobanteMovimiento();
    }
});

btnCerrarComprobante.addEventListener(
    "click",
    cerrarComprobanteMovimiento
);

btnImprimirComprobante.addEventListener("click", function() {

    document.body.classList.add("imprimiendo-comprobante");
    window.print();
});

window.addEventListener("afterprint", function() {
    document.body.classList.remove("imprimiendo-comprobante");
});

// ==========================================
// EXPORTACIONES XLSX
// ==========================================

function cerrarMenuExportacion() {

    menuExportacion.hidden = true;
    btnExportarInventario.setAttribute("aria-expanded", "false");
}

btnExportarInventario.addEventListener("click", function(event) {

    event.stopPropagation();

    const abrir = menuExportacion.hidden;

    menuExportacion.hidden = !abrir;
    btnExportarInventario.setAttribute("aria-expanded", String(abrir));
});

menuExportacion.addEventListener("click", function(event) {

    const boton = event.target.closest("[data-exportacion]");

    if (!boton) {
        return;
    }

    const tipo = boton.dataset.exportacion;

    cerrarMenuExportacion();

    if (tipo === "movimientos") {

        const filtrados = obtenerMovimientosFiltrados();

        if (filtrados.length === 0) {
            SouvanicUI.notificar(
                "No hay movimientos para exportar con los filtros actuales.",
                "warning"
            );
            return;
        }

    } else if (productosInventario.length === 0) {

        SouvanicUI.notificar(
            "No hay productos para exportar.",
            "warning"
        );
        return;
    }

    try {

        switch (tipo) {

            case "stock":
                window.ExportadorXLSX.exportarInventarioXLSX(
                    productosInventario
                );
                break;

            case "listado":
                window.ExportadorXLSX.exportarListadoProductosXLSX(
                    productosInventario
                );
                break;

            case "unidades":
                window.ExportadorXLSX.exportarUnidadesStockXLSX(
                    productosInventario
                );
                break;

            case "movimientos":
                window.ExportadorXLSX.exportarMovimientosInventarioXLSX(
                    obtenerMovimientosFiltrados()
                );
                break;
        }

    } catch (error) {

        console.error("Error al exportar inventario:", error);

        SouvanicUI.notificar(
            "No se pudo generar el archivo Excel.",
            "error"
        );
    }
});

document.addEventListener("click", function(event) {

    if (!event.target.closest(".menu-exportacion")) {
        cerrarMenuExportacion();
    }
});

// ==========================================
// TECLADO
// ==========================================

document.addEventListener("keydown", function(event) {

    if (event.key !== "Escape") {
        return;
    }

    cerrarMenuExportacion();

    if (modalComprobanteMovimiento && !modalComprobanteMovimiento.hidden) {
        cerrarComprobanteMovimiento();
        return;
    }

    if (modalMovimientoInventario.classList.contains("active")) {
        if (!registrandoMovimiento) {
            cerrarModal(modalMovimientoInventario);
        }
        return;
    }

    if (modalStockMinimo.classList.contains("active")) {
        if (!guardandoStockMinimo) {
            cerrarModal(modalStockMinimo);
        }
        return;
    }

    if (modalResumenInventario.classList.contains("active")) {
        cerrarModal(modalResumenInventario);
    }
});

// ==========================================
// INICIAR MÓDULO DE INVENTARIO
// ==========================================

document.addEventListener("DOMContentLoaded", function() {

    const token = sessionStorage.getItem("token");

    if (!token) {
        window.location.replace("index.html");
        return;
    }

    actualizarIndicadoresOrden();

    cargarProductosInventario();
    cargarHistorialInventario();
});
