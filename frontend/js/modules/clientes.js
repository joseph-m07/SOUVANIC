"use strict";

// ==========================================
// ELEMENTOS DEL MÓDULO DE SOCIOS
// ==========================================

const clientModal = document.getElementById("clientModal");
const openClientModal = document.getElementById("openClientModal");
const closeClientModal = document.querySelector(".close-client-modal");
const cancelClientBtn = document.querySelector(".cancel-client-btn");
const clientForm = document.getElementById("clientForm");
const clientBody = document.getElementById("clientsBody");
const searchClient = document.getElementById("searchClient");
const contadorClientes = document.getElementById("contadorClientes");
const socioFiltros = document.getElementById("socioFiltros");
const socioModalTitulo = document.getElementById("socioModalTitulo");
const chkEsCliente = document.getElementById("socioEsCliente");
const chkEsProveedor = document.getElementById("socioEsProveedor");
const chkEsEmpleado = document.getElementById("socioEsEmpleado");

let editingClientRow = null;
let originalClientId = null;
let guardandoCliente = false;
let filtroClasificacionActivo = "todos";

function actualizarContadorClientes(visibles, total) {
    if (!contadorClientes) return;

    contadorClientes.textContent = total === 0
        ? "Sin socios registrados"
        : `${visibles.toLocaleString("es-NI")} de ${total.toLocaleString("es-NI")} socios`;
}

// ==========================================
// ABRIR Y CERRAR MODAL
// ==========================================

function cerrarModalCliente() {
    editingClientRow = null;
    originalClientId = null;
    clientForm.reset();
    if (chkEsCliente) chkEsCliente.checked = true;
    if (chkEsProveedor) chkEsProveedor.checked = false;
    if (chkEsEmpleado) chkEsEmpleado.checked = false;
    clientModal.classList.remove("active");
}

openClientModal.addEventListener("click", function () {
    editingClientRow = null;
    originalClientId = null;
    clientForm.reset();
    if (socioModalTitulo) socioModalTitulo.textContent = "Agregar socio";
    if (chkEsCliente) chkEsCliente.checked = true;
    if (chkEsProveedor) chkEsProveedor.checked = false;
    if (chkEsEmpleado) chkEsEmpleado.checked = false;
    clientModal.classList.add("active");
});

closeClientModal.addEventListener("click", cerrarModalCliente);
cancelClientBtn.addEventListener("click", cerrarModalCliente);

// ==========================================
// CREAR FILA DE SOCIO
// ==========================================

function crearBadgesClasificacion(socio) {
    const contenedor = document.createElement("div");
    contenedor.className = "socio-badges";

    const roles = [
        { activo: Boolean(socio.EsCliente), texto: "Cliente", clase: "socio-badge-cliente" },
        { activo: Boolean(socio.EsProveedor), texto: "Proveedor", clase: "socio-badge-proveedor" },
        { activo: Boolean(socio.EsEmpleado), texto: "Empleado", clase: "socio-badge-empleado" }
    ];

    roles.forEach(rol => {
        if (!rol.activo) return;
        const badge = document.createElement("span");
        badge.className = `socio-badge ${rol.clase}`;
        badge.textContent = rol.texto;
        contenedor.appendChild(badge);
    });

    return contenedor;
}

function crearFilaCliente(socio) {
    const fila = document.createElement("tr");
    fila.dataset.esCliente = socio.EsCliente ? "1" : "0";
    fila.dataset.esProveedor = socio.EsProveedor ? "1" : "0";
    fila.dataset.esEmpleado = socio.EsEmpleado ? "1" : "0";

    const celdaId = document.createElement("td");
    celdaId.textContent = socio.IdCliente ?? "";
    fila.appendChild(celdaId);

    const celdaNombre = document.createElement("td");
    celdaNombre.textContent = socio.Nombre ?? "";
    fila.appendChild(celdaNombre);

    const celdaClasificacion = document.createElement("td");
    celdaClasificacion.appendChild(crearBadgesClasificacion(socio));
    fila.appendChild(celdaClasificacion);

    [socio.Telefono, socio.Correo, socio.Direccion].forEach(valor => {
        const celda = document.createElement("td");
        celda.textContent = valor ?? "";
        fila.appendChild(celda);
    });

    const acciones = document.createElement("td");

    const editar = document.createElement("button");
    editar.type = "button";
    editar.className = "edit-client-btn";
    editar.textContent = "Editar";

    const eliminar = document.createElement("button");
    eliminar.type = "button";
    eliminar.className = "delete-client-btn";
    eliminar.textContent = "Eliminar";

    acciones.appendChild(editar);
    if (esAdministrador()) {
        acciones.appendChild(eliminar);
    }

    fila.appendChild(acciones);
    return fila;
}

// ==========================================
// CARGAR SOCIOS DESDE EL BACKEND
// ==========================================

async function loadClientsFromSQL() {
    mostrarEstadoTabla(clientBody, {
        tipo: "cargando",
        colspan: 7,
        mensaje: "Cargando socios..."
    });

    if (contadorClientes) {
        contadorClientes.textContent = "Cargando socios...";
    }

    try {
        const respuesta = await fetchAutenticado("/socios");

        if (!respuesta.ok) {
            throw new Error("No se pudieron obtener los socios.");
        }

        const socios = await respuesta.json();
        clientBody.innerHTML = "";

        if (socios.length === 0) {
            mostrarEstadoTabla(clientBody, {
                tipo: "vacio",
                colspan: 7,
                icono: "bi-people",
                titulo: "No hay socios registrados",
                mensaje: "Agregá un cliente, proveedor o empleado para comenzar."
            });

            actualizarContadorClientes(0, 0);
            return;
        }

        socios.forEach(socio => {
            clientBody.appendChild(crearFilaCliente(socio));
        });

        filtrarClientes();
    } catch (error) {
        console.error("Error al cargar socios:", error);

        mostrarEstadoTabla(clientBody, {
            tipo: "error",
            colspan: 7,
            titulo: "No se pudieron cargar los socios",
            mensaje: "Verificá la conexión con el servidor e intentá nuevamente."
        });

        actualizarContadorClientes(0, 0);

        if (sessionStorage.getItem("token")) {
            SouvanicUI.notificar(error.message, "error");
        }
    }
}

// ==========================================
// AGREGAR O EDITAR SOCIO
// ==========================================

clientForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (guardandoCliente) return;

    const id = document.getElementById("clientId").value.trim();
    const name = document.getElementById("clientName").value.trim();
    const phone = document.getElementById("clientPhone").value.trim();
    const email = document.getElementById("clientEmail").value.trim();
    const address = document.getElementById("clientAddress").value.trim();

    const esCliente = chkEsCliente ? chkEsCliente.checked : true;
    const esProveedor = chkEsProveedor ? chkEsProveedor.checked : false;
    const esEmpleado = chkEsEmpleado ? chkEsEmpleado.checked : false;

    if (!id || !name || !phone) {
        SouvanicUI.notificar(
            "Por favor, completá los campos obligatorios (ID, Nombre y Teléfono).",
            "warning"
        );
        return;
    }

    if (!esCliente && !esProveedor && !esEmpleado) {
        SouvanicUI.notificar(
            "Seleccioná al menos una clasificación (Cliente, Proveedor o Empleado).",
            "warning"
        );
        return;
    }

    if (id.length > 29 || name.length > 100 || phone.length > 20 || email.length > 100 || address.length > 200) {
        SouvanicUI.notificar("Uno de los campos supera la longitud permitida.", "warning");
        return;
    }

    if (email) {
        const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!correoValido.test(email)) {
            SouvanicUI.notificar("Ingresá un correo electrónico válido o dejalo vacío.", "warning");
            return;
        }
    }

    const filas = clientBody.querySelectorAll("tr");
    for (const fila of filas) {
        const primeraCelda = fila.querySelector("td");
        if (!primeraCelda || fila.children.length < 7) continue;

        const idExistente = primeraCelda.textContent.trim();
        if (idExistente.toLowerCase() === id.toLowerCase() && fila !== editingClientRow) {
            SouvanicUI.notificar("Ya existe un socio con ese ID.", "warning");
            return;
        }
    }

    const editando = editingClientRow !== null;
    const ruta = editando ? `/socios/${encodeURIComponent(originalClientId)}` : "/socios";
    const metodo = editando ? "PUT" : "POST";

    guardandoCliente = true;
    const botonGuardar = clientForm.querySelector('button[type="submit"]');
    if (botonGuardar) botonGuardar.disabled = true;

    try {
        const respuesta = await fetchAutenticado(ruta, {
            method: metodo,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id,
                name,
                phone,
                email,
                address,
                esCliente,
                esProveedor,
                esEmpleado
            })
        });

        const datos = await respuesta.json();
        if (!respuesta.ok) {
            throw new Error(datos.mensaje || "No se pudo guardar el socio.");
        }

        SouvanicUI.notificar(
            editando ? "Socio actualizado correctamente." : "Socio guardado correctamente.",
            "success"
        );

        cerrarModalCliente();
        await loadClientsFromSQL();
    } catch (error) {
        console.error("Error al guardar socio:", error);
        if (sessionStorage.getItem("token")) {
            SouvanicUI.notificar("Error: " + error.message, "error");
        }
    } finally {
        guardandoCliente = false;
        if (botonGuardar) botonGuardar.disabled = false;
    }
});

// ==========================================
// EDITAR Y ELIMINAR SOCIOS
// ==========================================

clientBody.addEventListener("click", async function (event) {
    const boton = event.target.closest("button");
    if (!boton) return;

    const fila = boton.closest("tr");
    if (!fila || fila.children.length < 7) return;

    const id = fila.children[0].textContent.trim();

    if (boton.classList.contains("delete-client-btn")) {
        if (!esAdministrador()) {
            SouvanicUI.notificar("No tenés permisos para eliminar socios.", "warning");
            return;
        }

        const confirmar = await SouvanicUI.confirmar({
            titulo: "Eliminar socio",
            mensaje: `¿Querés eliminar al socio ${id}?`,
            detalle: "Esta acción no se puede deshacer y afecta el registro en la base de datos.",
            confirmar: "Eliminar socio",
            cancelar: "Cancelar",
            peligro: true,
            icono: "bi-person-x-fill"
        });

        if (!confirmar) return;

        boton.disabled = true;
        try {
            const respuesta = await fetchAutenticado(`/socios/${encodeURIComponent(id)}`, {
                method: "DELETE"
            });

            const datos = await respuesta.json();
            if (!respuesta.ok) {
                throw new Error(datos.mensaje || "No se pudo eliminar el socio.");
            }

            SouvanicUI.notificar("Socio eliminado correctamente.", "success");
            await loadClientsFromSQL();
        } catch (error) {
            console.error("Error al eliminar socio:", error);
            if (sessionStorage.getItem("token")) {
                SouvanicUI.notificar("Error al eliminar el socio: " + error.message, "error");
            }
        } finally {
            boton.disabled = false;
        }
    }

    if (boton.classList.contains("edit-client-btn")) {
        editingClientRow = fila;
        originalClientId = id;

        if (socioModalTitulo) socioModalTitulo.textContent = "Editar socio";

        const celdas = fila.querySelectorAll("td");
        document.getElementById("clientId").value = celdas[0].textContent.trim();
        document.getElementById("clientName").value = celdas[1].textContent.trim();
        document.getElementById("clientPhone").value = celdas[3].textContent.trim();
        document.getElementById("clientEmail").value = celdas[4].textContent.trim();
        document.getElementById("clientAddress").value = celdas[5].textContent.trim();

        if (chkEsCliente) chkEsCliente.checked = fila.dataset.esCliente === "1";
        if (chkEsProveedor) chkEsProveedor.checked = fila.dataset.esProveedor === "1";
        if (chkEsEmpleado) chkEsEmpleado.checked = fila.dataset.esEmpleado === "1";

        clientModal.classList.add("active");
    }
});

// ==========================================
// BUSCAR Y FILTRAR SOCIOS
// ==========================================

function filtrarClientes() {
    const texto = searchClient.value.trim().toLowerCase();
    const filas = Array.from(clientBody.querySelectorAll("tr")).filter(fila => fila.children.length >= 7);

    let visibles = 0;

    filas.forEach(fila => {
        const coincideTexto = fila.textContent.toLowerCase().includes(texto);
        let coincideTipo = true;

        if (filtroClasificacionActivo === "cliente") {
            coincideTipo = fila.dataset.esCliente === "1";
        } else if (filtroClasificacionActivo === "proveedor") {
            coincideTipo = fila.dataset.esProveedor === "1";
        } else if (filtroClasificacionActivo === "empleado") {
            coincideTipo = fila.dataset.esEmpleado === "1";
        }

        const coincide = coincideTexto && coincideTipo;
        fila.classList.toggle("fila-oculta", !coincide);
        if (coincide) visibles++;
    });

    actualizarSinResultados(clientBody, visibles, filas.length, {
        colspan: 7,
        icono: "bi-search",
        titulo: "Sin resultados",
        mensaje: "No hay socios que coincidan con el filtro o búsqueda."
    });

    actualizarContadorClientes(visibles, filas.length);
}

searchClient.addEventListener("input", filtrarClientes);

if (socioFiltros) {
    socioFiltros.addEventListener("click", event => {
        const btn = event.target.closest(".socio-filtro-btn");
        if (!btn) return;

        socioFiltros.querySelectorAll(".socio-filtro-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        filtroClasificacionActivo = btn.dataset.filtro || "todos";
        filtrarClientes();
    });
}

// ==========================================
// INICIAR MÓDULO
// ==========================================

const tokenClientes = sessionStorage.getItem("token");

if (!tokenClientes) {
    window.location.replace("index.html");
} else {
    loadClientsFromSQL();
}
