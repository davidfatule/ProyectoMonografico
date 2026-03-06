/**
 * Conexión a SQL Server.
 * Requiere variables de entorno: DB_SERVER, DB_DATABASE, DB_USER, DB_PASSWORD
 * Opcional: DB_PORT (default 1433), DB_ENCRYPT (true/false).
 */
import sql from "mssql";

const config = {
  server: process.env.DB_SERVER || "localhost",
  database: process.env.DB_DATABASE || "SoportePro",
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || "1433", 10),
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool = null;

export async function getPool() {
  if (pool) return pool;
  if (!config.user || !config.password) {
    throw new Error("Faltan DB_USER y DB_PASSWORD en el entorno. Revisa tu .env.");
  }
  pool = await sql.connect(config);
  return pool;
}

export async function closePool() {
  if (pool) {
    await pool.close();
    pool = null;
  }
}

export { sql };
