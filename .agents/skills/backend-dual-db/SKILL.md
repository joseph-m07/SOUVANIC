---
name: backend-dual-db
description: >-
  Guía de desarrollo Backend para SOUVANIC. Úsala al crear o modificar endpoints,
  controladores, migraciones en schema.service.js, consultas SQL duales
  (SQLite/SQL Server) y eventos en Neurona.
---

# Skill: Desarrollo Backend y BD Dual (SQLite + SQL Server)

## 1. Flujo para Agregar un Nuevo Endpoint o Dominio
1. **Esquema (`Backend/src/services/schema.service.js`)**:
   - Agrega tablas o columnas nuevas en `asegurarEsquemaSqlite()` (`CREATE TABLE IF NOT EXISTS` / `PRAGMA table_info` + `ALTER TABLE`).
   - Agrega el equivalente aditivo en la sección SQL Server (`IF OBJECT_ID(...) IS NULL` / `IF COL_LENGTH(...) IS NULL`).
2. **Controlador (`Backend/src/controllers/<dominio>.controller.js`)**:
   - Importa `{ sql, config, isSqlite } = require("../config/database")` y `{ neurona } = require("../core/neurona")`.
   - Valida tipos, longitudes y reglas de negocio antes de abrir conexión o transacción.
   - Usa siempre `.input("param", sql.Tipo, valor)` para evitar inyección SQL.
3. **Rutas (`Backend/src/routes/<dominio>.routes.js`)**:
   - Protege con `verificarToken` y aplica `verificarRol("Administrador")` en operaciones sensibles.
   - Monta el router en `Backend/src/server.js`.
4. **Sinapsis en Neurona**:
   - Emite eventos descriptivos (`neurona.emitir("dominio:accion", payload, { origen, idUsuario: req.usuario?.id })`) después de confirmar la operación (`commit`).
   - Si otro módulo debe reaccionar, registra el listener en `Backend/src/services/neurona.listeners.js`.

## 2. Reglas de Compatibilidad SQLite / SQL Server
- El adaptador `database.js` ya convierte automáticamente `dbo.`, `ISNULL(`, `SYSDATETIME()`, `GETDATE()` y `SELECT TOP N`.
- Para **inserciones que devuelven ID** o **actualizaciones que devuelven stock anterior/nuevo**:
  - SQLite: usa `RETURNING ...`.
  - SQL Server: usa `OUTPUT INSERTED.*` / `OUTPUT deleted.*`.
- Para **fechas**: pasa objetos `Date` como parámetro `.input("fecha", sql.DateTime2, fecha)` (el adaptador los formatea en hora local para SQLite).
- Para **errores de clave única**: `database.js` asigna `error.number = 2627` en SQLite, por lo que `if (error.number === 2627 || error.number === 2601)` funciona en ambos motores.
