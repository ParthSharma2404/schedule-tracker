require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const { google } = require('googleapis');
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function extractPlainText(payload) {
  if (!payload) return "";
  const decode = (data) => Buffer.from(data, "base64").toString("utf-8");
  if ((payload.mimeType === "text/plain" || payload.mimeType === "text/html") && payload.body && payload.body.data) {
    let text = decode(payload.body.data);
    if (payload.mimeType === "text/html") text = text.replace(/<[^>]*>?/gm, ' ');
    return text;
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body && part.body.data) return decode(part.body.data);
    }
    for (const part of payload.parts) {
      if (part.mimeType === "text/html" && part.body && part.body.data) return decode(part.body.data).replace(/<[^>]*>?/gm, ' ');
    }
    for (const part of payload.parts) {
       const res = extractPlainText(part);
       if (res) return res;
    }
  }
  return "";
}

async function debugSync() {
  const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
  const prisma = new PrismaClient({ adapter });

  try {
    const account = await prisma.account.findFirst({ where: { provider: 'google' } });
    if (!account) return console.log("No account");

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: account.access_token, refresh_token: account.refresh_token });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const query = 'in:inbox (deadline OR schedule OR scheduled OR meeting OR appointment OR calendar OR invite OR due OR "mark your calendar" OR date) -from:nse_alerts@nse.co.in -from:settlement.alerts@razorpay.com';
    const response = await gmail.users.messages.list({ userId: "me", maxResults: 3, q: query });

    const messages = response.data.messages || [];
    console.log(`Found ${messages.length} emails in Gmail.`);

    for (const msg of messages) {
      const details = await gmail.users.messages.get({ userId: "me", id: msg.id, format: "full" });
      const payload = details.data.payload;
      const headers = payload?.headers;
      const subject = headers?.find(h => h.name === "Subject")?.value || "No Subject";
      
      let bodyText = extractPlainText(payload);
      if (!bodyText || bodyText.trim() === "") bodyText = details.data.snippet || "";
      bodyText = bodyText.substring(0, 3000);

      console.log(`\n--- Processing: ${subject} ---`);
      
      const prompt = `
You are an intelligent email parsing assistant. Your job is to extract events, meetings, deadlines, and schedules from the provided email metadata and full body text.

Email Metadata:
- Subject: ${subject}
- Received Date: ${new Date().toISOString()}

Email Body Content:
${bodyText}

Instructions:
Determine if this email announces a schedule, deadline, meeting, or selection process. 
Even if the exact date or time is NOT explicitly mentioned in the text (e.g., it might be in an attachment or implied), you MUST still extract it as an event.
If it is clearly just marketing garbage, set "isEvent" to false.
If it is a relevant event/schedule/deadline, set "isEvent" to true, and extract the following:
- "title": A short, clear title for the event (max 50 chars).
- "description": A brief context or description.
- "type": strictly one of: "deadline", "meeting", "schedule".
- "startTime": The start time of the event as an ISO 8601 string. If the email contains a specific date/time, use it. IF NO SPECIFIC DATE/TIME IS MENTIONED, you MUST fallback and use the exact "Received Date" as the startTime.
- "endTime": (Optional) The end time of the event as an ISO 8601 string.
- "confidence": A number from 0.0 to 1.0 indicating your confidence in this extraction.

Return ONLY a valid JSON object matching this schema. Do not include markdown blocks or any other text.
`;

      try {
        const aiResponse = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });
        const resultText = typeof aiResponse.text === 'function' ? aiResponse.text() : aiResponse.text;
        console.log("AI JSON Output:", resultText);
      } catch (err) {
        console.error("AI Error:", err);
      }
    }
  } catch (e) {
    console.error("Error:", e);
  }
}
debugSync();
