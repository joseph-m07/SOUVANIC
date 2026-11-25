"use strict";

const fs = require("node:fs");
const path = require("node:path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const dbClient = (process.env.DB_CLIENT || (process.env.DB_DATABASE ? "sqlserver" : "sqlite")).toLowerCase();
const isSqlite = dbClient === "sqlite";

let sql;
let config;

if (isSqlite) {
    const { DatabaseSync } = require("node:sqlite");

    const dbPath = process.env.SQLITE_PATH
        ? path.resolve(process.env.SQLITE_PATH)
        : path.resolve(__dirname, "../../data/souvanic.db");

    fs.mkdirSync(path.dirname(dbPath), { recursive: true });

    const db = new DatabaseSync(dbPath);
    db.exec("PRAGMA journal_mode = WAL;");
    db.exec("PRAGMA foreign_keys = ON;");

    function formatearFechaLocal(d) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        const ss = String(d.getSeconds()).padStart(2, "0");
        return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
    }

    function normalizarParametro(valor) {
        if (valor === undefined || valor === null) return null;
        if (typeof valor === "boolean") return valor ? 1 : 0;
        if (valor instanceof Date) return formatearFechaLocal(valor);
        return valor;
    }

    function convertirQuerySqlite(sqlText) {
        let q = sqlText;
        // Convertir dbo.Tabla -> Tabla
        q = q.replace(/\bdbo\./gi, "");
        // Convertir ISNULL( -> COALESCE(
        q = q.replace(/\bISNULL\s*\(/gi, "COALESCE(");
        // Convertir SYSDATETIME() / GETDATE() -> datetime('now', 'localtime')
        q = q.replace(/\bSYSDATETIME\s*\(\s*\)/gi, "datetime('now', 'localtime')");
        q = q.replace(/\bGETDATE\s*\(\s*\)/gi, "datetime('now', 'localtime')");
        // Convertir SELECT TOP N ... -> SELECT ... LIMIT N (cuando es una consulta simple)
        const topMatch = q.match(/^\s*SELECT\s+TOP\s+(\d+)\b/i);
        if (topMatch) {
            const limitN = topMatch[1];
            q = q.replace(/^\s*SELECT\s+TOP\s+\d+\b/i, "SELECT");
            if (!/\bLIMIT\s+\d+\b/i.test(q)) {
                q = `${q.trim().replace(/;$/, "")} LIMIT ${limitN}`;
            }
        }
        return q;
    }

    function extraerNombresParametros(sqlText) {
        const nombres = new Set();
        const regex = /@([a-zA-Z0-9_]+)/g;
        let m;
        while ((m = regex.exec(sqlText)) !== null) {
            nombres.add(m[1]);
        }
        return nombres;
    }

    class SqliteRequest {
        constructor() {
            this._inputs = {};
        }

        input(nombre, _tipo, valor) {
            this._inputs[nombre] = normalizarParametro(valor);
            return this;
        }

        async query(sqlText) {
            const querySql = convertirQuerySqlite(sqlText);
            const usados = extraerNombresParametros(querySql);
            const params = {};
            for (const nombre of usados) {
                params[nombre] = Object.prototype.hasOwnProperty.call(this._inputs, nombre)
                    ? this._inputs[nombre]
                    : null;
            }

            try {
                const stmt = db.prepare(querySql);
                const esLectura = /^\s*(SELECT|WITH|PRAGMA)\b/i.test(querySql) || /\bRETURNING\b/i.test(querySql);

                if (esLectura) {
                    const rows = stmt.all(params);
                    return {
                        recordset: rows,
                        rowsAffected: [rows.length]
                    };
                }

                const info = stmt.run(params);
                return {
                    recordset: [],
                    rowsAffected: [Number(info.changes || 0)]
                };
            } catch (error) {
                if (error && typeof error.message === "string" && error.message.includes("UNIQUE constraint failed")) {
                    error.number = 2627;
                }
                throw error;
            }
        }
    }

    class SqliteTransaction {
        constructor() {
            this._activa = false;
        }

        async begin() {
            db.exec("BEGIN IMMEDIATE");
            this._activa = true;
        }

        async commit() {
            if (this._activa) {
                db.exec("COMMIT");
                this._activa = false;
            }
        }

        async rollback() {
            if (this._activa) {
                db.exec("ROLLBACK");
                this._activa = false;
            }
        }
    }

    const poolSqlite = {
        request: () => new SqliteRequest(),
        _db: db,
        _dbPath: dbPath
    };

    const tipoNoop = () => ({});
    sql = {
        connect: async () => poolSqlite,
        close: async () => {},
        Request: SqliteRequest,
        Transaction: SqliteTransaction,
        Int: tipoNoop,
        BigInt: tipoNoop,
        Bit: tipoNoop,
        Decimal: tipoNoop,
        Float: tipoNoop,
        DateTime2: tipoNoop,
        DateTime: tipoNoop,
        VarChar: tipoNoop,
        NVarChar: tipoNoop,
        Text: tipoNoop
    };

    config = {
        client: "sqlite",
        dbPath
    };
} else {
    sql = require("mssql/msnodesqlv8");

    config = {
        connectionString:
            `Driver={ODBC Driver 18 for SQL Server};` +
            `Server=tcp:${process.env.DB_SERVER || "127.0.0.1"},${process.env.DB_PORT || "56238"};` +
            `Database=${process.env.DB_DATABASE};` +
            `Trusted_Connection=Yes;` +
            `Encrypt=Yes;` +
            `TrustServerCertificate=Yes;` +
            `Connection Timeout=5;`
    };
}

module.exports = {
    sql,
    config,
    isSqlite,
    dbClient
};
