
"use strict";

// ==========================================
// URL DEL BACKEND
// ==========================================

const API_URL = "http://localhost:3000";


// ==========================================
// REALIZAR PETICIONES AUTENTICADAS
// ==========================================

async function fetchAutenticado(ruta, opciones = {}) {

    const token = sessionStorage.getItem("token");

    if (!token) {
        window.location.replace("index.html");
        throw new Error("No hay una sesión activa");
    }

    const headers = new Headers(opciones.headers || {});

    headers.set("Authorization", `Bearer ${token}`);

    const respuesta = await fetch(`${API_URL}${ruta}`, {
        ...opciones,
        headers
    });

    // SESIÓN EXPIRADA O TOKEN INVÁLIDO
    if (respuesta.status === 401) {

        sessionStorage.removeItem("token");
        sessionStorage.removeItem("usuario");

        window.location.replace("index.html");

        throw new Error("La sesión expiró o no es válida");
    }

    return respuesta;
}


// ==========================================
// VERIFICAR SI EL USUARIO ES ADMINISTRADOR
// ==========================================

function esAdministrador() {

    try {

        const usuario = JSON.parse(
            sessionStorage.getItem("usuario")
        );

        return usuario?.rol === "Administrador";

    } catch (error) {

        console.error("Error al verificar el rol:", error);
        return false;
    }
}


 // ==========================================
 // CERRAR SESIÓN
 // ==========================================

function cerrarSesion() {

    // Eliminar las credenciales de la sesión
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("usuario");

    // Regresar al inicio de sesión
    window.location.replace("index.html");
}

