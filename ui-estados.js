"use strict";

// ==========================================
// ESTADOS DE TABLA COMPARTIDOS
// ==========================================

(function () {

    function crearIcono(nombre) {
        const icono = document.createElement("i");

        icono.className = "bi " + nombre;
        icono.setAttribute("aria-hidden", "true");

        return icono;
    }

    function construirFilaEstado(opciones) {

        const {
            tipo = "vacio",
            colspan = 1,
            icono = "",
            titulo = "",
            mensaje = ""
        } = opciones || {};

        const fila = document.createElement("tr");
        fila.className = "fila-estado";

        const celda = document.createElement("td");
        celda.className = "celda-estado";
        celda.colSpan = colspan;

        if (tipo === "cargando") {

            const contenedor = document.createElement("div");
            contenedor.className = "estado-cargando";
            contenedor.setAttribute("role", "status");

            const texto = document.createElement("span");
            texto.textContent = mensaje || "Cargando...";

            contenedor.append(
                crearIcono("bi-arrow-repeat spin"),
                texto
            );

            celda.appendChild(contenedor);

        } else {

            const esError = tipo === "error";

            const contenedor = document.createElement("div");
            contenedor.className = esError
                ? "estado-error"
                : "estado-vacio";
            contenedor.setAttribute("role", esError ? "alert" : "status");

            const iconoContenedor = document.createElement("div");
            iconoContenedor.className = esError
                ? "estado-error-icono"
                : "estado-vacio-icono";

            iconoContenedor.appendChild(
                crearIcono(
                    icono || (esError
                        ? "bi-exclamation-triangle"
                        : "bi-inbox")
                )
            );

            const encabezado = document.createElement("h3");
            encabezado.textContent = titulo || (esError
                ? "Ocurrió un error"
                : "Sin registros");

            const parrafo = document.createElement("p");
            parrafo.textContent = mensaje || (esError
                ? "Intentá nuevamente en unos momentos."
                : "Todavía no hay información para mostrar.");

            contenedor.append(iconoContenedor, encabezado, parrafo);

            celda.appendChild(contenedor);
        }

        fila.appendChild(celda);

        return fila;
    }

    function mostrarEstadoTabla(tbody, opciones) {

        if (!tbody) {
            return;
        }

        tbody.innerHTML = "";
        tbody.appendChild(construirFilaEstado(opciones));
    }

    function actualizarSinResultados(tbody, visibles, total, opciones) {

        if (!tbody) {
            return;
        }

        const filaExistente = tbody.querySelector(".fila-sin-resultados");
        const debeMostrar = total > 0 && visibles === 0;

        if (!debeMostrar) {

            if (filaExistente) {
                filaExistente.remove();
            }

            return;
        }

        if (filaExistente) {
            return;
        }

        const fila = construirFilaEstado({
            tipo: "vacio",
            icono: "bi-search",
            titulo: "Sin resultados",
            mensaje: "No hay coincidencias con los filtros aplicados.",
            ...opciones
        });

        fila.classList.add("fila-sin-resultados");
        tbody.appendChild(fila);
    }

    window.mostrarEstadoTabla = mostrarEstadoTabla;
    window.actualizarSinResultados = actualizarSinResultados;

})();
