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
    const enrollment = await pool.query(`
      SELECT user_id, subject_id 
      FROM user_subjects 
      LIMIT 1
    `);
    if (enrollment.rows.length === 0) {
        console.log("No enrollments found");
        return;
    }
    const { user_id, subject_id } = enrollment.rows[0];
    console.log(`Using user: ${user_id}, subject: ${subject_id}`);

    for (let i = 1; i <= 5; i++) {
        try {
            await pool.query(
                `INSERT INTO study_requests (author_id, subject_id, title, description, max_members, status, is_active) 
                 VALUES ($1, $2, $3, $4, $5, 'abierta', true)`,
                [user_id, subject_id, `Test Group ${i}`, 'Desc', 5]
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
