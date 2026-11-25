"use strict";

// ==========================================
// EXPORTACIÓN XLSX SIN DEPENDENCIAS EXTERNAS
// ==========================================

(function () {

    const TIPO_XLSX =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    const TABLA_CRC32 = (function () {

        const tabla = new Uint32Array(256);

        for (let n = 0; n < 256; n++) {

            let c = n;

            for (let k = 0; k < 8; k++) {
                c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
            }

            tabla[n] = c >>> 0;
        }

        return tabla;
    })();

    const codificador = new TextEncoder();

    function textoABytes(texto) {
        return codificador.encode(texto);
    }

    function crc32(datos) {

        let crc = 0xFFFFFFFF;

        for (let i = 0; i < datos.length; i++) {
            crc = TABLA_CRC32[(crc ^ datos[i]) & 0xFF] ^ (crc >>> 8);
        }

        return (crc ^ 0xFFFFFFFF) >>> 0;
    }

    function concatenar(partes) {

        let total = 0;

        partes.forEach(parte => {
            total += parte.length;
        });

        const salida = new Uint8Array(total);
        let posicion = 0;

        partes.forEach(parte => {
            salida.set(parte, posicion);
            posicion += parte.length;
        });

        return salida;
    }

    function crearZip(archivos) {

        const ahora = new Date();

        const hora =
            (ahora.getHours() << 11) |
            (ahora.getMinutes() << 5) |
            Math.floor(ahora.getSeconds() / 2);

        const fecha =
            ((ahora.getFullYear() - 1980) << 9) |
            ((ahora.getMonth() + 1) << 5) |
            ahora.getDate();

        const partesLocales = [];
        const partesCentrales = [];

        let desplazamiento = 0;

        archivos.forEach(archivo => {

            const nombre = textoABytes(archivo.nombre);
            const datos = archivo.datos;
            const crc = crc32(datos);

            const cabeceraLocal = new Uint8Array(30 + nombre.length);
            const local = new DataView(cabeceraLocal.buffer);

            local.setUint32(0, 0x04034B50, true);
            local.setUint16(4, 20, true);
            local.setUint16(6, 0x0800, true);
            local.setUint16(8, 0, true);
            local.setUint16(10, hora, true);
            local.setUint16(12, fecha, true);
            local.setUint32(14, crc, true);
            local.setUint32(18, datos.length, true);
            local.setUint32(22, datos.length, true);
            local.setUint16(26, nombre.length, true);
            local.setUint16(28, 0, true);

            cabeceraLocal.set(nombre, 30);

            partesLocales.push(cabeceraLocal, datos);

            const cabeceraCentral = new Uint8Array(46 + nombre.length);
            const central = new DataView(cabeceraCentral.buffer);

            central.setUint32(0, 0x02014B50, true);
            central.setUint16(4, 20, true);
            central.setUint16(6, 20, true);
            central.setUint16(8, 0x0800, true);
            central.setUint16(10, 0, true);
            central.setUint16(12, hora, true);
            central.setUint16(14, fecha, true);
            central.setUint32(16, crc, true);
            central.setUint32(20, datos.length, true);
            central.setUint32(24, datos.length, true);
            central.setUint16(28, nombre.length, true);
            central.setUint32(42, desplazamiento, true);

            cabeceraCentral.set(nombre, 46);

            partesCentrales.push(cabeceraCentral);

            desplazamiento += cabeceraLocal.length + datos.length;
        });

        const tamanoCentral = partesCentrales.reduce(
            (total, parte) => total + parte.length,
            0
        );

        const fin = new Uint8Array(22);
        const cierre = new DataView(fin.buffer);

        cierre.setUint32(0, 0x06054B50, true);
        cierre.setUint16(8, archivos.length, true);
        cierre.setUint16(10, archivos.length, true);
        cierre.setUint32(12, tamanoCentral, true);
        cierre.setUint32(16, desplazamiento, true);

        return concatenar([...partesLocales, ...partesCentrales, fin]);
    }

    function escaparXml(valor) {

        return String(valor ?? "")
            .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&apos;");
    }

    function letraColumna(indice) {

        let letra = "";
        let numero = indice + 1;

        while (numero > 0) {
            const resto = (numero - 1) % 26;
            letra = String.fromCharCode(65 + resto) + letra;
            numero = Math.floor((numero - 1) / 26);
        }

        return letra;
    }

    function celdaTexto(referencia, estilo, valor) {
        return `<c r="${referencia}" s="${estilo}" t="inlineStr">` +
            `<is><t xml:space="preserve">${escaparXml(valor)}</t></is></c>`;
    }

    function celdaNumero(referencia, estilo, valor) {

        const numero = Number(valor);

        if (!Number.isFinite(numero)) {
            return celdaTexto(referencia, estilo, "");
        }

        return `<c r="${referencia}" s="${estilo}"><v>${numero}</v></c>`;
    }

    function obtenerEstado(stock, umbral) {

        if (stock <= 0) {
            return { etiqueta: "Agotado", estilo: 7 };
        }

        if (stock <= umbral) {
            return { etiqueta: "Stock bajo", estilo: 6 };
        }

        return { etiqueta: "Disponible", estilo: 8 };
    }

    function xmlHojaInventario(productos, umbral) {

        const columnas = [
            { titulo: "Código", ancho: 16 },
            { titulo: "Producto", ancho: 34 },
            { titulo: "Categoría", ancho: 18 },
            { titulo: "Stock", ancho: 10 },
            { titulo: "Stock mínimo", ancho: 13 },
            { titulo: "Estado del stock", ancho: 16 },
            { titulo: "Precio unitario", ancho: 18 },
            { titulo: "Valor del inventario", ancho: 20 },
            { titulo: "Estado del producto", ancho: 17 }
        ];

        const filas = [];

        const celdasEncabezado = columnas.map((columna, indice) =>
            celdaTexto(`${letraColumna(indice)}1`, 1, columna.titulo)
        );

        filas.push(
            `<row r="1" ht="28" customHeight="1">${celdasEncabezado.join("")}</row>`
        );

        productos.forEach((producto, indice) => {

            const numeroFila = indice + 2;

            const stock = Number(producto.Stock) || 0;
            const precio = Number(producto.Precio) || 0;
            const minimo = Number.isFinite(Number(producto.StockMinimo))
                ? Number(producto.StockMinimo)
                : umbral;
            const estado = obtenerEstado(stock, minimo);

            const celdas = [
                celdaTexto(`A${numeroFila}`, 2, producto.CodigoProducto ?? ""),
                celdaTexto(`B${numeroFila}`, 2, producto.Nombre ?? ""),
                celdaTexto(`C${numeroFila}`, 2, producto.Categoria ?? ""),
                celdaNumero(`D${numeroFila}`, 3, stock),
                celdaNumero(`E${numeroFila}`, 3, minimo),
                celdaTexto(`F${numeroFila}`, estado.estilo, estado.etiqueta),
                celdaNumero(`G${numeroFila}`, 4, precio),
                celdaNumero(
                    `H${numeroFila}`,
                    4,
                    Math.round(precio * stock * 100) / 100
                ),
                celdaTexto(
                    `I${numeroFila}`,
                    2,
                    producto.Activo === false ? "Inactivo" : "Activo"
                )
            ];

            filas.push(`<row r="${numeroFila}">${celdas.join("")}</row>`);
        });

        const ultimaFila = Math.max(1, productos.length + 1);
        const rango = `A1:I${ultimaFila}`;

        const columnasXml = columnas.map((columna, indice) =>
            `<col min="${indice + 1}" max="${indice + 1}" ` +
            `width="${columna.ancho}" customWidth="1"/>`
        ).join("");

        return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
            `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
            `<dimension ref="${rango}"/>` +
            `<sheetViews><sheetView tabSelected="1" workbookViewId="0">` +
            `<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>` +
            `<selection pane="bottomLeft" activeCell="A2" sqref="A2"/>` +
            `</sheetView></sheetViews>` +
            `<sheetFormatPr defaultRowHeight="16"/>` +
            `<cols>${columnasXml}</cols>` +
            `<sheetData>${filas.join("")}</sheetData>` +
            `<autoFilter ref="${rango}"/>` +
            `<pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>` +
            `</worksheet>`;
    }

    function xmlHojaSimple(columnas, filas) {

        const ultimaFila = Math.max(1, filas.length + 1);
        const rango = `A1:${letraColumna(columnas.length - 1)}${ultimaFila}`;

        const celdasEncabezado = columnas.map((columna, indice) =>
            celdaTexto(`${letraColumna(indice)}1`, 1, columna.titulo)
        );

        const filasXml = [
            `<row r="1" ht="28" customHeight="1">${celdasEncabezado.join("")}</row>`,
            ...filas
        ];

        const columnasXml = columnas.map((columna, indice) =>
            `<col min="${indice + 1}" max="${indice + 1}" ` +
            `width="${columna.ancho}" customWidth="1"/>`
        ).join("");

        return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
            `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
            `<dimension ref="${rango}"/>` +
            `<sheetViews><sheetView tabSelected="1" workbookViewId="0">` +
            `<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>` +
            `<selection pane="bottomLeft" activeCell="A2" sqref="A2"/>` +
            `</sheetView></sheetViews>` +
            `<sheetFormatPr defaultRowHeight="16"/>` +
            `<cols>${columnasXml}</cols>` +
            `<sheetData>${filasXml.join("")}</sheetData>` +
            `<autoFilter ref="${rango}"/>` +
            `<pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>` +
            `</worksheet>`;
    }

    function xmlHojaListado(productos) {

        const columnas = [
            { titulo: "Código", ancho: 16 },
            { titulo: "Producto", ancho: 36 },
            { titulo: "Categoría", ancho: 20 },
            { titulo: "Precio unitario", ancho: 18 },
            { titulo: "Stock mínimo", ancho: 13 },
            { titulo: "Estado", ancho: 12 }
        ];

        const filas = productos.map((producto, indice) => {

            const fila = indice + 2;

            const minimo = Number.isFinite(Number(producto.StockMinimo))
                ? Number(producto.StockMinimo)
                : 5;

            const celdas = [
                celdaTexto(`A${fila}`, 2, producto.CodigoProducto ?? ""),
                celdaTexto(`B${fila}`, 2, producto.Nombre ?? ""),
                celdaTexto(`C${fila}`, 2, producto.Categoria ?? ""),
                celdaNumero(`D${fila}`, 4, Number(producto.Precio) || 0),
                celdaNumero(`E${fila}`, 3, minimo),
                celdaTexto(
                    `F${fila}`,
                    2,
                    producto.Activo === false ? "Inactivo" : "Activo"
                )
            ];

            return `<row r="${fila}">${celdas.join("")}</row>`;
        });

        return xmlHojaSimple(columnas, filas);
    }

    function xmlHojaUnidades(productos) {

        const columnas = [
            { titulo: "Categoría", ancho: 22 },
            { titulo: "Productos registrados", ancho: 20 },
            { titulo: "Unidades físicas en stock", ancho: 24 },
            { titulo: "Valor del inventario", ancho: 20 }
        ];

        const categorias = new Map();

        productos.forEach(producto => {

            const nombre = String(producto.Categoria || "Sin categoría").trim() || "Sin categoría";
            const clave = nombre.toLowerCase();

            if (!categorias.has(clave)) {
                categorias.set(clave, {
                    nombre,
                    productos: 0,
                    unidades: 0,
                    valor: 0
                });
            }

            const item = categorias.get(clave);
            const stock = Number(producto.Stock) || 0;
            const precio = Number(producto.Precio) || 0;

            item.productos += 1;
            item.unidades += stock;
            item.valor += Math.round(precio * stock * 100) / 100;
        });

        const lista = Array.from(categorias.values())
            .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

        const filas = lista.map((item, indice) => {

            const fila = indice + 2;

            const celdas = [
                celdaTexto(`A${fila}`, 2, item.nombre),
                celdaNumero(`B${fila}`, 3, item.productos),
                celdaNumero(`C${fila}`, 3, item.unidades),
                celdaNumero(`D${fila}`, 4, item.valor)
            ];

            return `<row r="${fila}">${celdas.join("")}</row>`;
        });

        const totalProductos = lista.reduce((suma, item) => suma + item.productos, 0);
        const totalUnidades = lista.reduce((suma, item) => suma + item.unidades, 0);
        const totalValor = lista.reduce((suma, item) => suma + item.valor, 0);

        const filaTotal = lista.length + 2;

        filas.push(
            `<row r="${filaTotal}">` +
            celdaTexto(`A${filaTotal}`, 9, "TOTAL GENERAL") +
            celdaNumero(`B${filaTotal}`, 10, totalProductos) +
            celdaNumero(`C${filaTotal}`, 10, totalUnidades) +
            celdaNumero(`D${filaTotal}`, 11, Math.round(totalValor * 100) / 100) +
            `</row>`
        );

        return xmlHojaSimple(columnas, filas);
    }

    function formatearFechaHoraXLSX(fecha) {

        const valor = new Date(fecha);

        if (isNaN(valor.getTime())) return "Sin fecha";

        const dosDigitos = numero => String(numero).padStart(2, "0");

        return `${dosDigitos(valor.getDate())}/${dosDigitos(valor.getMonth() + 1)}/${valor.getFullYear()} ` +
            `${dosDigitos(valor.getHours())}:${dosDigitos(valor.getMinutes())}`;
    }

    function xmlHojaMovimientos(movimientos) {

        const columnas = [
            { titulo: "N° movimiento", ancho: 14 },
            { titulo: "Fecha", ancho: 20 },
            { titulo: "Tipo", ancho: 16 },
            { titulo: "Código", ancho: 16 },
            { titulo: "Producto", ancho: 32 },
            { titulo: "Cantidad", ancho: 12 },
            { titulo: "Stock anterior", ancho: 15 },
            { titulo: "Stock nuevo", ancho: 14 },
            { titulo: "Responsable", ancho: 26 },
            { titulo: "Factura", ancho: 12 },
            { titulo: "Motivo", ancho: 40 },
            { titulo: "Observaciones", ancho: 40 }
        ];

        const filas = movimientos.map((movimiento, indice) => {

            const fila = indice + 2;

            const celdas = [
                celdaNumero(`A${fila}`, 3, Number(movimiento.IdMovimiento) || 0),
                celdaTexto(`B${fila}`, 2, formatearFechaHoraXLSX(movimiento.Fecha)),
                celdaTexto(`C${fila}`, 5, movimiento.TipoMovimiento ?? ""),
                celdaTexto(`D${fila}`, 2, movimiento.CodigoProducto ?? ""),
                celdaTexto(`E${fila}`, 2, movimiento.Producto ?? ""),
                celdaNumero(`F${fila}`, 3, Number(movimiento.Cantidad) || 0),
                celdaNumero(`G${fila}`, 3, Number(movimiento.StockAnterior) || 0),
                celdaNumero(`H${fila}`, 3, Number(movimiento.StockNuevo) || 0),
                celdaTexto(`I${fila}`, 2, movimiento.Responsable ?? ""),
                celdaTexto(
                    `J${fila}`,
                    2,
                    movimiento.IdFactura ? `N° ${movimiento.IdFactura}` : ""
                ),
                celdaTexto(`K${fila}`, 2, movimiento.Motivo ?? ""),
                celdaTexto(`L${fila}`, 2, movimiento.Observaciones ?? "")
            ];

            return `<row r="${fila}">${celdas.join("")}</row>`;
        });

        return xmlHojaSimple(columnas, filas);
    }

    function xmlHojaFacturas(facturas) {

        const columnas = [
            { titulo: "N° factura", ancho: 12 },
            { titulo: "Fecha", ancho: 20 },
            { titulo: "Cliente", ancho: 32 },
            { titulo: "Responsable", ancho: 26 },
            { titulo: "Subtotal", ancho: 15 },
            { titulo: "Descuento", ancho: 15 },
            { titulo: "Impuesto", ancho: 15 },
            { titulo: "Total", ancho: 15 },
            { titulo: "Estado", ancho: 14 },
            { titulo: "Pagado", ancho: 15 },
            { titulo: "Saldo", ancho: 15 },
            { titulo: "Métodos de pago", ancho: 24 },
            { titulo: "Fecha de anulación", ancho: 20 },
            { titulo: "Motivo de anulación", ancho: 36 }
        ];

        const filas = facturas.map((factura, indice) => {

            const fila = indice + 2;

            const total = Number(factura.Total) || 0;
            const pagado = Number(factura.Pagado) || 0;
            const saldo = Math.round((total - pagado) * 100) / 100;

            const celdas = [
                celdaNumero(`A${fila}`, 3, Number(factura.IdFactura) || 0),
                celdaTexto(`B${fila}`, 2, formatearFechaHoraXLSX(factura.Fecha)),
                celdaTexto(`C${fila}`, 2, factura.Cliente ?? ""),
                celdaTexto(`D${fila}`, 2, factura.Responsable ?? ""),
                celdaNumero(`E${fila}`, 4, Number(factura.Subtotal) || 0),
                celdaNumero(`F${fila}`, 4, Number(factura.Descuento) || 0),
                celdaNumero(`G${fila}`, 4, Number(factura.Impuesto) || 0),
                celdaNumero(`H${fila}`, 4, total),
                celdaTexto(`I${fila}`, 5, factura.Estado ?? ""),
                celdaNumero(`J${fila}`, 4, pagado),
                celdaNumero(`K${fila}`, 4, factura.Estado === "Anulada" ? 0 : saldo),
                celdaTexto(`L${fila}`, 2, factura.MetodosPago ?? ""),
                celdaTexto(
                    `M${fila}`,
                    2,
                    factura.FechaAnulacion
                        ? formatearFechaHoraXLSX(factura.FechaAnulacion)
                        : ""
                ),
                celdaTexto(`N${fila}`, 2, factura.MotivoAnulacion ?? "")
            ];

            return `<row r="${fila}">${celdas.join("")}</row>`;
        });

        return xmlHojaSimple(columnas, filas);
    }

    function xmlEstilos() {

        return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
            `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
            `<numFmts count="1">` +
            `<numFmt numFmtId="164" formatCode="&quot;C$&quot;#,##0.00"/>` +
            `</numFmts>` +
            `<fonts count="6">` +
            `<font><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/></font>` +
            `<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font>` +
            `<font><b/><sz val="11"/><color rgb="FF92400E"/><name val="Calibri"/><family val="2"/></font>` +
            `<font><b/><sz val="11"/><color rgb="FF991B1B"/><name val="Calibri"/><family val="2"/></font>` +
            `<font><b/><sz val="11"/><color rgb="FF166534"/><name val="Calibri"/><family val="2"/></font>` +
            `<font><b/><sz val="11"/><color rgb="FF17466C"/><name val="Calibri"/><family val="2"/></font>` +
            `</fonts>` +
            `<fills count="7">` +
            `<fill><patternFill patternType="none"/></fill>` +
            `<fill><patternFill patternType="gray125"/></fill>` +
            `<fill><patternFill patternType="solid"><fgColor rgb="FF17466C"/><bgColor indexed="64"/></patternFill></fill>` +
            `<fill><patternFill patternType="solid"><fgColor rgb="FFFEF3C7"/><bgColor indexed="64"/></patternFill></fill>` +
            `<fill><patternFill patternType="solid"><fgColor rgb="FFFEE2E2"/><bgColor indexed="64"/></patternFill></fill>` +
            `<fill><patternFill patternType="solid"><fgColor rgb="FFDCFCE7"/><bgColor indexed="64"/></patternFill></fill>` +
            `<fill><patternFill patternType="solid"><fgColor rgb="FFEAF2F9"/><bgColor indexed="64"/></patternFill></fill>` +
            `</fills>` +
            `<borders count="2">` +
            `<border><left/><right/><top/><bottom/><diagonal/></border>` +
            `<border>` +
            `<left style="thin"><color rgb="FFD7DEE7"/></left>` +
            `<right style="thin"><color rgb="FFD7DEE7"/></right>` +
            `<top style="thin"><color rgb="FFD7DEE7"/></top>` +
            `<bottom style="thin"><color rgb="FFD7DEE7"/></bottom>` +
            `<diagonal/>` +
            `</border>` +
            `</borders>` +
            `<cellStyleXfs count="1">` +
            `<xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>` +
            `</cellStyleXfs>` +
            `<cellXfs count="12">` +
            `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>` +
            `<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>` +
            `<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>` +
            `<xf numFmtId="3" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>` +
            `<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>` +
            `<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>` +
            `<xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>` +
            `<xf numFmtId="0" fontId="3" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>` +
            `<xf numFmtId="0" fontId="4" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>` +
            `<xf numFmtId="0" fontId="5" fillId="6" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>` +
            `<xf numFmtId="3" fontId="5" fillId="6" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>` +
            `<xf numFmtId="164" fontId="5" fillId="6" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>` +
            `</cellXfs>` +
            `<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>` +
            `</styleSheet>`;
    }

    function xmlTiposContenido() {

        return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
            `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
            `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
            `<Default Extension="xml" ContentType="application/xml"/>` +
            `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
            `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
            `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
            `<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>` +
            `<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>` +
            `</Types>`;
    }

    function xmlRelacionesRaiz() {

        return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
            `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
            `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
            `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>` +
            `<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>` +
            `</Relationships>`;
    }

    function xmlLibro(nombreHoja) {

        return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
            `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ` +
            `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
            `<sheets><sheet name="${escaparXml(nombreHoja || "Inventario")}" sheetId="1" r:id="rId1"/></sheets>` +
            `<calcPr calcId="191029"/>` +
            `</workbook>`;
    }

    function xmlRelacionesLibro() {

        return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
            `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
            `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
            `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
            `</Relationships>`;
    }

    function xmlPropiedades(ahora, tituloDocumento) {

        const fecha = ahora.toISOString();

        return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
            `<cp:coreProperties ` +
            `xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" ` +
            `xmlns:dc="http://purl.org/dc/elements/1.1/" ` +
            `xmlns:dcterms="http://purl.org/dc/terms/" ` +
            `xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">` +
            `<dc:title>${escaparXml(tituloDocumento || "Inventario SOUVANIC")}</dc:title>` +
            `<dc:creator>SOUVANIC</dc:creator>` +
            `<cp:lastModifiedBy>SOUVANIC</cp:lastModifiedBy>` +
            `<dcterms:created xsi:type="dcterms:W3CDTF">${fecha}</dcterms:created>` +
            `<dcterms:modified xsi:type="dcterms:W3CDTF">${fecha}</dcterms:modified>` +
            `</cp:coreProperties>`;
    }

    function xmlAplicacion() {

        return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
            `<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" ` +
            `xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">` +
            `<Application>SOUVANIC</Application>` +
            `<Company>Nicaragua Souvenir</Company>` +
            `<AppVersion>1.0</AppVersion>` +
            `</Properties>`;
    }

    function construirLibroXLSX(xmlHoja, nombreHoja, tituloDocumento) {

        const ahora = new Date();

        const archivos = [
            {
                nombre: "[Content_Types].xml",
                datos: textoABytes(xmlTiposContenido())
            },
            {
                nombre: "_rels/.rels",
                datos: textoABytes(xmlRelacionesRaiz())
            },
            {
                nombre: "docProps/app.xml",
                datos: textoABytes(xmlAplicacion())
            },
            {
                nombre: "docProps/core.xml",
                datos: textoABytes(xmlPropiedades(ahora, tituloDocumento))
            },
            {
                nombre: "xl/workbook.xml",
                datos: textoABytes(xmlLibro(nombreHoja))
            },
            {
                nombre: "xl/_rels/workbook.xml.rels",
                datos: textoABytes(xmlRelacionesLibro())
            },
            {
                nombre: "xl/styles.xml",
                datos: textoABytes(xmlEstilos())
            },
            {
                nombre: "xl/worksheets/sheet1.xml",
                datos: textoABytes(xmlHoja)
            }
        ];

        return crearZip(archivos);
    }

    function listaSegura(productos) {
        return Array.isArray(productos) ? productos : [];
    }

    function construirInventarioXLSX(productos, umbralStockBajo) {

        const umbral = Number.isFinite(Number(umbralStockBajo))
            ? Number(umbralStockBajo)
            : 5;

        return construirLibroXLSX(
            xmlHojaInventario(listaSegura(productos), umbral),
            "Stock por producto",
            "Stock de productos SOUVANIC"
        );
    }

    function construirListadoProductosXLSX(productos) {

        return construirLibroXLSX(
            xmlHojaListado(listaSegura(productos)),
            "Listado de productos",
            "Listado de productos SOUVANIC"
        );
    }

    function construirUnidadesStockXLSX(productos) {

        return construirLibroXLSX(
            xmlHojaUnidades(listaSegura(productos)),
            "Unidades por categoría",
            "Unidades en stock por categoría SOUVANIC"
        );
    }

    function construirMovimientosXLSX(movimientos) {

        return construirLibroXLSX(
            xmlHojaMovimientos(listaSegura(movimientos)),
            "Movimientos",
            "Historial de movimientos de inventario SOUVANIC"
        );
    }

    function construirFacturasXLSX(facturas) {

        return construirLibroXLSX(
            xmlHojaFacturas(listaSegura(facturas)),
            "Facturas",
            "Historial de facturas SOUVANIC"
        );
    }

    function nombreArchivo(prefijo) {

        const hoy = new Date();
        const anio = hoy.getFullYear();
        const mes = String(hoy.getMonth() + 1).padStart(2, "0");
        const dia = String(hoy.getDate()).padStart(2, "0");

        return `inventario-${prefijo}-${anio}-${mes}-${dia}.xlsx`;
    }

    function nombreArchivoFacturas() {

        const hoy = new Date();
        const anio = hoy.getFullYear();
        const mes = String(hoy.getMonth() + 1).padStart(2, "0");
        const dia = String(hoy.getDate()).padStart(2, "0");

        return `facturas-${anio}-${mes}-${dia}.xlsx`;
    }

    function descargarLibro(contenido, nombre) {

        const blob = new Blob([contenido], { type: TIPO_XLSX });
        const url = URL.createObjectURL(blob);

        const enlace = document.createElement("a");
        enlace.href = url;
        enlace.download = nombre;

        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();

        setTimeout(() => URL.revokeObjectURL(url), 1500);
    }

    function exportarInventarioXLSX(productos, umbralStockBajo) {
        descargarLibro(
            construirInventarioXLSX(productos, umbralStockBajo),
            nombreArchivo("stock")
        );
    }

    function exportarListadoProductosXLSX(productos) {
        descargarLibro(
            construirListadoProductosXLSX(productos),
            nombreArchivo("productos")
        );
    }

    function exportarUnidadesStockXLSX(productos) {
        descargarLibro(
            construirUnidadesStockXLSX(productos),
            nombreArchivo("unidades")
        );
    }

    function exportarMovimientosInventarioXLSX(movimientos) {
        descargarLibro(
            construirMovimientosXLSX(movimientos),
            nombreArchivo("movimientos")
        );
    }

    function exportarFacturasXLSX(facturas) {
        descargarLibro(
            construirFacturasXLSX(facturas),
            nombreArchivoFacturas()
        );
    }

    window.ExportadorXLSX = {
        construirInventarioXLSX,
        construirListadoProductosXLSX,
        construirUnidadesStockXLSX,
        construirMovimientosXLSX,
        construirFacturasXLSX,
        exportarInventarioXLSX,
        exportarListadoProductosXLSX,
        exportarUnidadesStockXLSX,
        exportarMovimientosInventarioXLSX,
        exportarFacturasXLSX
    };

})();
