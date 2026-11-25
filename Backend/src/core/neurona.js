"use strict";

/**
 * NEURONA SOUVANIC - Núcleo Central de Arquitectura (Event Bus / Orquestador)
 *
 * Conecta de forma desacoplada los dominios del backend:
 *  - Autenticación (auth:*)
 *  - Productos (producto:*)
 *  - Clientes (cliente:*)
 *  - Facturación y Pagos (factura:*)
 *  - Inventario y Alertas (inventario:*)
 *
 * Características:
 *  - Aislamiento de errores por sinapsis (un listener fallido nunca aborta el flujo principal)
 *  - Soporte para comodines por dominio (ej. "factura:*") y "*" global
 *  - Historial circular en memoria para observabilidad y diagnóstico
 *  - Métricas de emisión y estado de salud del núcleo
 */

const MAX_HISTORIAL = 200;

class NeuronaOrquestador {
    constructor() {
        this._sinapsis = new Map(); // evento -> Set<{ id, nombre, handler, unaVez }>
        this._historial = [];
        this._contadores = new Map();
        this._errores = 0;
        this._iniciadoEn = new Date().toISOString();
    }

    /**
     * Registra una sinapsis (listener) para un evento específico o comodín ("dominio:*", "*").
     * @param {string} evento
     * @param {Function} handler
     * @param {{ nombre?: string, unaVez?: boolean }} [opciones]
     * @returns {Function} Función para desuscribir la sinapsis
     */
    conectar(evento, handler, opciones = {}) {
        if (typeof evento !== "string" || !evento.trim()) {
            throw new TypeError("Neurona.conectar requiere un nombre de evento válido.");
        }
        if (typeof handler !== "function") {
            throw new TypeError("Neurona.conectar requiere una función handler.");
        }

        const clave = evento.trim();
        if (!this._sinapsis.has(clave)) {
            this._sinapsis.set(clave, new Set());
        }

        const entrada = {
            nombre: opciones.nombre || handler.name || "sinapsis_anonima",
            handler,
            unaVez: Boolean(opciones.unaVez)
        };

        this._sinapsis.get(clave).add(entrada);

        return () => {
            const grupo = this._sinapsis.get(clave);
            if (grupo) {
                grupo.delete(entrada);
                if (grupo.size === 0) {
                    this._sinapsis.delete(clave);
                }
            }
        };
    }

    /**
     * Registra una sinapsis que se ejecuta una sola vez.
     */
    unaVez(evento, handler, opciones = {}) {
        return this.conectar(evento, handler, { ...opciones, unaVez: true });
    }

    /**
     * Emite un evento de dominio y ejecuta las sinapsis suscritas de forma segura.
     * No bloquea ni propaga excepciones hacia el controlador que lo invocó.
     * @param {string} evento
     * @param {Record<string, any>} [payload]
     * @param {{ origen?: string, idUsuario?: number }} [meta]
     */
    emitir(evento, payload = {}, meta = {}) {
        if (typeof evento !== "string" || !evento.trim()) return;

        const registro = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            evento,
            payload,
            origen: meta.origen || "sistema",
            idUsuario: meta.idUsuario ?? null,
            timestamp: new Date().toISOString()
        };

        this._historial.push(registro);
        if (this._historial.length > MAX_HISTORIAL) {
            this._historial.shift();
        }

        this._contadores.set(evento, (this._contadores.get(evento) || 0) + 1);

        const [dominio] = evento.split(":");
        const clavesCoincidentes = [evento];
        if (dominio && evento !== `${dominio}:*`) {
            clavesCoincidentes.push(`${dominio}:*`);
        }
        if (evento !== "*") {
            clavesCoincidentes.push("*");
        }

        for (const clave of clavesCoincidentes) {
            const grupo = this._sinapsis.get(clave);
            if (!grupo) continue;

            for (const entrada of Array.from(grupo)) {
                if (entrada.unaVez) {
                    grupo.delete(entrada);
                }

                Promise.resolve()
                    .then(() => entrada.handler(registro))
                    .catch(error => {
                        this._errores += 1;
                        console.error(
                            `[Neurona] Error en sinapsis "${entrada.nombre}" (${evento}):`,
                            error.message
                        );
                    });
            }
        }
    }

    /**
     * Devuelve un resumen del estado actual del núcleo Neurona.
     */
    obtenerEstado() {
        const sinapsisActivas = {};
        for (const [evento, grupo] of this._sinapsis.entries()) {
            sinapsisActivas[evento] = Array.from(grupo).map(s => s.nombre);
        }

        const conteoEventos = {};
        for (const [evento, total] of this._contadores.entries()) {
            conteoEventos[evento] = total;
        }

        return {
            estado: "activo",
            iniciadoEn: this._iniciadoEn,
            totalSinapsis: Object.values(sinapsisActivas).reduce((acc, arr) => acc + arr.length, 0),
            totalEventosEmitidos: this._historial.length,
            erroresAislados: this._errores,
            sinapsisActivas,
            conteoEventos
        };
    }

    /**
     * Devuelve los eventos recientes (más nuevos primero).
     */
    obtenerHistorial(limite = 50) {
        const n = Math.max(1, Math.min(Number(limite) || 50, MAX_HISTORIAL));
        return this._historial.slice(-n).reverse();
    }
}

const neurona = new NeuronaOrquestador();

module.exports = {
    neurona,
    NeuronaOrquestador
};

