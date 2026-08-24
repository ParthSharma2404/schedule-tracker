import { NextResponse } from "next/server";
import { fetchRecentEmails } from "@/lib/gmail";
import { analyzeEmailForEvents } from "@/lib/ai";
import { prisma } from "@/lib/prisma";

export const maxDuration = 300; // Allow Vercel to run this for up to 5 minutes

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Get all users who have a linked Google account
    const users = await prisma.user.findMany({
      where: { accounts: { some: { provider: 'google' } } },
      select: { id: true, lastSyncedAt: true }
    });

    let totalEmailsProcessed = 0;
    let totalEventsFound = 0;

    for (const user of users) {
      try {
        const recentEmails = await fetchRecentEmails(user.id, user.lastSyncedAt, 50);
        
        for (const email of recentEmails) {
          const existingEmail = await prisma.email.findUnique({
            where: { messageId: email.id }
          });

          if (!existingEmail) {
            const savedEmail = await prisma.email.create({
              data: {
                messageId: email.id,
                subject: email.subject,
                sender: email.from,
                bodySnippet: email.snippet,
                receivedAt: email.date,
                userId: user.id,
              }
            });
            
            totalEmailsProcessed++;

            const extracted = await analyzeEmailForEvents(
              email.subject, 
              email.from, 
              email.bodyText || email.snippet || "", 
              email.date
            );

            if (extracted && extracted.isEvent && extracted.title && extracted.startTime) {
              await prisma.event.create({
                data: {
                  title: extracted.title,
                  description: extracted.description,
                  type: extracted.type || "schedule",
                  startTime: new Date(extracted.startTime),
                  endTime: extracted.endTime ? new Date(extracted.endTime) : null,
                  confidence: extracted.confidence || 1.0,
                  userId: user.id,
                  sourceEmailId: savedEmail.id
                }
              });
              totalEventsFound++;
            }
          }
        }

        // Update user's lastSyncedAt
        await prisma.user.update({
          where: { id: user.id },
          data: { lastSyncedAt: new Date() }
        });
      } catch (userErr) {
        console.error(`Cron sync failed for user ${user.id}:`, userErr);
        // Continue to next user even if this one fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Cron sync completed. Processed ${totalEmailsProcessed} new emails across ${users.length} users. Found ${totalEventsFound} new events.` 
    });

  } catch (error: any) {
    console.error("Cron sync error:", error);
    return NextResponse.json({ error: error.message || "Failed to sync emails" }, { status: 500 });
  }
}
