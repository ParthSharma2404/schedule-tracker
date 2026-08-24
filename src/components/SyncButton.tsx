"use client";

import { useState } from "react";
import { useSync } from "./SyncProvider";

export default function SyncButton() {
  const { isSyncing: syncing, startSync } = useSync();

  const handleSync = async () => {
    await startSync();
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
