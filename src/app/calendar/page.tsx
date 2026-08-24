import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import Calendar from "@/components/Calendar";

export default async function CalendarPage() {
  const session = await getServerSession(authOptions);
  let rawEvents: any[] = [];

  if (session?.user?.id) {
    rawEvents = await prisma.event.findMany({
      where: { userId: session.user.id },
      include: {
        sourceEmail: {
          select: { messageId: true, subject: true, sender: true }
        }
      },
      orderBy: { startTime: 'asc' }
    });
  }

  // Format for the Calendar component
  const events = rawEvents.map((e: any) => ({
    id: e.id,
    title: e.title,
    description: e.description || "",
    type: e.type,
    date: e.startTime.getDate(),
    month: e.startTime.getMonth(),
    year: e.startTime.getFullYear(),
    startTime: e.startTime.toISOString(),
    endTime: e.endTime?.toISOString() || null,
    confidence: e.confidence,
    gmailMessageId: e.sourceEmail?.messageId || null,
    sourceSubject: e.sourceEmail?.subject || null,
    sourceSender: e.sourceEmail?.sender || null,
  }));

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, margin: 0, letterSpacing: '-0.02em' }}>Calendar</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>All extracted dates and schedules</p>
        </div>
      </div>
      
      <div style={{ flex: 1, minHeight: 0 }}>
        {!session?.user ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            Please sign in to view your smart calendar.
          </div>
        ) : (
          <Calendar events={events} />
        )}
      </div>
    </div>
  );
}
