"use strict";

// Capa de integración bancaria preparada pero DESACTIVADA.
// No contiene endpoints, credenciales ni respuestas simuladas.
// Se habilitará únicamente cuando cada banco entregue documentación
// oficial, autorización y credenciales.

const PROVEEDORES_BANCARIOS = {
    BAC: {
        nombre: "BAC Credomatic",
        habilitado: false,
        motivo: "Pendiente de documentación oficial, autorización y credenciales."
    },
    LAFISE: {
        nombre: "Banco LAFISE",
        habilitado: false,
        motivo: "Pendiente de documentación oficial, autorización y credenciales."
    },
    BANPRO: {
        nombre: "Banpro Grupo Promerica",
        habilitado: false,
        motivo: "Pendiente de documentación oficial, autorización y credenciales."
    }
};

function obtenerProveedor(banco) {
    return PROVEEDORES_BANCARIOS[banco] || null;
}

function integracionHabilitada(banco) {
    const proveedor = obtenerProveedor(banco);
    return Boolean(proveedor && proveedor.habilitado);
}

module.exports = {
    PROVEEDORES_BANCARIOS,
    obtenerProveedor,
    integracionHabilitada
};
