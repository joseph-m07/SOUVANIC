---
name: frontend-modulo-souvanic
description: >-
  Guía de desarrollo Frontend modular para SOUVANIC. Úsala al crear o editar
  archivos JS en frontend/js/modules/ o conectar nuevas vistas con el API y
  el bus de eventos SouvanicNeurona.
---

# Skill: Desarrollo Frontend Modular SOUVANIC

## 1. Convenciones de Código
- Iniciar siempre con `"use strict";`.
- Verificar sesión al arranque (`sessionStorage.getItem("token")`); si no existe, redirigir a `index.html`.
- Realizar todas las peticiones protegidas con `fetchAutenticado(ruta, opciones)` de `auth.js` (inyecta el Bearer token y gestiona automáticamente respuestas `401`).

## 2. Seguridad en el DOM
- Usar `textContent` para insertar datos provenientes del servidor o del usuario (nunca `innerHTML` con datos sin sanitizar, para prevenir XSS).
- Escapar/codificar parámetros de URL con `encodeURIComponent(...)`.

## 3. Comunicación entre Módulos con Neurona
- Usar `window.SouvanicNeurona.emitir("evento", payload)` y `window.SouvanicNeurona.suscribir("evento", handler)` para coordinar actualizaciones sin acoplar módulos directamente.
- Para disparar notificaciones globales desde cualquier evento, emitir `"neurona:notificar"` o llamar directamente a `SouvanicUI.notificar(mensaje, tipo)`.

## 4. Control de Concurrencia en Formularios
- Usar banderas de bloqueo (ej. `let guardando = false;`) y deshabilitar botones de envío durante `fetchAutenticado` en bloques `try / finally`.
- Controlar visibilidad de acciones exclusivas de Administrador con `esAdministrador()` en UI (recordando que la validación real siempre ocurre en el Backend).
