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
  const subjectId = "7a4e6b5c-8d1e-4f9a-9b2c-3d4e5f6a7b8c"; // Dummy UUID or use a real one
  // I'll try to find a real subject id first
  try {
    const subjects = await pool.query("SELECT id FROM subjects LIMIT 1");
    if (subjects.rows.length === 0) {
        console.log("No subjects found");
        return;
    }
    const realSubjectId = subjects.rows[0].id;
    console.log(`Using subject: ${realSubjectId}`);

    for (let i = 1; i <= 5; i++) {
        try {
            await pool.query(
                `INSERT INTO study_requests (author_id, subject_id, title, description, max_members, status, is_active) 
                 VALUES ($1, $2, $3, $4, $5, 'abierta', true)`,
                ['00000000-0000-0000-0000-000000000000', realSubjectId, `Test Group ${i}`, 'Desc', 5]
            );
            console.log(`Inserted group ${i}`);
        } catch (e: any) {
            console.log(`Failed group ${i}: ${e.message} (Code: ${e.code})`);
        }
    }
  } catch (error) {
    console.error(error);
  } finally {
    await pool.end();
  }
}

main();
