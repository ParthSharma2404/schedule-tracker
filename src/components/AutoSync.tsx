"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useSync } from "./SyncProvider";

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // Auto-sync every 5 minutes

export default function AutoSync() {
  const { data: session } = useSession();
  const { startSync } = useSync();
  const hasSynced = useRef(false);

  useEffect(() => {
    if (!session?.user) return;

    const runSync = async () => {
      console.log("[AutoSync] Triggering background sync via context...");
      await startSync();
    };

    // Run once on first load (only if not already synced this session)
    if (!hasSynced.current) {
      hasSynced.current = true;
      runSync();
    }

    // Then run on interval
    const interval = setInterval(runSync, SYNC_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [session]);

  return null; // Invisible component
}
