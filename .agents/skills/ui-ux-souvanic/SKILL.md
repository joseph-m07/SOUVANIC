---
name: ui-ux-souvanic
description: >-
  Guía de diseño UI/UX para SOUVANIC. Úsala al diseñar o modificar páginas HTML,
  estilos CSS, modales, tablas, tarjetas KPI, badges o flujos de interacción.
---

# Skill: Diseño UI/UX SOUVANIC

## 1. Sistema Visual
- **Tipografía**: `Inter` (Google Fonts) en todos los textos y controles.
- **Iconos**: `Bootstrap Icons` (`bi bi-*`).
- **Colores clave**:
  - Primario corporativo: `#1a4b77` (hover `#113355`).
  - Neutros de superficie: `#ffffff`, `#f8fafc`, bordes `#e2e8f0` / `#cbd5e1`, texto `#334155`.
  - Semánticos:
    - Éxito: `#dcfce7` / `#166534`
    - Información / Cliente: `#dbeafe` / `#1e40af`
    - Advertencia / Proveedor: `#fef3c7` / `#92400e`
    - Peligro / Error: rojos de alerta y botones `.btn-confirmar-peligro`.

## 2. Estructura Obligatoria de Página Autenticada
1. **Guardia temprana en `<head>`**: verificar `sessionStorage.getItem("token")` y redirigir a `index.html` si falta.
2. **Contenedor `.dashboard-container`**:
   - `<aside class="sidebar">` con `.sidebar-brand` (`../assets/Logo.png`), `<nav>` y `.decoracion-momotombo`.
   - `<main class="main-content">` con `.module-header`, barra de herramientas `.products-tools`, contador `.module-contador` (`aria-live="polite"`) y tabla dentro de `.products-table > .tabla-contenedor-responsiva`.
3. **Scripts base al final de `<body>`**:
   - `../js/core/neurona.js`
   - `../js/core/auth.js`
   - `../js/core/notificaciones.js`
   - `../js/core/sidebar.js`
   - `../js/core/ui-estados.js`
   - Módulo específico de `../js/modules/<modulo>.js`

## 3. Reglas de Interacción y Accesibilidad
- **Prohibido usar `alert()`, `confirm()` o `prompt()` nativos**: usar siempre `SouvanicUI.notificar(mensaje, tipo)` y `await SouvanicUI.confirmar({ ..., peligro: true })`.
- **Estados de tabla**: toda tabla debe mostrar estados explícitos (`cargando`, `vacio`, `error`, `sin resultados`) mediante `ui-estados.js`.
- **Modales**: incluir botón de cierre accesible (`aria-label="Cerrar"`), botón `Cancelar` y deshabilitar el botón `Guardar` mientras la petición está en curso para evitar envíos duplicados.
- **Consistencia de dominio**: usar terminología clara para tienda mixta (pulpería, ropa, delivery) y badges diferenciados para clasificaciones (`Cliente`, `Proveedor`, `Empleado`).
