
require("dotenv").config();

const sql = require("mssql/msnodesqlv8");

const config = {
    connectionString:
        `Driver={ODBC Driver 18 for SQL Server};` +
        `Server=tcp:127.0.0.1,56238;` +
        `Database=${process.env.DB_DATABASE};` +
        `Trusted_Connection=Yes;` +
        `Encrypt=Yes;` +
        `TrustServerCertificate=Yes;`
};

module.exports = { sql, config };
