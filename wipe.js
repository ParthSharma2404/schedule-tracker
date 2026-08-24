const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

async function wipe() {
  const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
  const prisma = new PrismaClient({ adapter });

  try {
    await prisma.event.deleteMany({});
    await prisma.email.deleteMany({});
    console.log("Wiped all emails and events for a fresh sync!");
  } catch (e) {
    console.error(e);
  }
}
wipe();
