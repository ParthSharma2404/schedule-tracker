import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new pg.Pool({ connectionString: process.env.DIRECT_DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function reset() {
  console.log('Deleting all extracted events and emails...');
  await prisma.event.deleteMany({});
  await prisma.email.deleteMany({});
  
  console.log('Resetting sync timestamps...');
  await prisma.user.updateMany({
    data: { lastSyncedAt: null }
  });
  
  console.log('Database reset complete. The next sync will pull all data freshly.');
  process.exit(0);
}

reset().catch(e => {
  console.error(e);
  process.exit(1);
});
