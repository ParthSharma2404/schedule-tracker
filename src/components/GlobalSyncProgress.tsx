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
      bottom: '32px',
      right: '32px',
      backgroundColor: 'rgba(23, 23, 23, 0.7)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '16px',
      padding: '20px 24px',
      width: '340px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.5), 0 0 20px rgba(59, 130, 246, 0.15)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      color: '#fff',
      animation: 'slideInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
          {/* Radar Sweep Animation Container */}
          <div style={{ 
            position: 'relative', 
            width: '24px', 
            height: '24px', 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* Pulsing glow ring */}
            <div style={{
              position: 'absolute',
              inset: '-4px',
              borderRadius: '50%',
              backgroundColor: isFetching ? 'rgba(161, 161, 170, 0.2)' : 'rgba(59, 130, 246, 0.3)',
              animation: 'pulseGlow 1.5s ease-in-out infinite alternate'
            }} />
            
            {/* Spinning radar core */}
            <div style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: isFetching ? '#a1a1aa' : 'conic-gradient(from 0deg, transparent 0%, transparent 60%, #3b82f6 100%)',
              animation: 'spin 1.2s linear infinite',
              boxShadow: isFetching ? 'none' : '0 0 8px #3b82f6'
            }} />
          </div>

          <span style={{ fontSize: '0.95rem', fontWeight: 500, letterSpacing: '-0.01em' }}>
            {isFetching ? "Connecting to Gmail..." : "AI Engine Scanning..."}
          </span>
        </div>
        {!isFetching && (
          <span style={{ fontSize: '0.85rem', color: '#a1a1aa', fontWeight: 500 }}>
            {processedCount} / {totalToProcess}
          </span>
        )}
      </div>
      
      {/* Progress Bar Track */}
      <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
        {/* Progress Fill */}
        <div style={{ 
          height: '100%', 
          background: isFetching ? 'transparent' : 'linear-gradient(90deg, #3b82f6, #60a5fa)',
          width: isFetching ? '100%' : `${progress}%`,
          transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 0 10px #3b82f6'
        }} />
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes pulseGlow {
          0% { transform: scale(0.8); opacity: 0.5; }
          100% { transform: scale(1.2); opacity: 1; }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}} />
    </div>
  );
}
