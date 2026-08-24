import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  console.log('Connecting to:', process.env.DATABASE_URL?.substring(0, 30) + '...');
  const result = await pool.query('SELECT NOW() as time');
  console.log('SUCCESS! DB connected. Server time:', result.rows[0].time);
  
  const tables = await pool.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
  console.log('Tables:', tables.rows.map(r => r.tablename));
  
  const users = await pool.query('SELECT id, email FROM "User" LIMIT 5');
  console.log('Users:', users.rows);
  
  const events = await pool.query('SELECT COUNT(*) as count FROM "Event"');
  console.log('Event count:', events.rows[0].count);
} catch (err) {
  console.error('CONNECTION FAILED:', err.message);
} finally {
  await pool.end();
  process.exit(0);
}
