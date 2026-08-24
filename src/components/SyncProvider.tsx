"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface SyncContextType {
  isSyncing: boolean;
  totalToProcess: number;
  processedCount: number;
  startSync: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: ReactNode }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [totalToProcess, setTotalToProcess] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);

  const startSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setTotalToProcess(0);
    setProcessedCount(0);

    try {
      // 1. Fetch new emails (Phase 1)
      const fetchRes = await fetch("/api/emails/sync", { method: "POST" });
      const fetchData = await fetchRes.json();
      
      if (!fetchRes.ok) throw new Error(fetchData.error);
      
      let remaining = fetchData.unprocessedCount || 0;
      let total = remaining;
      
      setTotalToProcess(total);
      
      if (remaining === 0) {
        setIsSyncing(false);
        return; // Nothing to process
      }

      // 2. Poll the processing route in chunks until done (Phase 2)
      let consecutiveErrors = 0;
      let lastRemaining = remaining;

      while (remaining > 0) {
        try {
          const processRes = await fetch("/api/emails/process", { method: "POST" });
          
          if (!processRes.ok) {
            throw new Error(`HTTP Error: ${processRes.status}`);
          }

          const processData = await processRes.json();
          
          if (processData.remaining === lastRemaining && processData.processed === 0) {
             // No progress made this chunk, but backend returned success
             // (Should not happen normally, but safe guard)
          }
          lastRemaining = processData.remaining;
          remaining = processData.remaining;
          
          // If the backend says 0 remaining but we haven't updated total, cap it
          setProcessedCount(Math.min(total, total - remaining));
          consecutiveErrors = 0; // reset on success

          // Optional: slight delay between chunks to be nice to the server
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (err) {
          console.error("Chunk processing error:", err);
          consecutiveErrors++;
          if (consecutiveErrors >= 3) {
             console.error("Aborting sync due to multiple chunk failures.");
             break; // Gracefully stop sync, showing what was processed so far
          }
          // Wait longer before retrying to give server time to recover
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
      
      // Finished all chunks (or aborted gracefully)!
      // Refresh page data if on calendar/dashboard so new events show up
      setTimeout(() => window.location.reload(), 1000);

    } catch (e) {
      console.error("Sync failed:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <SyncContext.Provider value={{ isSyncing, totalToProcess, processedCount, startSync }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error("useSync must be used within a SyncProvider");
  }
  return context;
}
