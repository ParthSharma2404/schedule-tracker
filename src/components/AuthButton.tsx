"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Loading...</div>;
  }

  if (session) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {session.user?.image && (
            <img 
              src={session.user.image} 
              alt="Avatar" 
              style={{ width: "24px", height: "24px", borderRadius: "50%" }} 
            />
          )}
          <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            {session.user?.name}
          </span>
        </div>
        <button 
          onClick={() => signOut()}
          style={{ 
            fontSize: "0.8125rem", 
            color: "var(--text-muted)", 
            background: "var(--bg-surface-active)",
            padding: "0.25rem 0.5rem",
            borderRadius: "4px",
            border: "1px solid var(--border-color)"
          }}
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={() => signIn("google")}
      style={{ 
        fontSize: "0.8125rem", 
        color: "black", 
        background: "white",
        padding: "0.4rem 0.75rem",
        borderRadius: "6px",
        fontWeight: 500,
      }}
    >
      Sign in with Google
    </button>
  );
}
