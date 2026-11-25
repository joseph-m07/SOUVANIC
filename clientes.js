
"use strict";

// ==========================================
// ELEMENTOS DEL MÓDULO DE CLIENTES
// ==========================================

const clientModal = document.getElementById("clientModal");
const openClientModal = document.getElementById("openClientModal");
const closeClientModal = document.querySelector(".close-client-modal");
const cancelClientBtn = document.querySelector(".cancel-client-btn");
const clientForm = document.getElementById("clientForm");
const clientBody = document.getElementById("clientsBody");
const searchClient = document.getElementById("searchClient");
const contadorClientes = document.getElementById("contadorClientes");

let editingClientRow = null;
let originalClientId = null;
let guardandoCliente = false;

function actualizarContadorClientes(visibles, total) {

    if (!contadorClientes) {
        return;
    }

    contadorClientes.textContent = total === 0
        ? "Sin clientes registrados"
        : `${visibles.toLocaleString("es-NI")} de ` +
            `${total.toLocaleString("es-NI")} clientes`;
}


// ==========================================
// ABRIR Y CERRAR MODAL
// ==========================================

function cerrarModalCliente() {
    editingClientRow = null;
    originalClientId = null;

    clientForm.reset();
    clientModal.classList.remove("active");
}

openClientModal.addEventListener("click", function() {
    editingClientRow = null;
    originalClientId = null;

    clientForm.reset();

    clientModal.classList.add("active");
});

closeClientModal.addEventListener("click", cerrarModalCliente);
cancelClientBtn.addEventListener("click", cerrarModalCliente);


// ==========================================
// CREAR FILA DE CLIENTE
// ==========================================

function crearFilaCliente(cliente) {

    const fila = document.createElement("tr");

    const valores = [
        cliente.IdCliente,
        cliente.Nombre,
        cliente.Telefono,
        cliente.Correo,
        cliente.Direccion
    ];

    valores.forEach(valor => {
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
// CARGAR CLIENTES DESDE SQL SERVER
// ==========================================

async function loadClientsFromSQL() {

    mostrarEstadoTabla(clientBody, {
        tipo: "cargando",
        colspan: 6,
        mensaje: "Cargando clientes..."
    });

    if (contadorClientes) {
        contadorClientes.textContent = "Cargando clientes...";
    }

    try {
        const respuesta = await fetchAutenticado("/clientes");

        if (!respuesta.ok) {
            throw new Error("No se pudieron obtener los clientes.");
        }

        const clientes = await respuesta.json();

        clientBody.innerHTML = "";

        if (clientes.length === 0) {
            mostrarEstadoTabla(clientBody, {
                tipo: "vacio",
                colspan: 6,
                icono: "bi-people",
                titulo: "No hay clientes registrados",
                mensaje: "Agregá el primer cliente para comenzar a facturar."
            });

            actualizarContadorClientes(0, 0);

            return;
        }

        clientes.forEach(cliente => {
            clientBody.appendChild(crearFilaCliente(cliente));
        });

        filtrarClientes();

    } catch (error) {
        console.error("Error al cargar clientes:", error);

        mostrarEstadoTabla(clientBody, {
            tipo: "error",
            colspan: 6,
            titulo: "No se pudieron cargar los clientes",
            mensaje: "Verificá la conexión con el servidor e intentá nuevamente."
        });

        actualizarContadorClientes(0, 0);

        if (sessionStorage.getItem("token")) {
            SouvanicUI.notificar(error.message, "error");
        }
    }
}


// ==========================================
// AGREGAR O EDITAR CLIENTE
// ==========================================

clientForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    if (guardandoCliente) {
        return;
    }

    const id = document.getElementById("clientId").value.trim();
    const name = document.getElementById("clientName").value.trim();
    const phone = document.getElementById("clientPhone").value.trim();
    const email = document.getElementById("clientEmail").value.trim();
    const address = document.getElementById("clientAddress").value.trim();

    // Validar campos obligatorios (correo y dirección ahora son opcionales)
    if (!id || !name || !phone) {
        SouvanicUI.notificar(
            "Por favor, completá los campos obligatorios (ID, Nombre y Teléfono).",
            "warning"
        );
        return;
    }

    if (id.length > 29 || name.length > 100 || phone.length > 20 || email.length > 100 || address.length > 200) {
        SouvanicUI.notificar(
            "Uno de los campos supera la longitud permitida.",
            "warning"
        );
        return;
    }

    // Validar formato de correo solo si se proporcionó
    if (email) {
        const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!correoValido.test(email)) {
            SouvanicUI.notificar(
                "Ingresá un correo electrónico válido o dejalo vacío.",
                "warning"
            );
            return;
        }
    }

    // Comprobar ID duplicado en la tabla
    const filas = clientBody.querySelectorAll("tr");

    for (const fila of filas) {
        const primeraCelda = fila.querySelector("td");

        if (!primeraCelda || fila.children.length < 6) {
            continue;
        }

        const idExistente = primeraCelda.textContent.trim();

        if (
            idExistente.toLowerCase() === id.toLowerCase() &&
            fila !== editingClientRow
        ) {
            SouvanicUI.notificar(
                "Ya existe un cliente con ese ID.",
                "warning"
            );
            return;
        }
    }

    const editando = editingClientRow !== null;

    const ruta = editando
        ? `/clientes/${encodeURIComponent(originalClientId)}`
        : "/clientes";

    const metodo = editando ? "PUT" : "POST";

    guardandoCliente = true;

    const botonGuardar = clientForm.querySelector('button[type="submit"]');

    if (botonGuardar) {
        botonGuardar.disabled = true;
    }

    try {
        const respuesta = await fetchAutenticado(ruta, {
            method: metodo,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id,
                name,
                phone,
                email,
                address
            })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                datos.mensaje ||
                "No se pudo guardar el cliente."
            );
        }

        SouvanicUI.notificar(
            editando
                ? "Cliente actualizado correctamente en SQL Server."
                : "Cliente guardado correctamente en SQL Server.",
            "success"
        );

        cerrarModalCliente();

        // Mostrar los datos actualizados de SQL Server
        await loadClientsFromSQL();

    } catch (error) {
        console.error("Error al guardar cliente:", error);

        if (sessionStorage.getItem("token")) {
            SouvanicUI.notificar("Error: " + error.message, "error");
        }

    } finally {
        guardandoCliente = false;

        if (botonGuardar) {
            botonGuardar.disabled = false;
        }
    }
});


// ==========================================
// EDITAR Y ELIMINAR CLIENTES
// ==========================================

clientBody.addEventListener("click", async function(event) {

    const boton = event.target.closest("button");

    if (!boton) {
        return;
    }

    const fila = boton.closest("tr");

    if (!fila || fila.children.length < 6) {
        return;
    }

    const id = fila.children[0].textContent.trim();

    // ELIMINAR CLIENTE
    if (boton.classList.contains("delete-client-btn")) {

        
if (!esAdministrador()) {
    SouvanicUI.notificar(
        "No tenés permisos para eliminar clientes.",
        "warning"
    );
    return;
}





        const confirmar = await SouvanicUI.confirmar({
            titulo: "Eliminar cliente",
            mensaje: `¿Querés eliminar al cliente ${id}?`,
            detalle: "Esta acción no se puede deshacer y afecta el registro del cliente en SQL Server.",
            confirmar: "Eliminar cliente",
            cancelar: "Cancelar",
            peligro: true,
            icono: "bi-person-x-fill"
        });

        if (!confirmar) {
            return;
        }

        boton.disabled = true;

        try {
            const respuesta = await fetchAutenticado(
                `/clientes/${encodeURIComponent(id)}`,
                {
                    method: "DELETE"
                }
            );

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(
                    datos.mensaje ||
                    "No se pudo eliminar el cliente."
                );
            }

            SouvanicUI.notificar(
                "Cliente eliminado correctamente de SQL Server.",
                "success"
            );

            await loadClientsFromSQL();

        } catch (error) {
            console.error("Error al eliminar cliente:", error);

            if (sessionStorage.getItem("token")) {
                SouvanicUI.notificar(
                    "Error al eliminar el cliente: " + error.message,
                    "error"
                );
            }

        } finally {
            boton.disabled = false;
        }
    }

    // EDITAR CLIENTE
    if (boton.classList.contains("edit-client-btn")) {

        editingClientRow = fila;
        originalClientId = id;

        const celdas = fila.querySelectorAll("td");

        document.getElementById("clientId").value =
            celdas[0].textContent.trim();

        document.getElementById("clientName").value =
            celdas[1].textContent.trim();

        document.getElementById("clientPhone").value =
            celdas[2].textContent.trim();

        document.getElementById("clientEmail").value =
            celdas[3].textContent.trim();

        document.getElementById("clientAddress").value =
            celdas[4].textContent.trim();

        clientModal.classList.add("active");
    }
});


// ==========================================
// BUSCAR CLIENTES
// ==========================================

function filtrarClientes() {

    const texto = searchClient.value.trim().toLowerCase();

    const filas = Array.from(clientBody.querySelectorAll("tr"))
        .filter(fila => fila.children.length >= 6);

    let visibles = 0;

    filas.forEach(fila => {
        const contenido = fila.textContent.toLowerCase();
        const coincide = contenido.includes(texto);

        fila.classList.toggle("fila-oculta", !coincide);

        if (coincide) {
            visibles++;
        }
    });

    actualizarSinResultados(clientBody, visibles, filas.length, {
        colspan: 6,
        icono: "bi-search",
        titulo: "Sin resultados",
        mensaje: "No hay clientes que coincidan con la búsqueda."
    });

    actualizarContadorClientes(visibles, filas.length);
}

searchClient.addEventListener("input", filtrarClientes);


// ==========================================
// INICIAR MÓDULO
// ==========================================

const tokenClientes = sessionStorage.getItem("token");

if (!tokenClientes) {
    window.location.replace("index.html");
} else {
    loadClientsFromSQL();
}
