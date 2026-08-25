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

  const failedEmails = await prisma.email.findMany({
    where: { userId, processingError: { not: null } },
    orderBy: { receivedAt: 'desc' },
    take: 5
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

      <div className={styles.dashboardContent}>
        
        {/* Left Column: Timeline */}
        <div>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>High Priority Today</h3>
            <Link href="/calendar" className={styles.viewAll}>View calendar</Link>
          </div>
          
          <div className={styles.timelineContainer}>
            {todayEvents.length > 0 && <div className={styles.timelineTrack} />}
            
            {todayEvents.length === 0 ? (
              <div className={styles.emptyState}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '1rem', opacity: 0.5 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Schedule Clear</div>
                <div style={{ fontSize: '0.875rem' }}>You are all caught up for today.</div>
              </div>
            ) : (
              todayEvents.map((evt: any, idx: number) => {
                const dotClass = evt.type === 'deadline' ? styles.dotDeadline : 
                                evt.type === 'meeting' ? styles.dotMeeting : styles.dotSchedule;
                return (
                  <div key={evt.id} className={styles.timelineEvent} style={{ animationDelay: `${idx * 100}ms` }}>
                    <div className={`${styles.timelineDot} ${dotClass}`} />
                    <div className={styles.eventInfo}>
                      <div className={styles.eventTitle}>{evt.title}</div>
                      <div className={styles.eventContext}>{evt.type.charAt(0).toUpperCase() + evt.type.slice(1)}</div>
                    </div>
                    <div className={styles.eventTime}>
                      {evt.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Column: Insights & Actions */}
        <div>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Insights & Actions</h3>
          </div>
          
          <div className={styles.sidebarList}>
            {failedEmails.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', padding: '1.25rem', backgroundColor: 'var(--glass-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                No actions required. System is operating normally.
              </div>
            ) : (
              failedEmails.map((email: any, idx: number) => (
                <div key={email.id} className={styles.sidebarCard} style={{ animationDelay: `${idx * 100}ms` }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {email.subject}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>From: {email.sender}</div>
                  <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '4px' }}>Error: {email.processingError}</div>
                  <Link href={`/calendar/add?emailId=${email.id}`} className={styles.actionBtn}>
                    Resolve Manually
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
