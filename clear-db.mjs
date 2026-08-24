import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;
const client = new Client({
  connectionString: process.env.DIRECT_DATABASE_URL,
});

async function main() {
  await client.connect();
  console.log("Connected to DB.");

  await client.query('DELETE FROM "Event"');
  console.log("Cleared Events.");

  await client.query('DELETE FROM "Email"');
  console.log("Cleared Emails.");

  await client.query('UPDATE "User" SET "lastSyncedAt" = NULL');
  console.log("Reset User sync time.");

  await client.end();
  console.log("Done.");
}

main().catch(console.error);
