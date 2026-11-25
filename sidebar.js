"use strict";

// ==========================================
// NAVEGACIÓN GLOBAL: TOP NAVBAR, PERFIL Y SIDEBAR
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const paginaActual = window.location.pathname
        .split("/")
        .pop()
        .toLowerCase();

    const enlaces = document.querySelectorAll(".sidebar nav a");

    enlaces.forEach(enlace => {

        enlace.classList.remove("active");

        const href = enlace.getAttribute("href");

        if (!href || href === "#") return;

        const [archivo, seccion] = href.toLowerCase().split("#");

        if (archivo !== paginaActual) return;

        // Diferenciar Nueva Factura del historial
        if (paginaActual === "facturas.html") {

            const historialActivo =
                window.location.hash.toLowerCase() === "#historial";

            if (historialActivo && seccion === "historial") {
                enlace.classList.add("active");
            }

            if (!historialActivo && !seccion) {
                enlace.classList.add("active");
            }

        } else if (!seccion) {

            enlace.classList.add("active");

        }

    });

});


document.addEventListener("DOMContentLoaded", () => {

    const contenedor = document.querySelector(".dashboard-container");
    const sidebar = document.querySelector(".sidebar");

    if (!contenedor || !sidebar) {
        return;
    }

    const CLAVE_COLAPSADO = "souvanic_sidebar_colapsado";
    const MEDIA_MOVIL = window.matchMedia("(max-width: 900px)");

    const usuario = leerUsuario();

    sidebar.id = sidebar.id || "sidebarPrincipal";

    // ── Barra superior ──
    document.body.prepend(construirTopNavbar(usuario));
    document.body.classList.add("con-top-navbar");

    // ── Eliminar perfil antiguo y cierre de sesión del sidebar ──
    sidebar.querySelector(".sidebar-usuario")?.remove();

    const sidebarBottom = sidebar.querySelector(".sidebar-bottom");

    if (sidebarBottom) {
        sidebarBottom.innerHTML = "";
    }

    // ── Botón de colapsar en la parte inferior del sidebar ──
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "sidebar-toggle";
    boton.id = "sidebarToggle";
    boton.innerHTML = `
        <i class="bi bi-chevron-double-left" aria-hidden="true"></i>
        <span>Ocultar menú</span>
    `;

    if (sidebarBottom) {
        sidebarBottom.appendChild(boton);
    } else {
        sidebar.appendChild(boton);
    }

    sidebar.querySelectorAll("nav a").forEach(enlace => {
        if (!enlace.title) {
            enlace.title = enlace.textContent.trim().replace(/\s+/g, " ");
        }
    });

    function aplicarEstado(colapsado) {

        contenedor.classList.toggle("sidebar-colapsado", colapsado);
        document.body.classList.toggle(
            "sidebar-colapsado-global",
            colapsado && !MEDIA_MOVIL.matches
        );

        boton.setAttribute("aria-expanded", String(!colapsado));
        boton.title = colapsado ? "Mostrar menú lateral" : "Ocultar menú lateral";
        boton.setAttribute(
            "aria-label",
            colapsado ? "Mostrar menú lateral" : "Ocultar menú lateral"
        );

        boton.querySelector("i").className = colapsado
            ? "bi bi-chevron-double-right"
            : "bi bi-chevron-double-left";

        boton.querySelector("span").textContent = colapsado
            ? "Mostrar menú"
            : "Ocultar menú";

        const botonMenu = document.getElementById("btnSidebarMovil");

        if (botonMenu) {

            if (MEDIA_MOVIL.matches) {

                botonMenu.setAttribute("aria-expanded", "false");
                botonMenu.setAttribute("aria-label", "Abrir menú");

            } else {

                botonMenu.setAttribute("aria-expanded", String(!colapsado));
                botonMenu.setAttribute(
                    "aria-label",
                    colapsado ? "Expandir menú lateral" : "Colapsar menú lateral"
                );
            }
        }
    }

    let colapsado = false;

    try {
        colapsado = localStorage.getItem(CLAVE_COLAPSADO) === "1";
    } catch (_) {}

    function sincronizarEstado() {
        aplicarEstado(MEDIA_MOVIL.matches ? false : colapsado);
    }

    sincronizarEstado();

    boton.addEventListener("click", function() {

        if (MEDIA_MOVIL.matches) {
            cerrarSidebarMovil();
            return;
        }

        colapsado = !contenedor.classList.contains("sidebar-colapsado");
        aplicarEstado(colapsado);

        try {
            localStorage.setItem(CLAVE_COLAPSADO, colapsado ? "1" : "0");
        } catch (_) {}

    });

    // ── Sidebar desplegable en pantallas pequeñas ──
    const backdrop = document.createElement("div");
    backdrop.className = "sidebar-backdrop";
    document.body.appendChild(backdrop);

    function abrirSidebarMovil() {
        document.body.classList.add("sidebar-movil-abierto");
        actualizarBotonMovil(true);
    }

    function cerrarSidebarMovil() {
        document.body.classList.remove("sidebar-movil-abierto");
        actualizarBotonMovil(false);
    }

    function actualizarBotonMovil(abierto) {
        const btn = document.getElementById("btnSidebarMovil");
        if (!btn) return;
        btn.setAttribute("aria-expanded", String(abierto));
        btn.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
    }

    document.getElementById("btnSidebarMovil")?.addEventListener("click", function() {

        if (!MEDIA_MOVIL.matches) {
            boton.click();
            return;
        }

        if (document.body.classList.contains("sidebar-movil-abierto")) {
            cerrarSidebarMovil();
        } else {
            abrirSidebarMovil();
        }
    });

    backdrop.addEventListener("click", cerrarSidebarMovil);

    sidebar.querySelectorAll("nav a").forEach(enlace => {
        enlace.addEventListener("click", () => {
            if (MEDIA_MOVIL.matches) {
                cerrarSidebarMovil();
            }
        });
    });

    MEDIA_MOVIL.addEventListener("change", function(evento) {
        if (!evento.matches) {
            cerrarSidebarMovil();
        }
        sincronizarEstado();
    });

    document.addEventListener("keydown", function(evento) {
        if (evento.key === "Escape" &&
            document.body.classList.contains("sidebar-movil-abierto")) {
            cerrarSidebarMovil();
        }
    });

    // ── Menú de perfil ──
    const botonPerfil = document.getElementById("btnPerfilUsuario");
    const menuPerfil = document.getElementById("menuUsuario");

    if (botonPerfil && menuPerfil) {

        function abrirMenuPerfil() {
            menuPerfil.hidden = false;
            botonPerfil.setAttribute("aria-expanded", "true");
        }

        function cerrarMenuPerfil() {
            menuPerfil.hidden = true;
            botonPerfil.setAttribute("aria-expanded", "false");
        }

        botonPerfil.addEventListener("click", function(evento) {
            evento.stopPropagation();
            if (menuPerfil.hidden) {
                abrirMenuPerfil();
            } else {
                cerrarMenuPerfil();
            }
        });

        menuPerfil.addEventListener("click", function(evento) {
            evento.stopPropagation();
        });

        document.addEventListener("click", cerrarMenuPerfil);

        document.addEventListener("keydown", function(evento) {
            if (evento.key === "Escape" && !menuPerfil.hidden) {
                cerrarMenuPerfil();
                botonPerfil.focus();
            }
        });

        document.getElementById("btnCerrarSesionPerfil")
            ?.addEventListener("click", function() {
                cerrarMenuPerfil();
                abrirConfirmacionCerrarSesion(botonPerfil);
            });
    }

    // ── Confirmación de cierre de sesión ──
    function abrirConfirmacionCerrarSesion(origen) {

        const modal = document.createElement("div");
        modal.className = "modal-cerrar-sesion";

        modal.innerHTML = `
            <div class="contenido-cerrar-sesion"
                 role="dialog"
                 aria-modal="true"
                 aria-labelledby="tituloCerrarSesion">

                <h2 id="tituloCerrarSesion">¿Cerrar sesión?</h2>

                <p>
                    ¿Estás seguro de que deseás cerrar sesión
                    en SOUVANIC?
                </p>

                <div class="botones-cerrar-sesion">
                    <button type="button" class="btn-cancelar-sesion">
                        Cancelar
                    </button>

                    <button type="button" class="btn-confirmar-sesion">
                        Sí, cerrar sesión
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const botonCancelar = modal.querySelector(".btn-cancelar-sesion");
        const botonConfirmar = modal.querySelector(".btn-confirmar-sesion");

        const cerrarModal = () => {
            modal.classList.remove("visible");
            modal.remove();
            origen?.focus();
        };

        modal.classList.add("visible");
        botonCancelar.focus();

        botonCancelar.addEventListener("click", cerrarModal);

        botonConfirmar.addEventListener("click", function() {
            if (typeof cerrarSesion === "function") {
                cerrarSesion();
            }
        });

        modal.addEventListener("click", function(evento) {
            if (evento.target === modal) {
                cerrarModal();
            }
        });

        document.addEventListener("keydown", function manejador(evento) {
            if (evento.key === "Escape" && modal.classList.contains("visible")) {
                cerrarModal();
                document.removeEventListener("keydown", manejador);
            }
        });
    }

});


// ==========================================
// HELPERS DE SESIÓN Y ESTRUCTURA
// ==========================================

function leerUsuario() {
    try {
        return JSON.parse(sessionStorage.getItem("usuario")) || {};
    } catch (_) {
        return {};
    }
}

function construirTopNavbar(usuario) {

    const nombre = String(usuario.nombre || "Usuario").trim();
    const rol = String(usuario.rol || "").trim();

    const navbar = document.createElement("header");
    navbar.className = "top-navbar";

    navbar.innerHTML = `
        <div class="top-navbar-izquierda"></div>

        <div class="top-navbar-derecha">
            <button type="button" class="top-navbar-perfil" id="btnPerfilUsuario"
                    aria-haspopup="menu" aria-expanded="false" aria-controls="menuUsuario">
                <span class="perfil-avatar">
                    <i class="bi bi-person-fill" aria-hidden="true"></i>
                </span>
                <span class="perfil-datos">
                    <strong class="perfil-nombre"></strong>
                    <small class="perfil-rol"></small>
                </span>
                <i class="bi bi-chevron-down perfil-flecha" aria-hidden="true"></i>
            </button>

            <div class="menu-usuario" id="menuUsuario" role="menu" hidden>
                <div class="menu-usuario-cabecera">
                    <span class="perfil-avatar">
                        <i class="bi bi-person-fill" aria-hidden="true"></i>
                    </span>
                    <div>
                        <strong class="perfil-nombre"></strong>
                        <span class="perfil-rol"></span>
                    </div>
                </div>
                <button type="button" class="menu-usuario-opcion menu-usuario-salir"
                        id="btnCerrarSesionPerfil" role="menuitem">
                    <i class="bi bi-box-arrow-right" aria-hidden="true"></i>
                    Cerrar sesión
                </button>
            </div>
        </div>
    `;

    navbar.querySelectorAll(".perfil-nombre").forEach(el => {
        el.textContent = nombre;
    });

    navbar.querySelectorAll(".perfil-rol").forEach(el => {
        el.textContent = rol;
        el.hidden = !rol;
    });

    return navbar;
}
