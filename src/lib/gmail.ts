import { google } from "googleapis";
import { prisma } from "./prisma";

export async function getGmailClient(userId: string) {
  // 1. Fetch user's Google account from Prisma
  const account = await prisma.account.findFirst({
    where: {
      userId: userId,
      provider: "google",
    },
  });

  if (!account || !account.access_token) {
    throw new Error("No Google account linked or missing access token");
  }

  // 2. Setup OAuth2 Client
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
  });

  // Handle token refresh logic automatically if needed
  oauth2Client.on("tokens", async (tokens) => {
    if (tokens.refresh_token || tokens.access_token) {
      await prisma.account.update({
        where: {
          provider_providerAccountId: {
            provider: "google",
            providerAccountId: account.providerAccountId,
          },
        },
        data: {
          access_token: tokens.access_token ?? account.access_token,
          refresh_token: tokens.refresh_token ?? account.refresh_token,
          expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : account.expires_at,
        },
      });
    }
  });

  // 3. Return the authenticated Gmail service
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });
  return gmail;
}

function extractPlainText(payload: any): string {
  if (!payload) return "";
  const decode = (data: string) => Buffer.from(data, "base64").toString("utf-8");
  
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

export async function fetchRecentEmails(userId: string, lastSyncedAt?: Date | null, maxResults = 50) {
  const gmail = await getGmailClient(userId);

  // Highly targeted Gmail search query to filter out marketing garbage
  let query = 'in:inbox (deadline OR schedule OR scheduled OR meeting OR appointment OR calendar OR invite OR due OR "mark your calendar" OR date) -from:nse_alerts@nse.co.in -from:settlement.alerts@razorpay.com';

  if (lastSyncedAt) {
    // Append 'after:timestamp' to fetch only new emails since the last sync
    const epochSeconds = Math.floor(lastSyncedAt.getTime() / 1000);
    query += ` after:${epochSeconds}`;
  }

  const response = await gmail.users.messages.list({
    userId: "me",
    maxResults,
    q: query, 
  });

  const messages = response.data.messages || [];
  
  const detailedMessages = await Promise.all(
    messages.map(async (msg) => {
      if (!msg.id) return null;
      const details = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
        format: "full",
      });
      
      const payload = details.data.payload;
      const headers = payload?.headers;
      const subject = headers?.find(h => h.name === "Subject")?.value || "No Subject";
      const from = headers?.find(h => h.name === "From")?.value || "Unknown";
      const dateStr = headers?.find(h => h.name === "Date")?.value;
      const date = dateStr ? new Date(dateStr) : new Date();

      let bodyText = extractPlainText(payload);
      
      // Fallback to snippet if body extraction fails
      if (!bodyText || bodyText.trim() === "") {
        bodyText = details.data.snippet || "";
      }

      // Truncate to prevent token limit issues
      bodyText = bodyText.substring(0, 3000);

      return {
        id: msg.id,
        snippet: details.data.snippet,
        bodyText,
        subject,
        from,
        date
      };
    })
  );

  return detailedMessages.filter((msg): msg is NonNullable<typeof msg> => msg !== null);
}
