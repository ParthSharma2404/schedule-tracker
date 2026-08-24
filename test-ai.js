require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function testAI() {
  const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
  const prisma = new PrismaClient({ adapter });

  try {
    const emails = await prisma.email.findMany({
      take: 2,
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Found ${emails.length} emails in DB.`);

    for (const email of emails) {
      console.log(`\nTesting email: ${email.subject}`);
      
      const prompt = `
      Analyze this email and extract any upcoming events, deadlines, meetings, or schedules.
      Return the output strictly as a JSON array of objects with this format:
      [
        {
          "title": "string (short, clear name of the event)",
          "startTime": "ISO 8601 date string",
          "type": "deadline" | "meeting" | "schedule",
          "confidence": number (0-1)
        }
      ]
      If there are no clear events, return an empty array [].
      Do not include markdown blocks or any other text.

      Email Subject: ${email.subject}
      Email Snippet: ${email.snippet}
      `;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
        });

        const text = typeof response.text === 'function' ? response.text() : response.text;
        console.log("Raw AI Output:", text);
      } catch (err) {
        console.error("AI Error:", err);
      }
    }
  } catch (e) {
    console.error("DB Error:", e);
  }
}
testAI();
