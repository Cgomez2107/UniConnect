import { Pool } from "pg";
import { loadEnvFile } from "node:process";

try {
  loadEnvFile(".env");
} catch (e) {}

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
      SELECT conname, contype
      FROM pg_constraint
      WHERE conrelid = 'study_requests'::regclass
    `);
    console.log("Constraints:");
    console.log(JSON.stringify(result.rows, null, 2));

    const indexes = await pool.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'study_requests'
    `);
    console.log("\nIndexes:");
    console.log(JSON.stringify(indexes.rows, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await pool.end();
  }
}

main();
