import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Deleting all events...");
  await prisma.event.deleteMany({});
  
  console.log("Deleting all emails...");
  await prisma.email.deleteMany({});
  
  console.log("Resetting user lastSyncedAt...");
  await prisma.user.updateMany({
    data: { lastSyncedAt: null }
  });
  
  console.log("Database reset complete! Next sync will be fresh.");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
