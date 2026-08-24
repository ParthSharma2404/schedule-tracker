import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
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

    // 1. Find a small chunk of unprocessed emails (e.g., 2)
    const unprocessedEmails = await prisma.email.findMany({
      where: {
        userId: userId,
        isProcessed: false
      },
      orderBy: { receivedAt: 'desc' },
      take: 2 // Process 2 at a time to stay well within Vercel timeout limits
    });

    if (unprocessedEmails.length === 0) {
      return NextResponse.json({ 
        success: true, 
        processed: 0,
        remaining: 0,
        message: "No emails left to process." 
      });
    }

    console.log(`[PROCESS] Processing chunk of ${unprocessedEmails.length} emails...`);
    let newEventsFound = 0;

    // 2. Process chunk
    for (const dbEmail of unprocessedEmails) {
      console.log(`[PROCESS] AI Scanning: "${dbEmail.subject}"`);
      
      const extracted = await analyzeEmailForEvents(
        dbEmail.subject,
        dbEmail.sender,
        dbEmail.bodySnippet || "",
        dbEmail.receivedAt
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
            userId: userId,
            sourceEmailId: dbEmail.id
          }
        });
        newEventsFound++;
        console.log(`[PROCESS] ✅ Event saved: "${extracted.title}"`);
      }

      // Mark this email as processed regardless of whether an event was found
      await prisma.email.update({
        where: { id: dbEmail.id },
        data: { isProcessed: true }
      });
    }

    // 3. Count how many are still left after this chunk
    const remainingCount = await prisma.email.count({
      where: {
        userId: userId,
        isProcessed: false
      }
    });

    return NextResponse.json({ 
      success: true, 
      processed: unprocessedEmails.length,
      newEventsFound: newEventsFound,
      remaining: remainingCount,
      message: `Processed ${unprocessedEmails.length} emails. ${remainingCount} remaining.` 
    });

  } catch (error: any) {
    console.error("Process error:", error);
    return NextResponse.json({ error: error.message || "Failed to process emails" }, { status: 500 });
  }
}
