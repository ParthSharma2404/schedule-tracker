import 'dotenv/config';

async function debugAI() {
  const { prisma } = await import("./src/lib/prisma.ts");
  const { analyzeEmailForEvents } = await import("./src/lib/ai.ts");
  const emails = await prisma.email.findMany({
    take: 10,
    orderBy: { receivedAt: 'desc' }
  });

  console.log(`Found ${emails.length} emails to test...`);

  for (const email of emails) {
    console.log(`\n--- Testing: ${email.subject} ---`);
    try {
      const result = await analyzeEmailForEvents(
        email.subject,
        email.sender,
        email.bodySnippet || "",
        email.receivedAt
      );
      
      if (result && result.isEvent) {
        console.log(`✅ EXTRACTED EVENT: ${result.title} on ${result.startTime}`);
      } else if (result && !result.isEvent) {
        console.log(`❌ MARKED AS NOT EVENT.`);
      } else {
        console.log(`⚠️ AI RETURNED NULL (parsing failure?)`);
      }
    } catch (e) {
      console.error(`Error:`, e);
    }
  }
}

debugAI().catch(console.error).finally(() => prisma.$disconnect());
