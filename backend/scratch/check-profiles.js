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
    const res = await pool.query(
      `SELECT p.id, COALESCE(p.email, u.email) AS email
       FROM profiles p
       LEFT JOIN auth.users u ON u.id::text = p.id::text
       LIMIT 5`
    );
    console.log('Results:', JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

main();
