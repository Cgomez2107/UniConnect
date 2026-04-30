import { Pool } from "pg";
import { loadEnvFile } from "node:process";

try {
  loadEnvFile(".env");
} catch (e) {
  // Ignorar si no existe, usará variables de entorno del sistema
}

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

async function main() {
  try {
    const result = await pool.query(`
      SELECT subject_id, COUNT(*) as count 
      FROM study_requests 
      WHERE is_active = true AND status = 'abierta'
      GROUP BY subject_id
    `);
    
    if (result.rows.length === 0) {
      console.log("No hay grupos activos en ninguna asignatura.");
    } else {
      console.log("Conteo de grupos activos por asignatura:");
      console.table(result.rows);
    }
  } catch (error) {
    console.error("Error al consultar la base de datos:", error);
  } finally {
    await pool.end();
  }
}

main();
