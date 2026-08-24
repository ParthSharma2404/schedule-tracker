import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { fetchRecentEmails } from "@/lib/gmail";
import SyncButton from "@/components/SyncButton";

export default async function EmailsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Authentication Required</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Please sign in with Google to view and sync your emails.</p>
      </div>
    );
  }

  let emails = [];
  let error = null;

  try {
    if (session.user.id) {
      // Pass null for lastSyncedAt so it doesn't break, and 15 for maxResults
      emails = await fetchRecentEmails(session.user.id, null, 15);
    }
  } catch (err: any) {
    console.error("Error fetching emails:", err);
    error = err.message || "Failed to fetch emails from Google";
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Email Sources</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Recent emails scanned by the AI engine</p>
        </div>
        <SyncButton />
      </div>

      {error ? (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-deadline)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          {error}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {emails.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No emails found or no Google account connected with Gmail access.</p>
          ) : (
            emails.map((email: any) => (
              <div key={email.id} style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 500, color: 'var(--text-primary)' }}>{email.subject}</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {email.date.toLocaleDateString()}
                  </span>
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>From: {email.from}</div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
                  {email.snippet}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
