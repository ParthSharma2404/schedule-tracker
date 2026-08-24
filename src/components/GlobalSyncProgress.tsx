"use client";

import React from "react";
import { useSync } from "./SyncProvider";
import { useSession } from "next-auth/react";

export default function GlobalSyncProgress() {
  const { isSyncing, totalToProcess, processedCount } = useSync();
  const { data: session } = useSession();

  if (!session?.user || !isSyncing) return null;

  const isFetching = totalToProcess === 0;
  const progress = isFetching ? 0 : Math.min(100, Math.max(0, (processedCount / totalToProcess) * 100));

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      backgroundColor: '#1e1e24',
      border: '1px solid #333',
      borderRadius: '12px',
      padding: '16px 20px',
      width: '320px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      color: '#fff',
      fontFamily: 'inherit'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Spinner icon */}
          <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 2s linear infinite' }}>
            <line x1="12" y1="2" x2="12" y2="6"></line>
            <line x1="12" y1="18" x2="12" y2="22"></line>
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
            <line x1="2" y1="12" x2="6" y2="12"></line>
            <line x1="18" y1="12" x2="22" y2="12"></line>
            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
          </svg>
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
            {isFetching ? "Connecting to Gmail..." : "Scanning Emails with AI"}
          </span>
        </div>
        {!isFetching && (
          <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>
            {processedCount} / {totalToProcess}
          </span>
        )}
      </div>
      
      {/* Progress Bar Track */}
      <div style={{ width: '100%', height: '6px', backgroundColor: '#333', borderRadius: '4px', overflow: 'hidden' }}>
        {/* Progress Fill */}
        <div style={{ 
          height: '100%', 
          backgroundColor: isFetching ? 'transparent' : '#3b82f6', 
          width: isFetching ? '100%' : `${progress}%`,
          transition: 'width 0.4s ease-out'
        }} />
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .animate-spin { animation: spin 2s linear infinite; }
      `}} />
    </div>
  );
}
