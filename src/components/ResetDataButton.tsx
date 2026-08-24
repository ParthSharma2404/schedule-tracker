"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResetDataButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const router = useRouter();

  const handleReset = async () => {
    if (!confirm("Are you sure? This will delete all extracted calendar events and force a full re-scan on your next sync. This cannot be undone.")) {
      return;
    }

    setIsLoading(true);
    setStatus("idle");

    try {
      const res = await fetch("/api/user/reset", {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to reset data");
      
      setStatus("success");
      // Force refresh the page to update state
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (err) {
      console.error(err);
      setStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleReset}
        disabled={isLoading}
        style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          color: 'var(--color-deadline)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          padding: '0.75rem 1.5rem',
          borderRadius: '8px',
          fontWeight: 600,
          cursor: isLoading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          opacity: isLoading ? 0.7 : 1
        }}
        onMouseOver={(e) => {
          if (!isLoading) e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
        }}
        onMouseOut={(e) => {
          if (!isLoading) e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
        }}
      >
        {isLoading ? "Wiping Data..." : "Wipe Events & Reset Sync"}
      </button>
      
      {status === "success" && (
        <p style={{ color: "var(--color-meeting)", marginTop: "1rem", fontSize: "0.875rem" }}>
          Success! Your calendar has been cleared. Go to the Overview tab and hit Sync.
        </p>
      )}
      
      {status === "error" && (
        <p style={{ color: "var(--color-deadline)", marginTop: "1rem", fontSize: "0.875rem" }}>
          Failed to wipe data. Please try again.
        </p>
      )}
    </div>
  );
}
