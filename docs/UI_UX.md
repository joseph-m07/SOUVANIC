# Documentación UI/UX — SOUVANIC

## 1. Identidad Visual y Sistema de Diseño

### 1.1 Tipografía e Iconografía
- **Fuente principal**: `Inter` (pesos 300 a 800, cargada desde Google Fonts).
- **Iconografía**: `Bootstrap Icons v1.11.3` (`bi-*`), utilizada de forma consistente en sidebar, formularios, alertas, modales y tablas.

### 1.2 Paleta y Lenguaje Visual
- **Color corporativo primario**: Azul institucional (`#1a4b77` / hover `#113355`), presente en botones primarios, foco de inputs y enlaces de acción.
- **Superficies**: Fondos claros de alto contraste para lectura prolongada en punto de venta y administración, con tarjetas elevadas de bordes suaves.
- **Estados semánticos**:
  - `success`: Verde para confirmaciones de guardado, facturación exitosa y stock saludable.
  - `warning`: Ámbar para alertas de stock mínimo y advertencias operativas.
  - `error`: Rojo para errores de validación, fallos de red o acciones destructivas (anulación/eliminación).
  - `info`: Azul informativo para estados neutros.

---

## 2. Arquitectura de Interfaz (App Shell)

Todas las pantallas autenticadas (`dashboard.html`, `productos.html`, `clientes.html`, `facturas.html`, `inventario.html`) comparten una estructura unificada:

1. **Guardia de Sesión en `<head>`**: Script temprano que redirige a `index.html` si no existe `token` en `sessionStorage`, evitando parpadeos de contenido protegido.
2. **Sidebar lateral (`sidebar.js`)**:
   - Logotipo (`../assets/Logo.png`) y marca SOUVANIC.
   - Navegación principal: Dashboard, Productos, Clientes, Nueva Factura, Historial de Facturas (`facturas.html#historial`), Inventario.
   - Indicador de página activa (`.active`) y cierre de sesión.
3. **Área principal**:
   - Encabezado contextual con título, subtítulo y acciones primarias.
   - Filtros, tarjetas KPI o formularios de captura rápida.
   - Tablas responsivas con estados vacíos, de carga y error gestionados por `ui-estados.js`.

---

## 3. Patrones de Interacción y Retroalimentación

### 3.1 Notificaciones Toast (`notificaciones.js`)
- API global `window.SouvanicUI.notificar(mensaje, tipo, opciones)`.
- Atributos ARIA (`aria-live="polite"`, `role="alert"` para errores, `role="status"` para el resto).
- Autocierre progresivo según severidad (`4.2s` éxito, `4.8s` info, `6s` advertencia, `7s` error) con barra/temporizador visual y botón de cierre manual.
- Conectado con `SouvanicNeurona` mediante el evento `neurona:notificar`.

### 3.2 Diálogos de Confirmación (`SouvanicUI.confirmar`)
- Promesa asíncrona (`Promise<boolean>`) accesible (`role="alertdialog"`, `aria-modal="true"`, cierre con `Escape` o clic fuera).
- Modo `peligro: true` para acciones irreversibles (anular factura, eliminar cliente/producto), enfocando por defecto el botón **Cancelar** para prevenir clics accidentales.

### 3.3 Estándar de Listados (Lista + Chevron `>` + Ventana de Opciones)
Para mantener las tablas limpias, legibles y consistentes en escritorio y móvil:
1. **Filas limpias sin saturación de botones**: En los módulos principales (**Socios**, **Productos**, **Historial de Facturas** e **Inventario**), no se muestran múltiples botones inline (`Editar`, `Eliminar`, `Ver`, etc.) por cada fila.
2. **Fila clickeable + Chevron `>`**: Toda fila (`tr.socio-fila` dentro de `table.tabla-socios-lista`) es interactiva (`tabindex="0"`, `role="button"`, navegable por teclado con `Enter`/`Espacio`) y finaliza en una columna estrecha (`.col-chevron`) con un único indicador **`>`** (`.socio-chevron-btn`).
3. **Ventana de Opciones**: Al hacer clic en cualquier parte de la fila o en `>`, se abre una ventana modal (`.socio-opciones-modal`) con:
   - Encabezado e identidad del registro (nombre, código/ID y badges).
   - Resumen de datos clave.
   - Lista vertical de acciones disponibles (`.btn-socio-opcion`), respetando permisos por rol (`esAdministrador()`).

### 3.4 Flujo de Login (`index.html` + `login.js`)
- Diseño dividido (split shell): panel de formulario a la izquierda y panel de marca con logotipo a la derecha.
- Estados de foco claros (`.login-input:focus-within`), alerta inline (`#loginAlerta`) y redirección automática a `dashboard.html` si ya hay sesión.

---

## 4. Recomendaciones UX Pendientes
1. **Unificar scripts base en `dashboard.html`**: Incluir `notificaciones.js` y `ui-estados.js` en `dashboard.html` para que las notificaciones toast funcionen igual que en el resto de páginas.
2. **Recuperación de contraseña**: Implementar o retirar el enlace `"¿Olvidaste tu contraseña?"` en `index.html` (actualmente apunta a `#`).
3. **Indicador visual de Neurona**: Agregar un badge discreto en el topbar/dashboard que muestre alertas en tiempo real emitidas por `SouvanicNeurona` cuando el stock cae por debajo del mínimo.
4. **Soporte offline de fuentes/íconos**: Empaquetar localmente `bootstrap-icons` para entornos de tienda con conectividad intermitente.

