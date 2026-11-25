"use strict";

/**
 * NEURONA SOUVANIC (Frontend) - Bus de Eventos y Orquestador de Estado
 *
 * Conecta de forma desacoplada los módulos de UI:
 *  - auth.js (sesión, expiración, cierre de sesión)
 *  - sidebar.js (navegación, rol activo)
 *  - notificaciones.js (toasts y alertas)
 *  - módulos (dashboard, productos, clientes, facturas, inventario)
 */

(function () {
    const MAX_HISTORIAL = 100;
    const sinapsis = new Map();
    const historial = [];
    const estadoCompartido = new Map();

    function suscribir(evento, handler, opciones = {}) {
        if (typeof evento !== "string" || !evento.trim() || typeof handler !== "function") {
            return () => {};
        }

        const clave = evento.trim();
        if (!sinapsis.has(clave)) {
            sinapsis.set(clave, new Set());
        }

        const entrada = {
            nombre: opciones.nombre || handler.name || "sinapsis_ui",
            handler,
            unaVez: Boolean(opciones.unaVez)
        };

        sinapsis.get(clave).add(entrada);

        return function desuscribir() {
            const grupo = sinapsis.get(clave);
            if (grupo) {
                grupo.delete(entrada);
                if (grupo.size === 0) sinapsis.delete(clave);
            }
        };
    }

    function unaVez(evento, handler, opciones = {}) {
        return suscribir(evento, handler, { ...opciones, unaVez: true });
    }

    function emitir(evento, payload = {}) {
        if (typeof evento !== "string" || !evento.trim()) return;

        const registro = {
            evento: evento.trim(),
            payload,
            timestamp: new Date().toISOString()
        };

        historial.push(registro);
        if (historial.length > MAX_HISTORIAL) {
            historial.shift();
        }

        const [dominio] = registro.evento.split(":");
        const claves = [registro.evento];
        if (dominio && registro.evento !== `${dominio}:*`) {
            claves.push(`${dominio}:*`);
        }
        if (registro.evento !== "*") {
            claves.push("*");
        }

        for (const clave of claves) {
            const grupo = sinapsis.get(clave);
            if (!grupo) continue;

            for (const entrada of Array.from(grupo)) {
                if (entrada.unaVez) {
                    grupo.delete(entrada);
                }
                try {
                    entrada.handler(registro.payload, registro);
                } catch (error) {
                    console.error(`[Neurona UI] Error en "${entrada.nombre}" (${registro.evento}):`, error);
                }
            }
        }
    }

    function fijarEstado(clave, valor) {
        estadoCompartido.set(clave, valor);
        emitir(`estado:${clave}`, { valor });
    }

    function obtenerEstado(clave, valorPorDefecto = null) {
        return estadoCompartido.has(clave) ? estadoCompartido.get(clave) : valorPorDefecto;
    }

    function obtenerHistorial(limite = 30) {
        return historial.slice(-limite).reverse();
    }

    // Sinapsis por defecto: puente hacia SouvanicUI cuando esté disponible
    suscribir("neurona:notificar", payload => {
        if (window.SouvanicUI && typeof window.SouvanicUI.notificar === "function") {
            window.SouvanicUI.notificar(payload.mensaje, payload.tipo || "info", payload.opciones || {});
        }
    }, { nombre: "puente_notificaciones" });

    window.SouvanicNeurona = {
        suscribir,
        unaVez,
        emitir,
        fijarEstado,
        obtenerEstado,
        obtenerHistorial
    };

    window.Neurona = window.SouvanicNeurona;
})();

