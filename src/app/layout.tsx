import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import AuthButton from "@/components/AuthButton";
import AutoSync from "@/components/AutoSync";
import Providers from "@/components/Providers";
import "./globals.css";
import styles from "./layout.module.css";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export const metadata: Metadata = {
  title: "Tracker | Intelligence",
  description: "Industry-grade email tracking and date extraction.",
  manifest: "/manifest.json",
  themeColor: "#0a0a0c",
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-512x512.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <Providers>
          <AutoSync />
          
          {!session?.user ? (
            /* Full Screen Landing Page Layout */
            <main style={{ minHeight: '100vh', width: '100vw', backgroundColor: '#0a0a0c' }}>
              {children}
            </main>
          ) : (
            /* Authenticated Dashboard Layout */
            <div className={styles.layoutContainer}>
              {/* Sidebar */}
              <Sidebar />

              {/* Main Content Area */}
              <div className={styles.mainWrapper}>
                {/* Header */}
                <header className={styles.header}>
                  <div className={styles.headerTitle}>Overview</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                    <AuthButton />
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{cursor: 'pointer'}}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                  </div>
                </header>

                {/* Content Scrollable Area */}
                <main className={styles.content}>
                  {children}
                </main>
              </div>
            </div>
          )}
          
        </Providers>
      </body>
    </html>
  );
}
