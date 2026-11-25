---
name: qa-playwright-souvanic
description: >-
  Guía de QA y verificación automatizada para SOUVANIC. Úsala al validar cambios
  antes de hacer commit/PR: sintaxis JS, integridad de rutas HTML, arranque sin
  BD, modo SQLite y pruebas E2E con Playwright.
---

# Skill: QA y Verificación con Playwright SOUVANIC

## 1. Checklist Mínimo tras Cambios de Código
1. **Sintaxis JS**: Ejecutar `node --check` sobre todos los archivos modificados en `Backend/src/` y `frontend/js/`.
2. **Rutas locales HTML**: Confirmar que todos los `src` y `href` relativos en `frontend/pages/*.html` existen en disco.
3. **Arranque resiliente**:
   - Confirmar que `Backend/src/server.js` escucha en el puerto `3000` de inmediato incluso si la base de datos no responde.
   - En modo SQLite (`DB_CLIENT=sqlite`), verificar `GET /test-db` → `200 OK`.
4. **Datos de prueba**: Ejecutar `cd Backend && npm run seed` para asegurar un estado reproducible.

## 2. Verificación E2E con Playwright
Al probar flujos en navegador headless:
- Capturar y exigir cero fallos en:
  - `pageerror` (excepciones JS no capturadas)
  - `console.error`
  - Respuestas HTTP `>= 400` en recursos locales (`localhost:8080`) o endpoints del API (`localhost:3000`).
- Validar al menos:
  1. Login en `index.html` con `admin` / `admin123456` y redirección a `dashboard.html`.
  2. Carga sin errores de `productos.html`, `clientes.html` (Socios + filtros), `facturas.html` (incluyendo detalle de factura) e `inventario.html`.
  3. Estado de Neurona (`GET /neurona/estado` → `200 OK`).
