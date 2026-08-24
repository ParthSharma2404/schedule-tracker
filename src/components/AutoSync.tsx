"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // Auto-sync every 5 minutes

export default function AutoSync() {
  const { data: session } = useSession();
  const hasSynced = useRef(false);

  useEffect(() => {
    if (!session?.user) return;

    const runSync = async () => {
      try {
        console.log("[AutoSync] Running background sync...");
        const res = await fetch("/api/emails/sync", { method: "POST" });
        const data = await res.json();
        if (res.ok) {
          console.log("[AutoSync]", data.message);
        } else {
          console.warn("[AutoSync] Error:", data.error);
        }
      } catch (err) {
        console.warn("[AutoSync] Network error:", err);
      }
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
