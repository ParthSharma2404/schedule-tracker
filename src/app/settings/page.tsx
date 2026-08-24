import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import ResetDataButton from "@/components/ResetDataButton";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Authentication Required</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Please sign in to access settings.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Account Settings</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Manage your data and connected integrations</p>
      </div>

      <div style={{ 
        backgroundColor: 'var(--bg-surface)', 
        border: '1px solid var(--border-color)', 
        borderRadius: '12px', 
        padding: '2rem',
        maxWidth: '800px'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Danger Zone</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          If the AI missed dates or you just want a completely fresh start, you can wipe your extracted events. 
          This will delete all events from your calendar and force a deep scan of your recent emails on the next sync.
        </p>
        
        <ResetDataButton />
      </div>
    </div>
  );
}
