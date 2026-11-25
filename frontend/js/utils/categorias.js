"use strict";

// Registro compartido de categorías creadas desde Productos e Inventario.
// Las categorías asignadas a un producto quedan persistidas en SQL Server;
// este registro mantiene disponibles las creadas antes de asignarlas.

(function () {
    const CLAVE_ALMACENAMIENTO = "souvanic_categorias";
    const CLAVE_ELIMINADAS = "souvanic_categorias_eliminadas";
    const CATEGORIAS_BASE = ["Tazas", "Ropa", "Accesorio", "Artesanía"];
    const LONGITUD_MAXIMA = 50;

    function normalizar(nombre) {
        return String(nombre || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, " ")
            .trim();
    }

    function leerRegistro(clave) {
        try {
            const datos = JSON.parse(localStorage.getItem(clave) || "[]");
            return Array.isArray(datos) ? datos.filter(nombre => typeof nombre === "string") : [];
        } catch (_) {
            return [];
        }
    }

    function guardarRegistro(clave, categorias) {
        localStorage.setItem(clave, JSON.stringify(categorias));
    }

    function listar(categoriasExistentes = []) {
        const resultado = new Map();

        [...CATEGORIAS_BASE, ...leerRegistro(CLAVE_ALMACENAMIENTO)].forEach(nombre => {
            const limpio = String(nombre || "").trim();
            const clave = normalizar(limpio);

            if (limpio && clave && !resultado.has(clave)) {
                resultado.set(clave, limpio);
            }
        });

        leerRegistro(CLAVE_ELIMINADAS).forEach(nombre => {
            resultado.delete(normalizar(nombre));
        });

        // Las categorías que ya usan productos siempre se muestran
        categoriasExistentes.forEach(nombre => {
            const limpio = String(nombre || "").trim();
            const clave = normalizar(limpio);

            if (limpio && clave) {
                resultado.set(clave, limpio);
            }
        });

        return Array.from(resultado.values())
            .sort((a, b) => a.localeCompare(b, "es"));
    }

    function existe(nombre, categoriasExistentes = []) {
        const clave = normalizar(nombre);
        return listar(categoriasExistentes).some(categoria => normalizar(categoria) === clave);
    }

    function crear(nombre, categoriasExistentes = []) {
        const limpio = String(nombre || "").trim().replace(/\s+/g, " ");

        if (!limpio) {
            return { ok: false, mensaje: "Escribí un nombre para la categoría." };
        }

        if (limpio.length > LONGITUD_MAXIMA) {
            return { ok: false, mensaje: `La categoría no puede superar ${LONGITUD_MAXIMA} caracteres.` };
        }

        if (existe(limpio, categoriasExistentes)) {
            return { ok: false, mensaje: "Esa categoría ya existe." };
        }

        const registro = leerRegistro(CLAVE_ALMACENAMIENTO);
        registro.push(limpio);
        guardarRegistro(CLAVE_ALMACENAMIENTO, registro);

        const eliminadas = leerRegistro(CLAVE_ELIMINADAS)
            .filter(categoria => normalizar(categoria) !== normalizar(limpio));
        guardarRegistro(CLAVE_ELIMINADAS, eliminadas);

        return { ok: true, nombre: limpio };
    }

    function eliminar(nombre, categoriasConProductos = []) {
        const limpio = String(nombre || "").trim();

        if (!limpio) {
            return { ok: false, mensaje: "Seleccioná una categoría para eliminar." };
        }

        const clave = normalizar(limpio);

        const asociada = categoriasConProductos.some(categoria =>
            normalizar(categoria) === clave
        );

        if (asociada) {
            return {
                ok: false,
                mensaje: `La categoría "${limpio}" tiene productos asociados. Asigná esos productos a otra categoría antes de eliminarla.`
            };
        }

        const registro = leerRegistro(CLAVE_ALMACENAMIENTO)
            .filter(categoria => normalizar(categoria) !== clave);
        guardarRegistro(CLAVE_ALMACENAMIENTO, registro);

        const eliminadas = leerRegistro(CLAVE_ELIMINADAS)
            .filter(categoria => normalizar(categoria) !== clave);
        eliminadas.push(limpio);
        guardarRegistro(CLAVE_ELIMINADAS, eliminadas);

        return { ok: true, nombre: limpio };
    }

    window.CategoriasSouvanic = {
        listar,
        crear,
        eliminar,
        existe,
        normalizar,
        LONGITUD_MAXIMA
    };
})();
