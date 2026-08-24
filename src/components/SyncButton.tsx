"use client";

import { useState } from "react";

export default function SyncButton() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setResult(null);
    try {
      const res = await fetch("/api/emails/sync", { method: "POST" });
      const data = await res.json();
      
      if (res.ok) {
        setResult(data.message);
        // In a real app we'd refresh the page/cache here
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setResult("Error: " + data.error);
      }
    } catch (e: any) {
      setResult("Error: " + e.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
      <button 
        onClick={handleSync}
        disabled={syncing}
        style={{
          backgroundColor: 'var(--text-primary)',
          color: 'var(--bg-base)',
          padding: '0.5rem 1rem',
          borderRadius: '6px',
          fontWeight: 500,
          fontSize: '0.875rem',
          opacity: syncing ? 0.7 : 1,
          cursor: syncing ? 'not-allowed' : 'pointer'
        }}
      >
        {syncing ? "Syncing..." : "Force Sync Now"}
      </button>
      {result && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{result}</span>}
    </div>
  );
}
