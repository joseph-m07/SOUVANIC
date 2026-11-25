"use strict";

const { neurona } = require("../core/neurona");

/**
 * Capa de integración bancaria preparada pero DESACTIVADA.
 * No contiene endpoints, credenciales ni respuestas simuladas.
 */
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

const METODOS_PAGO = ["Efectivo", "Tarjeta", "Transferencia"];
const BANCOS_TARJETA = ["BAC", "LAFISE", "BANPRO"];

function obtenerProveedor(banco) {
    return PROVEEDORES_BANCARIOS[banco] || null;
}

function integracionHabilitada(banco) {
    const proveedor = obtenerProveedor(banco);
    return Boolean(proveedor && proveedor.habilitado);
}

function redondearMoneda(valor) {
    return Math.round((Number(valor) + Number.EPSILON) * 100) / 100;
}

function errorHttp(mensaje, status = 400) {
    const error = new Error(mensaje);
    error.status = status;
    return error;
}

function validarPagoManual(pago, indice) {
    const etiqueta = `Pago ${indice + 1}`;

    if (!pago || typeof pago !== "object") {
        throw errorHttp(`${etiqueta}: los datos no son válidos.`);
    }

    if (!METODOS_PAGO.includes(pago.metodo)) {
        throw errorHttp(
            `${etiqueta}: el método debe ser Efectivo, Tarjeta o Transferencia. ` +
            "El pago combinado se registra como varios pagos."
        );
    }

    const monto = redondearMoneda(pago.monto);

    if (!Number.isFinite(monto) || monto <= 0) {
        throw errorHttp(`${etiqueta}: el monto debe ser mayor que cero.`);
    }

    const Banco = typeof pago.banco === "string" ? pago.banco.trim() : "";
    const Referencia = typeof pago.referencia === "string" ? pago.referencia.trim() : "";
    const Observaciones = typeof pago.observaciones === "string" ? pago.observaciones.trim() : "";

    if (Observaciones.length > 255 || Referencia.length > 60) {
        throw errorHttp(`${etiqueta}: uno de los textos supera la longitud permitida.`);
    }

    let MontoRecibido = null;
    let Vuelto = null;
    let BancoDestino = null;
    let CuentaDestino = null;

    if (pago.metodo === "Efectivo") {
        MontoRecibido =
            pago.montoRecibido === undefined ||
            pago.montoRecibido === null ||
            pago.montoRecibido === ""
                ? monto
                : redondearMoneda(pago.montoRecibido);

        if (!Number.isFinite(MontoRecibido) || MontoRecibido < monto) {
            throw errorHttp(
                `${etiqueta}: el efectivo recibido no puede ser menor que el monto aplicado.`
            );
        }

        Vuelto = redondearMoneda(MontoRecibido - monto);
    } else if (pago.metodo === "Tarjeta") {
        if (!BANCOS_TARJETA.includes(Banco)) {
            throw errorHttp(
                `${etiqueta}: seleccioná un banco emisor válido (BAC, LAFISE o BANPRO).`
            );
        }

        if (!Referencia) {
            throw errorHttp(`${etiqueta}: la referencia o autorización es obligatoria.`);
        }
    } else if (pago.metodo === "Transferencia") {
        if (!Banco) {
            throw errorHttp(`${etiqueta}: el banco de origen es obligatorio.`);
        }

        if (!Referencia) {
            throw errorHttp(`${etiqueta}: la referencia de transferencia es obligatoria.`);
        }

        BancoDestino =
            typeof pago.bancoDestino === "string"
                ? pago.bancoDestino.trim().slice(0, 60) || null
                : null;

        CuentaDestino =
            typeof pago.cuentaDestino === "string"
                ? pago.cuentaDestino.trim().slice(0, 60) || null
                : null;
    }

    const pagoNormalizado = {
        metodo: pago.metodo,
        monto,
        montoRecibido: MontoRecibido,
        vuelto: Vuelto,
        banco: Banco || null,
        bancoDestino: BancoDestino,
        cuentaDestino: CuentaDestino,
        referencia: Referencia || null,
        observaciones: Observaciones || null
    };

    if (pago.metodo === "Tarjeta" && !integracionHabilitada(Banco)) {
        neurona.emitir("pago:validacion_manual", {
            metodo: pago.metodo,
            banco: Banco,
            monto
        }, { origen: "pagos.service" });
    }

    return pagoNormalizado;
}

module.exports = {
    PROVEEDORES_BANCARIOS,
    METODOS_PAGO,
    BANCOS_TARJETA,
    obtenerProveedor,
    integracionHabilitada,
    redondearMoneda,
    errorHttp,
    validarPagoManual
};

