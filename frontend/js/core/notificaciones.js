"use strict";

// ==========================================
// NOTIFICACIONES Y CONFIRMACIONES SOUVANIC
// ==========================================

(function () {

    const ICONOS = {
        success: "bi-check-circle-fill",
        error: "bi-x-octagon-fill",
        warning: "bi-exclamation-triangle-fill",
        info: "bi-info-circle-fill"
    };

    const TITULOS = {
        success: "Operación completada",
        error: "Ocurrió un error",
        warning: "Atención",
        info: "Información"
    };

    const DURACIONES = {
        success: 4200,
        info: 4800,
        warning: 6000,
        error: 7000
    };

    let contenedor = null;
    let confirmacionActiva = null;

    function obtenerContenedor() {
        if (!contenedor || !document.body.contains(contenedor)) {
            contenedor = document.createElement("div");
            contenedor.className = "souvanic-toasts";
            contenedor.setAttribute("aria-live", "polite");
            contenedor.setAttribute("aria-atomic", "false");
            document.body.appendChild(contenedor);
        }

        return contenedor;
    }

    function cerrarToast(toast) {
        if (!toast || !toast.parentNode) return;

        toast.classList.add("souvanic-toast-saliendo");

        window.setTimeout(() => {
            toast.remove();
        }, 220);
    }

    function notificar(mensaje, tipo = "info", opciones = {}) {
        const tipoSeguro = ICONOS[tipo] ? tipo : "info";
        const contenedorToasts = obtenerContenedor();

        const toast = document.createElement("div");
        toast.className = `souvanic-toast souvanic-toast-${tipoSeguro}`;
        toast.setAttribute("role", tipoSeguro === "error" ? "alert" : "status");

        const icono = document.createElement("i");
        icono.className = `bi ${ICONOS[tipoSeguro]} souvanic-toast-icono`;
        icono.setAttribute("aria-hidden", "true");

        const contenido = document.createElement("div");
        contenido.className = "souvanic-toast-contenido";

        const titulo = document.createElement("strong");
        titulo.textContent = opciones.titulo || TITULOS[tipoSeguro];

        const texto = document.createElement("p");
        texto.textContent = String(mensaje ?? "");

        contenido.append(titulo, texto);

        const cerrar = document.createElement("button");
        cerrar.type = "button";
        cerrar.className = "souvanic-toast-cerrar";
        cerrar.setAttribute("aria-label", "Cerrar notificación");
        cerrar.innerHTML = '<i class="bi bi-x-lg" aria-hidden="true"></i>';
        cerrar.addEventListener("click", () => cerrarToast(toast));

        toast.append(icono, contenido, cerrar);
        contenedorToasts.appendChild(toast);

        const duracion = opciones.persistente
            ? 0
            : Number(opciones.duracion ?? DURACIONES[tipoSeguro]);

        if (duracion > 0) {
            toast.style.setProperty("--toast-duracion", `${duracion}ms`);
            toast.classList.add("con-temporizador");

            window.setTimeout(() => cerrarToast(toast), duracion);
        }

        return toast;
    }

    function confirmar(opciones = {}) {
        const {
            titulo = "Confirmar acción",
            mensaje = "",
            detalle = "",
            confirmar: textoConfirmar = "Confirmar",
            cancelar: textoCancelar = "Cancelar",
            peligro = false,
            icono = peligro ? "bi-exclamation-octagon-fill" : "bi-question-circle-fill"
        } = opciones;

        if (confirmacionActiva) {
            confirmacionActiva.resolver(false);
            confirmacionActiva.remover();
        }

        return new Promise(resolver => {

            const overlay = document.createElement("div");
            overlay.className = "souvanic-confirmacion";

            const dialogo = document.createElement("div");
            dialogo.className = `souvanic-confirmacion-dialogo ${peligro ? "es-peligrosa" : ""}`;
            dialogo.setAttribute("role", "alertdialog");
            dialogo.setAttribute("aria-modal", "true");
            dialogo.setAttribute("aria-labelledby", "souvanicConfirmacionTitulo");
            dialogo.setAttribute("aria-describedby", "souvanicConfirmacionMensaje");

            const iconoContenedor = document.createElement("div");
            iconoContenedor.className = "souvanic-confirmacion-icono";
            iconoContenedor.innerHTML = `<i class="bi ${icono}" aria-hidden="true"></i>`;

            const encabezado = document.createElement("h2");
            encabezado.id = "souvanicConfirmacionTitulo";
            encabezado.textContent = titulo;

            const parrafo = document.createElement("p");
            parrafo.id = "souvanicConfirmacionMensaje";
            parrafo.textContent = mensaje;

            dialogo.append(iconoContenedor, encabezado, parrafo);

            if (detalle) {
                const nota = document.createElement("p");
                nota.className = "souvanic-confirmacion-detalle";
                nota.textContent = detalle;
                dialogo.appendChild(nota);
            }

            const acciones = document.createElement("div");
            acciones.className = "souvanic-confirmacion-acciones";

            const botonCancelar = document.createElement("button");
            botonCancelar.type = "button";
            botonCancelar.className = "btn-cancelar-categoria";
            botonCancelar.textContent = textoCancelar;

            const botonConfirmar = document.createElement("button");
            botonConfirmar.type = "button";
            botonConfirmar.className = peligro
                ? "btn-confirmar-peligro"
                : "btn-primario";
            botonConfirmar.textContent = textoConfirmar;

            acciones.append(botonCancelar, botonConfirmar);
            dialogo.appendChild(acciones);
            overlay.appendChild(dialogo);

            let resuelto = false;

            function limpiar() {
                document.removeEventListener("keydown", alPresionarTecla);
                overlay.remove();
                confirmacionActiva = null;
            }

            function finalizar(valor) {
                if (resuelto) return;
                resuelto = true;
                limpiar();
                resolver(valor);
            }

            function alPresionarTecla(evento) {
                if (evento.key === "Escape") {
                    evento.preventDefault();
                    finalizar(false);
                }
            }

            botonCancelar.addEventListener("click", () => finalizar(false));
            botonConfirmar.addEventListener("click", () => finalizar(true));

            overlay.addEventListener("click", evento => {
                if (evento.target === overlay) finalizar(false);
            });

            document.addEventListener("keydown", alPresionarTecla);
            document.body.appendChild(overlay);

            confirmacionActiva = {
                resolver: finalizar,
                remover: limpiar
            };

            window.setTimeout(() => botonCancelar.focus(), 30);
        });
    }

    window.SouvanicUI = {
        notificar,
        confirmar
    };

})();
