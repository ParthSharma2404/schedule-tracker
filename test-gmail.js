const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const { google } = require('googleapis');

async function test() {
  const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
  const prisma = new PrismaClient({ adapter });

  try {
    const account = await prisma.account.findFirst({
      where: { provider: 'google' }
    });

    if (!account) {
      console.log("No google account found");
      return;
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: account.access_token,
      refresh_token: account.refresh_token,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 2,
    });

    console.log("Success! Messages:", response.data.messages);
  } catch (e) {
    console.error("Gmail error:", e);
  }
}
test();
