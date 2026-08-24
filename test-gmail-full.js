require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const { google } = require('googleapis');

function extractPlainText(payload) {
  if (!payload) return "";
  
  const decode = (data) => Buffer.from(data, "base64").toString("utf-8");

  if ((payload.mimeType === "text/plain" || payload.mimeType === "text/html") && payload.body && payload.body.data) {
    let text = decode(payload.body.data);
    if (payload.mimeType === "text/html") {
      text = text.replace(/<[^>]*>?/gm, ' ');
    }
    return text;
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body && part.body.data) {
        return decode(part.body.data);
      }
    }
    for (const part of payload.parts) {
      if (part.mimeType === "text/html" && part.body && part.body.data) {
        return decode(part.body.data).replace(/<[^>]*>?/gm, ' ');
      }
    }
    for (const part of payload.parts) {
       const res = extractPlainText(part);
       if (res) return res;
    }
  }
  return "";
}

async function test() {
  const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
  const prisma = new PrismaClient({ adapter });

  try {
    const account = await prisma.account.findFirst({
      where: { provider: 'google' }
    });

    if (!account) return console.log("No account");

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: account.access_token,
      refresh_token: account.refresh_token,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 1,
      q: 'in:inbox (deadline OR schedule OR scheduled OR meeting OR appointment OR calendar OR invite OR due OR "mark your calendar" OR date) -from:nse_alerts@nse.co.in -from:settlement.alerts@razorpay.com'
    });

    const msgId = response.data.messages[0].id;
    const details = await gmail.users.messages.get({
      userId: "me",
      id: msgId,
      format: "full",
    });

    const payload = details.data.payload;
    let bodyText = extractPlainText(payload);
    
    if (!bodyText || bodyText.trim() === "") {
      bodyText = details.data.snippet || "";
    }

    console.log("----- EXTRACTED BODY TEXT -----");
    console.log(bodyText.substring(0, 1500));
    console.log("-------------------------------");
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
