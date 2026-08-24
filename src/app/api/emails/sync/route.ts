import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { fetchRecentEmails } from "@/lib/gmail";
import { analyzeEmailForEvents } from "@/lib/ai";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastSyncedAt: true }
    });

    // 1. Fetch recent emails from Gmail API incrementally
    // If it's a fresh sync (lastSyncedAt is null), fetch up to 100 emails to restore history
    const maxFetch = user?.lastSyncedAt ? 50 : 100;
    const recentEmails = await fetchRecentEmails(userId, user?.lastSyncedAt, maxFetch);

    let newEmailsProcessed = 0;
    let newEventsFound = 0;

    // 2. Process new emails from Gmail
    for (const email of recentEmails) {
      const existingEmail = await prisma.email.findUnique({
        where: { messageId: email.id },
      });

      if (!existingEmail) {
        await prisma.email.create({
          data: {
            messageId: email.id,
            subject: email.subject,
            sender: email.from,
            bodySnippet: email.bodyText, // Save full body for AI to scan
            receivedAt: email.date,
            userId: userId,
            hasAttachments: email.hasAttachments,
          }
        });
        newEmailsProcessed++;
      }
    }

    console.log(`[SYNC] Fetched ${recentEmails.length} emails from Gmail, ${newEmailsProcessed} new.`);

    // 3. Re-process ALL emails that have 0 events (handles broken AI model recovery)
    const unprocessedEmails = await prisma.email.findMany({
      where: {
        userId: userId,
        events: { none: {} }
      },
      orderBy: { receivedAt: 'desc' }
    });

    console.log(`[SYNC] Found ${unprocessedEmails.length} emails with 0 events — processing with AI...`);

    for (const dbEmail of unprocessedEmails) {
      console.log(`[SYNC] Processing: "${dbEmail.subject}"`);
      
      const extracted = await analyzeEmailForEvents(
        dbEmail.subject,
        dbEmail.sender,
        dbEmail.bodySnippet || "",
        dbEmail.receivedAt
      );

      console.log(`[SYNC] AI result:`, JSON.stringify(extracted));

      if (extracted && extracted.isEvent && extracted.title && extracted.startTime) {
        await prisma.event.create({
          data: {
            title: extracted.title,
            description: extracted.description,
            type: extracted.type || "schedule",
            startTime: new Date(extracted.startTime),
            endTime: extracted.endTime ? new Date(extracted.endTime) : null,
            confidence: extracted.confidence || 1.0,
            userId: userId,
            sourceEmailId: dbEmail.id
          }
        });
        newEventsFound++;
        console.log(`[SYNC] ✅ Event saved: "${extracted.title}" on ${extracted.startTime}`);
      }
    }

    // 4. Update user's lastSyncedAt to now
    await prisma.user.update({
      where: { id: userId },
      data: { lastSyncedAt: new Date() }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Processed ${newEmailsProcessed} new emails. Found ${newEventsFound} new events.` 
    });

  } catch (error: any) {
    console.error("Sync error:", error);
    return NextResponse.json({ error: error.message || "Failed to sync emails" }, { status: 500 });
  }
}
