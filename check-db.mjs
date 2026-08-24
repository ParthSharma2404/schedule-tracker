import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany();
  console.log("Users:", users.map(u => ({ id: u.id, email: u.email, lastSyncedAt: u.lastSyncedAt })));

  const emails = await prisma.email.findMany();
  console.log(`Total Emails: ${emails.length}`);
  
  const events = await prisma.event.findMany();
  console.log(`Total Events: ${events.length}`);

  for (const user of users) {
    const userEmails = await prisma.email.count({ where: { userId: user.id } });
    const userEvents = await prisma.event.count({ where: { userId: user.id } });
    console.log(`User ${user.email}: ${userEmails} emails, ${userEvents} events`);
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
