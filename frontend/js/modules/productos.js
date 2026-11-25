
"use strict";

// ==========================================
// ELEMENTOS DEL MÓDULO DE PRODUCTOS
// ==========================================

const modal = document.getElementById("productModal");
const openModal = document.getElementById("openModal");

if (!esAdministrador() && openModal) {
    openModal.hidden = true;
}



const closeModal = modal?.querySelector(".close-modal");
const cancelBtn = modal?.querySelector(".cancel-btn");
const productForm = document.getElementById("productForm");
const productsBody = document.getElementById("productsBody");
const searchProduct = document.getElementById("searchProduct");
const contadorProductos = document.getElementById("contadorProductos");
const saveBtn = document.querySelector(".save-btn");
const categoriaSelect = document.getElementById("categoria");
const descripcionProducto = document.getElementById("descripcionProducto");
const filtroCategoriaProductos = document.getElementById("filtroCategoriaProductos");
const filtroEstadoProductos = document.getElementById("filtroEstadoProductos");
const paginacionProductos = document.getElementById("paginacionProductos");
const paginaProductosAnterior = document.getElementById("paginaProductosAnterior");
const paginaProductosSiguiente = document.getElementById("paginaProductosSiguiente");
const paginaProductosInfo = document.getElementById("paginaProductosInfo");
const modalDetalleProducto = document.getElementById("modalDetalleProducto");
const detalleProductoContenido = document.getElementById("detalleProductoContenido");
const btnNuevaCategoria = document.getElementById("btnNuevaCategoria");
const btnEliminarCategoria = document.getElementById("btnEliminarCategoria");
const campoNuevaCategoria = document.getElementById("campoNuevaCategoria");
const nuevaCategoriaInput = document.getElementById("nuevaCategoriaInput");
const btnGuardarCategoria = document.getElementById("btnGuardarCategoria");
const btnCancelarCategoria = document.getElementById("btnCancelarCategoria");
const categoriaError = document.getElementById("categoriaError");

let editingRow = null;
let originalProductCode = null;
let guardandoProducto = false;
let productosCatalogo = [];
let ordenProductos = { campo: "codigo", direccion: "asc" };
let paginaProductos = 1;

const PRODUCTOS_POR_PAGINA = 8;


// ==========================================
// CATEGORÍAS DINÁMICAS
// ==========================================

function obtenerCategoriasConProductos() {
    return productosCatalogo
        .map(producto => String(producto.Categoria || "").trim())
        .filter(Boolean);
}

function obtenerCategoriasRegistradas() {
    return window.CategoriasSouvanic.listar(obtenerCategoriasConProductos());
}

function actualizarSelectCategorias(seleccionada = "") {
    const categorias = obtenerCategoriasRegistradas();
    const valor = String(seleccionada || "");
    const claveValor = window.CategoriasSouvanic.normalizar(valor);

    categoriaSelect.innerHTML = "";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Seleccionar categoría";
    categoriaSelect.appendChild(placeholder);

    categorias.forEach(categoria => {
        const opcion = document.createElement("option");
        opcion.value = categoria;
        opcion.textContent = categoria;
        categoriaSelect.appendChild(opcion);
    });

    const coincidencia = categorias.find(categoria =>
        window.CategoriasSouvanic.normalizar(categoria) === claveValor
    );

    if (coincidencia) {
        categoriaSelect.value = coincidencia;
    }

    actualizarBotonEliminarCategoria();
    actualizarFiltroCategoriasProductos();
}

function actualizarFiltroCategoriasProductos() {

    if (!filtroCategoriaProductos) return;

    const seleccionada = filtroCategoriaProductos.value;
    const categorias = obtenerCategoriasRegistradas();

    filtroCategoriaProductos.innerHTML =
        '<option value="">Todas las categorías</option>';

    categorias.forEach(categoria => {
        const opcion = document.createElement("option");
        opcion.value = categoria;
        opcion.textContent = categoria;
        filtroCategoriaProductos.appendChild(opcion);
    });

    const coincidencia = categorias.find(categoria =>
        window.CategoriasSouvanic.normalizar(categoria) ===
        window.CategoriasSouvanic.normalizar(seleccionada)
    );

    filtroCategoriaProductos.value = coincidencia || "";
}

function actualizarBotonEliminarCategoria() {
    if (!btnEliminarCategoria) return;
    btnEliminarCategoria.disabled = !categoriaSelect.value;
}

function mostrarErrorCategoria(mensaje) {
    categoriaError.textContent = mensaje;
    categoriaError.hidden = !mensaje;
}

function cerrarEditorCategoria() {
    campoNuevaCategoria.hidden = true;
    nuevaCategoriaInput.value = "";
    mostrarErrorCategoria("");
}

btnNuevaCategoria.addEventListener("click", () => {
    campoNuevaCategoria.hidden = false;
    nuevaCategoriaInput.value = "";
    mostrarErrorCategoria("");
    nuevaCategoriaInput.focus();
});

btnCancelarCategoria.addEventListener("click", cerrarEditorCategoria);

btnGuardarCategoria.addEventListener("click", () => {
    const resultado = window.CategoriasSouvanic.crear(
        nuevaCategoriaInput.value,
        obtenerCategoriasRegistradas()
    );

    if (!resultado.ok) {
        mostrarErrorCategoria(resultado.mensaje);
        nuevaCategoriaInput.focus();
        return;
    }

    actualizarSelectCategorias(resultado.nombre);
    cerrarEditorCategoria();
});

nuevaCategoriaInput.addEventListener("keydown", evento => {
    if (evento.key === "Enter") {
        evento.preventDefault();
        btnGuardarCategoria.click();
    }
});

categoriaSelect.addEventListener("change", actualizarBotonEliminarCategoria);

btnEliminarCategoria.addEventListener("click", async () => {

    const categoria = categoriaSelect.value.trim();

    if (!categoria) {
        SouvanicUI.notificar(
            "Seleccioná una categoría para eliminarla.",
            "warning"
        );
        return;
    }

    const categoriasConProductos = obtenerCategoriasConProductos();
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

    actualizarSelectCategorias();
    SouvanicUI.notificar(
        `La categoría "${resultado.nombre}" fue eliminada de los selectores.`,
        "success",
        { titulo: "Categoría eliminada" }
    );
});

if (!esAdministrador()) {
    btnNuevaCategoria.hidden = true;
    if (btnEliminarCategoria) btnEliminarCategoria.hidden = true;
}

actualizarSelectCategorias();


// ==========================================
// FORMATO DE MONEDA
// ==========================================

function formatoPrecioProducto(valor) {
    return "C$ " + Number(valor).toLocaleString("es-NI", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function actualizarContadorProductos(visibles, total) {

    if (!contadorProductos) {
        return;
    }

    contadorProductos.textContent = total === 0
        ? "Sin productos registrados"
        : `${visibles.toLocaleString("es-NI")} de ` +
            `${total.toLocaleString("es-NI")} productos`;
}


// ==========================================
// ABRIR MODAL PARA AGREGAR
// ==========================================

openModal.addEventListener("click", function() {

    editingRow = null;
    originalProductCode = null;

    productForm.reset();
    cerrarEditorCategoria();
    actualizarSelectCategorias();

    modal.querySelector("h2").textContent = "Agregar producto";

    modal.classList.add("active");
});


// ==========================================
// CERRAR MODAL
// ==========================================

function cerrarModalProducto() {

    editingRow = null;
    originalProductCode = null;

    productForm.reset();
    cerrarEditorCategoria();

    modal.classList.remove("active");
}

closeModal?.addEventListener("click", cerrarModalProducto);
cancelBtn?.addEventListener("click", cerrarModalProducto);


// ==========================================
// CREAR FILA DE PRODUCTO
// ==========================================

function crearBotonAccionProducto(clase, titulo, icono, texto) {

    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = `btn-accion-mini ${clase}`;
    boton.title = titulo;
    boton.setAttribute("aria-label", titulo);
    boton.innerHTML =
        `<i class="bi ${icono}" aria-hidden="true"></i> ${texto}`;

    return boton;
}

function crearFilaProducto(producto) {

    const fila = document.createElement("tr");
    fila.dataset.codigo = producto.CodigoProducto ?? "";

    const celdaCodigo = document.createElement("td");
    const codigoTexto = document.createElement("span");

    codigoTexto.className = "codigo-producto";
    codigoTexto.textContent = producto.CodigoProducto ?? "";
    celdaCodigo.appendChild(codigoTexto);

    const celdaNombre = document.createElement("td");
    const nombreProducto = document.createElement("strong");
    nombreProducto.className = "producto-nombre";
    nombreProducto.textContent = producto.Nombre ?? "";
    celdaNombre.appendChild(nombreProducto);

    const descripcion = String(producto.Descripcion ?? "").trim();

    if (descripcion) {
        const detalle = document.createElement("small");
        detalle.className = "producto-descripcion";
        detalle.textContent = descripcion;
        celdaNombre.appendChild(detalle);
    }

    const celdaCategoria = document.createElement("td");
    const categoriaTexto = document.createElement("span");
    categoriaTexto.className = "badge-categoria";
    categoriaTexto.textContent = producto.Categoria || "Sin categoría";
    celdaCategoria.appendChild(categoriaTexto);

    const celdaPrecio = document.createElement("td");
    celdaPrecio.className = "celda-dinero";
    celdaPrecio.textContent = formatoPrecioProducto(producto.Precio);

    const celdaEstado = document.createElement("td");
    const estado = document.createElement("span");
    const activo = producto.Activo !== false;

    estado.className = "estado-producto " +
        (activo ? "estado-activo" : "estado-inactivo");
    estado.textContent = activo ? "Activo" : "Inactivo";
    celdaEstado.appendChild(estado);

    const acciones = document.createElement("td");
    acciones.className = "acciones-producto";

    const ver = crearBotonAccionProducto(
        "btn-ver-producto",
        "Ver detalle del producto",
        "bi-eye",
        "Ver"
    );

    acciones.appendChild(ver);

    if (esAdministrador()) {

        const editar = crearBotonAccionProducto(
            "edit-btn",
            "Editar producto",
            "bi-pencil",
            "Editar"
        );

        const alternar = crearBotonAccionProducto(
            "btn-alternar-producto",
            activo ? "Desactivar producto" : "Activar producto",
            activo ? "bi-toggle-on" : "bi-toggle-off",
            activo ? "Desactivar" : "Activar"
        );

        const eliminar = crearBotonAccionProducto(
            "delete-btn",
            "Eliminar producto",
            "bi-trash3",
            "Eliminar"
        );

        acciones.append(editar, alternar, eliminar);
    }

    fila.append(
        celdaCodigo,
        celdaNombre,
        celdaCategoria,
        celdaPrecio,
        celdaEstado,
        acciones
    );

    return fila;
}


// ==========================================
// FILTROS, ORDEN Y PAGINACIÓN
// ==========================================

function normalizarTextoProducto(valor) {
    return String(valor ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function obtenerProductosFiltrados() {

    const texto = normalizarTextoProducto(searchProduct.value.trim());
    const categoria = normalizarTextoProducto(
        filtroCategoriaProductos ? filtroCategoriaProductos.value : ""
    );
    const estado = filtroEstadoProductos
        ? filtroEstadoProductos.value
        : "";

    return productosCatalogo.filter(producto => {

        const busqueda = normalizarTextoProducto(
            `${producto.CodigoProducto} ${producto.Nombre} ` +
            `${producto.Categoria} ${producto.Descripcion || ""}`
        );

        if (texto && !busqueda.includes(texto)) {
            return false;
        }

        if (
            categoria &&
            normalizarTextoProducto(producto.Categoria) !== categoria
        ) {
            return false;
        }

        if (estado === "activo" && producto.Activo === false) {
            return false;
        }

        if (estado === "inactivo" && producto.Activo !== false) {
            return false;
        }

        return true;
    });
}

function ordenarProductos(lista) {

    const { campo, direccion } = ordenProductos;
    const factor = direccion === "asc" ? 1 : -1;

    return lista.slice().sort((a, b) => {

        if (campo === "precio") {
            return (Number(a.Precio) - Number(b.Precio)) * factor;
        }

        if (campo === "estado") {
            const estadoA = a.Activo === false ? 0 : 1;
            const estadoB = b.Activo === false ? 0 : 1;
            return (estadoA - estadoB) * factor;
        }

        const valorA = normalizarTextoProducto(a[{
            codigo: "CodigoProducto",
            nombre: "Nombre",
            categoria: "Categoria"
        }[campo]]);

        const valorB = normalizarTextoProducto(b[{
            codigo: "CodigoProducto",
            nombre: "Nombre",
            categoria: "Categoria"
        }[campo]]);

        return valorA.localeCompare(valorB, "es") * factor;
    });
}

function renderizarProductos() {

    const filtrados = obtenerProductosFiltrados();
    const ordenados = ordenarProductos(filtrados);

    const totalPaginas = Math.max(
        1,
        Math.ceil(ordenados.length / PRODUCTOS_POR_PAGINA)
    );

    paginaProductos = Math.min(Math.max(1, paginaProductos), totalPaginas);

    const inicio = (paginaProductos - 1) * PRODUCTOS_POR_PAGINA;
    const pagina = ordenados.slice(inicio, inicio + PRODUCTOS_POR_PAGINA);

    productsBody.innerHTML = "";

    if (productosCatalogo.length === 0) {

        mostrarEstadoTabla(productsBody, {
            tipo: "vacio",
            colspan: 6,
            icono: "bi-box-seam",
            titulo: "No hay productos registrados",
            mensaje: "Agregá el primer producto para comenzar a gestionar el catálogo."
        });

        actualizarContadorProductos(0, 0);
        actualizarPaginacionProductos(0, 1);

        return;
    }

    if (pagina.length === 0) {

        mostrarEstadoTabla(productsBody, {
            tipo: "vacio",
            colspan: 6,
            icono: "bi-search",
            titulo: "Sin resultados",
            mensaje: "No hay productos que coincidan con los filtros aplicados."
        });

        actualizarContadorProductos(0, productosCatalogo.length);
        actualizarPaginacionProductos(totalPaginas, totalPaginas);

        return;
    }

    const fragmento = document.createDocumentFragment();

    pagina.forEach(producto => {
        fragmento.appendChild(crearFilaProducto(producto));
    });

    productsBody.appendChild(fragmento);

    actualizarContadorProductos(filtrados.length, productosCatalogo.length);
    actualizarPaginacionProductos(totalPaginas, paginaProductos);
    actualizarIndicadoresOrden();
}

function actualizarPaginacionProductos(totalPaginas, paginaActual) {

    if (!paginacionProductos) return;

    const mostrar = totalPaginas > 1;
    paginacionProductos.hidden = !mostrar;

    if (!mostrar) return;

    paginaProductosInfo.textContent =
        `Página ${paginaActual} de ${totalPaginas}`;
    paginaProductosAnterior.disabled = paginaActual <= 1;
    paginaProductosSiguiente.disabled = paginaActual >= totalPaginas;
}

function actualizarIndicadoresOrden() {

    document.querySelectorAll("[data-orden-producto]").forEach(boton => {

        const th = boton.closest("th");
        const activo = boton.dataset.ordenProducto === ordenProductos.campo;
        const icono = boton.querySelector("i");

        th.setAttribute(
            "aria-sort",
            activo
                ? ordenProductos.direccion === "asc"
                    ? "ascending"
                    : "descending"
                : "none"
        );

        if (icono) {
            icono.className = activo
                ? ordenProductos.direccion === "asc"
                    ? "bi bi-sort-up"
                    : "bi bi-sort-down"
                : "bi bi-arrow-down-up";
        }
    });
}


// ==========================================
// CARGAR PRODUCTOS DESDE SQL SERVER
// ==========================================

async function loadProductsFromSQL() {

    mostrarEstadoTabla(productsBody, {
        tipo: "cargando",
        colspan: 6,
        mensaje: "Cargando productos..."
    });

    if (contadorProductos) {
        contadorProductos.textContent = "Cargando productos...";
    }

    try {

        const respuesta = await fetchAutenticado("/productos");

        if (!respuesta.ok) {
            throw new Error("No se pudieron obtener los productos.");
        }

        const productos = await respuesta.json();

        productosCatalogo = Array.isArray(productos) ? productos : [];
        paginaProductos = 1;

        actualizarSelectCategorias(categoriaSelect.value);
        renderizarProductos();

    } catch (error) {

        console.error("Error al cargar productos:", error);

        productosCatalogo = [];

        mostrarEstadoTabla(productsBody, {
            tipo: "error",
            colspan: 6,
            titulo: "No se pudieron cargar los productos",
            mensaje: "Verificá la conexión con el servidor e intentá nuevamente."
        });

        actualizarContadorProductos(0, 0);
        actualizarPaginacionProductos(0, 1);

        if (sessionStorage.getItem("token")) {
            SouvanicUI.notificar(
                "No se pudieron cargar los productos desde SQL Server.",
                "error"
            );
        }
    }
}


// ==========================================
// AGREGAR O EDITAR PRODUCTO
// ==========================================

productForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    if (!esAdministrador()) {
        SouvanicUI.notificar(
            "No tenés permisos para modificar productos.",
            "warning"
        );
        return;
    }



    if (guardandoProducto) {
        return;
    }

    const codigo = document.getElementById("codigo").value.trim();
    const nombre = document.getElementById("nombreProducto").value.trim();
    const categoria = document.getElementById("categoria").value.trim();
    const descripcion = descripcionProducto
        ? descripcionProducto.value.trim()
        : "";

    const precioTexto = document.getElementById("precio").value.trim();
    const stockTexto = document.getElementById("stock").value.trim();

    // Validar campos vacíos
    if (
        !codigo ||
        !nombre ||
        !categoria ||
        precioTexto === "" ||
        stockTexto === ""
    ) {

        SouvanicUI.notificar(
            "Por favor, completá todos los campos obligatorios.",
            "warning"
        );
        return;
    }

    const precio = Number(precioTexto);
    const stock = Number(stockTexto);

    // Validar precio
    if (!Number.isFinite(precio) || precio <= 0) {

        SouvanicUI.notificar(
            "El precio debe ser mayor que cero.",
            "warning"
        );
        return;
    }

    // Validar stock
    if (!Number.isSafeInteger(stock) || stock < 0) {

        SouvanicUI.notificar(
            "El stock debe ser un número entero mayor o igual a cero.",
            "warning"
        );
        return;
    }

    // Validar código repetido en el catálogo
    const codigoDuplicado = productosCatalogo.some(producto => {

        const codigoExistente = String(
            producto.CodigoProducto || ""
        ).trim();

        return (
            codigoExistente.toLowerCase() === codigo.toLowerCase() &&
            codigoExistente !== originalProductCode
        );
    });

    if (codigoDuplicado) {
        SouvanicUI.notificar(
            "Ya existe un producto con ese código.",
            "warning"
        );
        return;
    }

    const editando = editingRow !== null;

    const ruta = editando
        ? `/productos/${encodeURIComponent(originalProductCode)}`
        : "/productos";

    const metodo = editando ? "PUT" : "POST";

    guardandoProducto = true;
    saveBtn.disabled = true;

    try {

        const respuesta = await fetchAutenticado(ruta, {
            method: metodo,
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

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                datos.mensaje ||
                "No se pudo guardar el producto."
            );
        }

        SouvanicUI.notificar(
            editando
                ? "Producto actualizado correctamente en SQL Server."
                : "Producto guardado correctamente en SQL Server.",
            "success"
        );

        cerrarModalProducto();

        // Recargar los datos reales de SQL Server
        await loadProductsFromSQL();

    } catch (error) {

        console.error("Error al guardar producto:", error);

        if (sessionStorage.getItem("token")) {
            SouvanicUI.notificar(
                "Error: " + error.message,
                "error"
            );
        }

    } finally {

        guardandoProducto = false;
        saveBtn.disabled = false;
    }
});


// ==========================================
// EDITAR Y ELIMINAR PRODUCTOS
// ==========================================

productsBody.addEventListener("click", async function(event) {

    const boton = event.target.closest("button");

    if (!boton) {
        return;
    }

    const fila = boton.closest("tr");

    if (!fila || !fila.dataset.codigo) {
        return;
    }

    const codigo = fila.dataset.codigo;
    const producto = productosCatalogo.find(item =>
        item.CodigoProducto === codigo
    );

    if (!producto) {
        return;
    }

    // ======================================
    // VER PRODUCTO
    // ======================================

    if (boton.classList.contains("btn-ver-producto")) {
        abrirDetalleProducto(producto);
        return;
    }

    // ======================================
    // ACTIVAR / DESACTIVAR PRODUCTO
    // ======================================

    if (boton.classList.contains("btn-alternar-producto")) {
        await alternarEstadoProducto(producto);
        return;
    }

    // ======================================
    // ELIMINAR PRODUCTO
    // ======================================

    if (boton.classList.contains("delete-btn")) {

        const confirmar = await SouvanicUI.confirmar({
            titulo: "Eliminar producto",
            mensaje: `¿Querés eliminar el producto ${codigo}?`,
            detalle: "Esta acción elimina el producto del catálogo de SQL Server y no se puede deshacer.",
            confirmar: "Eliminar producto",
            cancelar: "Cancelar",
            peligro: true,
            icono: "bi-trash3-fill"
        });

        if (!confirmar) {
            return;
        }

        boton.disabled = true;

        try {

            const respuesta = await fetchAutenticado(
                `/productos/${encodeURIComponent(codigo)}`,
                {
                    method: "DELETE"
                }
            );

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(
                    datos.mensaje ||
                    "No se pudo eliminar el producto."
                );
            }

            SouvanicUI.notificar(
                "Producto eliminado correctamente de SQL Server.",
                "success"
            );

            await loadProductsFromSQL();

        } catch (error) {

            console.error("Error al eliminar producto:", error);

            if (sessionStorage.getItem("token")) {
                SouvanicUI.notificar(
                    "Error al eliminar el producto: " + error.message,
                    "error"
                );
            }

        } finally {

            boton.disabled = false;
        }
    }


    // ======================================
    // EDITAR PRODUCTO
    // ======================================

    if (boton.classList.contains("edit-btn")) {

        editingRow = fila;
        originalProductCode = producto.CodigoProducto;

        document.getElementById("codigo").value =
            producto.CodigoProducto ?? "";

        document.getElementById("nombreProducto").value =
            producto.Nombre ?? "";

        descripcionProducto.value = producto.Descripcion ?? "";

        actualizarSelectCategorias(producto.Categoria ?? "");

        document.getElementById("precio").value =
            Number(producto.Precio) || 0;

        document.getElementById("stock").value =
            Number(producto.Stock) || 0;

        modal.querySelector("h2").textContent = "Editar producto";

        modal.classList.add("active");
    }
});


// ==========================================
// DETALLE Y ESTADO DEL PRODUCTO
// ==========================================

function crearCampoDetalleProducto(etiqueta, valor) {

    const campo = document.createElement("div");
    const titulo = document.createElement("span");
    const contenido = document.createElement("strong");

    campo.className = "detalle-producto-campo";
    titulo.textContent = etiqueta;
    contenido.textContent = valor;

    campo.append(titulo, contenido);

    return campo;
}

function abrirDetalleProducto(producto) {

    if (!modalDetalleProducto || !detalleProductoContenido) return;

    document.getElementById("detalleProductoTitulo").textContent =
        producto.Nombre || "Detalle del producto";

    detalleProductoContenido.replaceChildren(
        crearCampoDetalleProducto("Código", producto.CodigoProducto ?? ""),
        crearCampoDetalleProducto(
            "Estado",
            producto.Activo === false ? "Inactivo" : "Activo"
        ),
        crearCampoDetalleProducto("Categoría", producto.Categoria ?? ""),
        crearCampoDetalleProducto(
            "Precio de venta",
            formatoPrecioProducto(producto.Precio)
        ),
        crearCampoDetalleProducto(
            "Stock actual",
            `${Number(producto.Stock) || 0} unidades`
        ),
        crearCampoDetalleProducto(
            "Stock mínimo",
            `${Number(producto.StockMinimo) || 0} unidades`
        ),
        crearCampoDetalleProducto(
            "Descripción",
            String(producto.Descripcion || "").trim() || "Sin descripción"
        )
    );

    modalDetalleProducto.classList.add("active");
}

function cerrarDetalleProducto() {
    if (modalDetalleProducto) {
        modalDetalleProducto.classList.remove("active");
    }
}

document.getElementById("cerrarDetalleProducto")
    ?.addEventListener("click", cerrarDetalleProducto);
document.getElementById("volverDetalleProducto")
    ?.addEventListener("click", cerrarDetalleProducto);

modalDetalleProducto?.addEventListener("click", evento => {
    if (evento.target === modalDetalleProducto) {
        cerrarDetalleProducto();
    }
});


async function alternarEstadoProducto(producto) {

    const nuevoActivo = producto.Activo === false;

    if (!nuevoActivo) {

        const confirmado = await SouvanicUI.confirmar({
            titulo: "Desactivar producto",
            mensaje: `¿Querés desactivar "${producto.Nombre}"?`,
            detalle: "El producto seguirá en el catálogo y el inventario, pero no podrá agregarse a nuevas facturas.",
            confirmar: "Desactivar",
            cancelar: "Cancelar",
            peligro: true,
            icono: "bi-toggle-off"
        });

        if (!confirmado) return;
    }

    try {

        const respuesta = await fetchAutenticado(
            `/productos/${encodeURIComponent(producto.CodigoProducto)}/estado`,
            {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ activo: nuevoActivo })
            }
        );

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                datos.mensaje || "No se pudo cambiar el estado."
            );
        }

        producto.Activo = nuevoActivo;
        renderizarProductos();

        SouvanicUI.notificar(
            nuevoActivo
                ? `"${producto.Nombre}" fue activado.`
                : `"${producto.Nombre}" fue desactivado.`,
            "success"
        );

    } catch (error) {

        console.error("Error al cambiar estado:", error);
        SouvanicUI.notificar(error.message, "error");
    }
}


// ==========================================
// BUSCAR PRODUCTOS
// ==========================================

function reiniciarPaginaYRenderizar() {
    paginaProductos = 1;
    renderizarProductos();
}

searchProduct.addEventListener("input", reiniciarPaginaYRenderizar);

filtroCategoriaProductos?.addEventListener(
    "change",
    reiniciarPaginaYRenderizar
);

filtroEstadoProductos?.addEventListener(
    "change",
    reiniciarPaginaYRenderizar
);

document.querySelectorAll("[data-orden-producto]").forEach(boton => {

    boton.addEventListener("click", function() {

        const campo = boton.dataset.ordenProducto;

        if (ordenProductos.campo === campo) {
            ordenProductos.direccion =
                ordenProductos.direccion === "asc" ? "desc" : "asc";
        } else {
            ordenProductos = { campo, direccion: "asc" };
        }

        paginaProductos = 1;
        renderizarProductos();
    });
});

paginaProductosAnterior?.addEventListener("click", function() {
    if (paginaProductos > 1) {
        paginaProductos--;
        renderizarProductos();
    }
});

paginaProductosSiguiente?.addEventListener("click", function() {
    paginaProductos++;
    renderizarProductos();
});

document.addEventListener("keydown", evento => {
    if (evento.key === "Escape") {
        cerrarDetalleProducto();
    }
});


// ==========================================
// INICIAR MÓDULO
// ==========================================

const tokenProductos = sessionStorage.getItem("token");

if (!tokenProductos) {

    window.location.replace("index.html");

} else {

    loadProductsFromSQL();

}
