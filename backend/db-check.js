import pg from 'pg';

const pool = new pg.Pool({
  host: 'aws-0-us-west-2.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.becitrklvpadvjwdbmck',
  password: 'ProyectoUniconnect123',
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  try {
    const res = await pool.query("SELECT id, title, status, max_capacity, registered_count FROM events WHERE id = 'bb76057c-2bb1-4217-b3e5-cc714f0318e8'");
    console.log('Target Event:', JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Error connecting or querying DB:', err);
  } finally {
    await pool.end();
  }
}

main();
