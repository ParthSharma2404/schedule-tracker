import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import LandingPage from "@/components/LandingPage";
import styles from "./page.module.css";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return <LandingPage />;
  }

  const userId = session.user.id;
  const now = new Date();
  
  // Start of today
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const upcomingDeadlines = await prisma.event.count({
    where: { userId, type: 'deadline', startTime: { gte: now } }
  });

  const upcomingMeetings = await prisma.event.count({
    where: { userId, type: 'meeting', startTime: { gte: now } }
  });

  const emailsProcessedToday = await prisma.email.count({
    where: { userId, createdAt: { gte: startOfToday } }
  });

  // End of today
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const todayEvents = await prisma.event.findMany({
    where: { 
      userId, 
      startTime: { gte: startOfToday, lt: endOfToday }
    },
    orderBy: { startTime: 'asc' }
  });

  return (
    <div className={styles.container}>
      <h1 className={styles.greeting}>
        Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {session.user.name?.split(' ')[0] || ''}.
      </h1>
      
      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Upcoming Deadlines</div>
          <div className={styles.cardValue}>{upcomingDeadlines}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Scheduled Meetings</div>
          <div className={styles.cardValue}>{upcomingMeetings}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Emails Processed Today</div>
          <div className={styles.cardValue}>{emailsProcessedToday}</div>
        </div>
      </div>

      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>High Priority Today</h3>
        <Link href="/calendar" className={styles.viewAll}>View calendar</Link>
      </div>
      
      <div className={styles.upcomingList}>
        {todayEvents.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Nothing scheduled for today. You are all caught up.</div>
        ) : (
          todayEvents.map((evt: any) => (
            <div key={evt.id} className={styles.eventItem}>
              <div className={styles.eventIndicator} style={{
                backgroundColor: evt.type === 'deadline' ? 'var(--color-deadline)' : 
                                evt.type === 'meeting' ? 'var(--color-meeting)' : 'var(--color-schedule)'
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>{evt.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{evt.type.charAt(0).toUpperCase() + evt.type.slice(1)}</div>
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {evt.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
