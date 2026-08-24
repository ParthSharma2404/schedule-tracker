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
    // If it's a fresh sync (lastSyncedAt is null), fetch up to 20 emails to restore history
    const maxFetch = user?.lastSyncedAt ? 20 : 20;
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

    // 3. Count how many emails are still unprocessed
    const unprocessedCount = await prisma.email.count({
      where: {
        userId: userId,
        isProcessed: false
      }
    });

    // 4. Update user's lastSyncedAt to now
    await prisma.user.update({
      where: { id: userId },
      data: { lastSyncedAt: new Date() }
    });

    return NextResponse.json({ 
      success: true, 
      newEmailsFetched: newEmailsProcessed,
      unprocessedCount: unprocessedCount,
      message: `Fetched ${newEmailsProcessed} new emails. ${unprocessedCount} emails waiting for AI scan.` 
    });

  } catch (error: any) {
    console.error("Sync error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch emails" }, { status: 500 });
  }
}
