"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { signIn } from "next-auth/react";
import styles from "./LandingPage.module.css";

const MARQUEE_ITEMS = [
  "Nexus Technologies","Globex Corp","Initech Systems","Stark Industries",
  "Acme Corp","Quantum Labs","Palantir","Horizon AI",
  "Vertex Analytics","Zenith Dynamics","Apex Solutions","Cipher Systems",
];

/* ── Clean Formatted Counter ── */
function StatCounter({ display, label }: { display: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [text, setText] = useState(display.replace(/[\d.]+/, "0"));
  const counted = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Extract the numeric part from the display string (e.g. "50" from "50K+")
    const match = display.match(/([\d.]+)/);
    if (!match) { setText(display); return; }
    const target = parseFloat(match[1]);
    const hasDecimal = match[1].includes(".");
    const decimalPlaces = hasDecimal ? match[1].split(".")[1].length : 0;

    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !counted.current) {
        counted.current = true;
        const startTime = performance.now();
        const duration = 2000;
        const animate = (now: number) => {
          const progress = Math.min((now - startTime) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 4); // easeOutQuart — smoother
          const current = eased * target;
          const formatted = hasDecimal ? current.toFixed(decimalPlaces) : Math.round(current).toString();
          setText(display.replace(match[1], formatted));
          if (progress < 1) requestAnimationFrame(animate);
          else setText(display); // snap to exact final value
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [display]);

  return (
    <div className={styles.statCard}>
      <div ref={ref} className={styles.statValue}>{text}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}

export default function LandingPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const h = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); setIsInstallable(true); };
    window.addEventListener("beforeinstallprompt", h);
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add(styles.revealVisible); });
    }, { threshold: 0.1 });
    document.querySelectorAll(`.${styles.reveal}`).forEach((el) => observerRef.current?.observe(el));
    return () => { window.removeEventListener("beforeinstallprompt", h); observerRef.current?.disconnect(); };
  }, []);

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) { deferredPrompt.prompt(); const { outcome } = await deferredPrompt.userChoice; if (outcome === "accepted") setIsInstallable(false); setDeferredPrompt(null); }
    else alert("To install: look at your browser address bar → click the Install icon or Chrome menu (⋮) → Install Tracker.");
  }, [deferredPrompt]);

  return (
    <div className={styles.landingContainer}>
      {/* ═══ HERO ═══ */}
      <section className={styles.heroSection}>
        <div className={styles.heroBackground} />
        <div className={styles.heroOrb1} /><div className={styles.heroOrb2} /><div className={styles.heroOrb3} />
        <div className={styles.heroContent}>
          <div className={styles.badge}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            Autonomous Schedule Extraction Engine
          </div>
          <h1 className={styles.title}>Transform Your Inbox Into a<br/><span className={styles.gradientText}>Living Command Calendar</span></h1>
          <p className={styles.subtitle}>Tracker automatically extracts exam dates, assignment deadlines, Zoom meetings, and interview calls directly from your Gmail — giving you an instant, always-accurate calendar.</p>
          <div className={styles.ctaGroup}>
            <button onClick={() => signIn("google")} className={styles.primaryCta}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.761H12.545z"/></svg>
              Sign In with Google
            </button>
            <button onClick={handleInstall} className={styles.secondaryCta}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              {isInstallable ? "Install App Widget" : "System App Widget"}
            </button>
          </div>
        </div>
      </section>

      {/* ═══ MARQUEE ═══ */}
      <div className={styles.marqueeSection}>
        <div className={styles.marqueeLabel}>Trusted by 50,000+ professionals and students worldwide</div>
        <div className={styles.marqueeTrack}>
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((n, i) => (<div key={i} className={styles.marqueeItem}><span className={styles.marqueeDot}/>{n}</div>))}
        </div>
      </div>

      {/* ═══ APP PREVIEW ═══ */}
      <section className={`${styles.fullSection} ${styles.previewSection} ${styles.reveal}`}>
        <div className={styles.previewContainer}>
          <div className={styles.windowGlass}>
            <div className={styles.windowBar}>
              <div className={styles.windowDots}><div className={styles.dot} style={{background:"#ef4444"}}/><div className={styles.dot} style={{background:"#eab308"}}/><div className={styles.dot} style={{background:"#22c55e"}}/></div>
              <div className={styles.windowTitle}>Tracker | Desktop Standalone App</div>
              <div style={{width:40}}/>
            </div>
            <div className={styles.previewBody}>
              <div className={styles.previewCard}>
                <div className={styles.previewIcon}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
                <div className={styles.previewCardTitle}>Full Initial Scan</div>
                <div className={styles.previewCardText}>First login analyzes past emails automatically to populate your master schedule in seconds.</div>
              </div>
              <div className={styles.previewCard}>
                <div className={styles.previewIcon} style={{background:"rgba(192,132,252,0.15)",color:"#c084fc"}}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></div>
                <div className={styles.previewCardTitle}>Smart Incremental AI</div>
                <div className={styles.previewCardText}>As new emails land, background sync inspects only incoming messages for zero lag.</div>
              </div>
              <div className={styles.previewCard}>
                <div className={styles.previewIcon} style={{background:"rgba(34,197,94,0.15)",color:"#4ade80"}}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></div>
                <div className={styles.previewCardTitle}>1-Click Gmail Jump</div>
                <div className={styles.previewCardText}>Click any calendar item to open details or navigate directly to the raw email source.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.sectionDivider}/>

      {/* ═══ STATS WITH COUNTING NUMBERS ═══ */}
      <section className={`${styles.fullSection} ${styles.statsSection} ${styles.reveal}`}>
        <div className={styles.fullSectionInner}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTag}>By The Numbers</div>
            <h2 className={styles.sectionTitle}>Built for Scale, Loved by Thousands</h2>
          </div>
          <div className={styles.statsGrid}>
            <StatCounter display="50K+" label="Active Users" />
            <StatCounter display="2.4M" label="Emails Processed" />
            <StatCounter display="98.7%" label="AI Accuracy" />
            <StatCounter display="<1s" label="Extraction Speed" />
          </div>
        </div>
      </section>

      <div className={styles.sectionDivider}/>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className={`${styles.fullSection} ${styles.timelineSection} ${styles.reveal}`}>
        <div className={styles.fullSectionInner}>
          <div className={styles.sectionHeader}><div className={styles.sectionTag}>How It Works</div><h2 className={styles.sectionTitle}>From Inbox Chaos to Total Clarity</h2></div>
          <div className={styles.timeline}>
            <div className={styles.timelineItem}><div className={styles.timelineStep}>1</div><div className={styles.timelineContent}><h3>Connect Your Google Account</h3><p>Sign in securely with one click. We request read-only access to scan your incoming messages specifically for scheduling keywords.</p></div></div>
            <div className={styles.timelineItem}><div className={styles.timelineStep} style={{background:"linear-gradient(135deg,#c084fc,#f472b6)"}}>2</div><div className={styles.timelineContent}><h3>Groq AI Processing</h3><p>Our autonomous engine leverages state-of-the-art LLMs to detect deadlines, exam dates, Zoom meetings, and interview calls with deep contextual understanding.</p></div></div>
            <div className={styles.timelineItem}><div className={styles.timelineStep} style={{background:"linear-gradient(135deg,#4ade80,#3b82f6)"}}>3</div><div className={styles.timelineContent}><h3>Unified Command Center</h3><p>Everything is plotted instantly on your interactive calendar. Background sync runs autonomously so you never lift a finger.</p></div></div>
          </div>
        </div>
      </section>

      <div className={styles.sectionDivider}/>

      {/* ═══ FEATURES ═══ */}
      <section className={`${styles.fullSection} ${styles.featuresSection} ${styles.reveal}`}>
        <div className={styles.fullSectionInner}>
          <div className={styles.sectionHeader}><div className={styles.sectionTag}>Built For Efficiency</div><h2 className={styles.sectionTitle}>Everything You Need, Fully Automated</h2></div>
          <div className={styles.grid}>
            {[
              ["01","Full Initial & Smart Incremental Scanning","On your first sign-in, Tracker conducts a comprehensive pass of your inbox. Afterwards, it runs ultra-fast incremental scans on new incoming messages only."],
              ["02","High-Precision Groq AI Extraction","Leverages advanced LLM models to detect deadlines, exam dates, Zoom links, reporting times, and confidence scores with zero manual data entry."],
              ["03","Expandable Details & Direct Gmail Link","Click any event badge on the calendar to open a glass modal with complete details and a direct button launching the exact email inside Gmail."],
              ["04","Desktop App & Widget Mode","Install Tracker directly onto your Windows or macOS desktop. Launch it as an independent app window outside Chrome tabs for instant access."],
              ["05","Interactive Overflow-Safe Calendar","Clean monthly grid that handles busy days with \"+N more\" overflow triggers, preventing layout breakage no matter how packed your schedule."],
              ["06","Autonomous Background Sync","Runs periodic background fetching so your schedule stays up to date without needing manual button clicks. Set it and forget it."],
            ].map(([num,title,desc]) => (
              <div key={num} className={styles.featureBox}><div className={styles.featureNumber}>{num}</div><h3 className={styles.featureTitle}>{title}</h3><p className={styles.featureDesc}>{desc}</p></div>
            ))}
          </div>
        </div>
      </section>

      <div className={styles.sectionDivider}/>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className={`${styles.fullSection} ${styles.testimonialsSection} ${styles.reveal}`}>
        <div className={styles.fullSectionInner}>
          <div className={styles.sectionHeader}><div className={styles.sectionTag}>Testimonials</div><h2 className={styles.sectionTitle}>Trusted by People Like You</h2></div>
          <div className={styles.testimonialsGrid}>
            {[
              {text:"Tracker completely changed how I handle my semester. It found three assignment deadlines hidden deep in Canvas notification emails that I would have totally missed.",name:"Sarah Jenkins",role:"Computer Science Student",initial:"S",color:"#60a5fa"},
              {text:"The incremental AI background sync is flawless. By the time I get a meeting invite from a client, it's already on my Tracker desktop widget. Best productivity tool of the year.",name:"Marcus Chen",role:"Product Manager @ Nexus",initial:"M",color:"#c084fc"},
              {text:"I love being able to click an event and jump straight to the exact email thread. It saves me from endlessly searching my inbox. The PWA widget sits beautifully on my macOS dock.",name:"Elena Rodriguez",role:"Freelance Designer",initial:"E",color:"#4ade80"},
            ].map((t,i) => (
              <div key={i} className={styles.testimonialCard}>
                <svg className={styles.quoteIcon} viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>
                <div className={styles.testimonialStars}>{[...Array(5)].map((_,si)=>(<svg key={si} width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>))}</div>
                <p className={styles.testimonialText}>"{t.text}"</p>
                <div className={styles.testimonialAuthor}><div className={styles.authorAvatar} style={{color:t.color}}>{t.initial}</div><div className={styles.authorInfo}><h4>{t.name}</h4><p>{t.role}</p></div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className={styles.sectionDivider}/>

      {/* ═══ CTA ═══ */}
      <section className={`${styles.fullSection} ${styles.ctaSection} ${styles.reveal}`}>
        <div className={styles.widgetBanner}>
          <h2 className={styles.widgetBannerTitle}>Ready to use Tracker on your desktop?</h2>
          <p className={styles.widgetBannerDesc}>Click below or use your browser's install option to run Tracker as a standalone application on your system.</p>
          <button onClick={handleInstall} className={styles.primaryCta}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>Install System App Widget</button>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerGrid}>
            <div className={styles.footerBrand}><h3>Tracker | Intelligence</h3><p>AI-powered email-to-calendar synchronisation. Never miss a deadline, meeting, or interview again.</p>
              <div className={styles.footerSocials}>
                <div className={styles.socialIcon}><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></div>
                <div className={styles.socialIcon}><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg></div>
                <div className={styles.socialIcon}><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></div>
              </div>
            </div>
            <div className={styles.footerColumn}><h4>Product</h4><ul><li>Features</li><li>Desktop App</li><li>Integrations</li><li>Changelog</li><li>Pricing</li></ul></div>
            <div className={styles.footerColumn}><h4>Resources</h4><ul><li>Documentation</li><li>Help Center</li><li>API Reference</li><li>Community</li><li>Blog</li></ul></div>
            <div className={styles.footerColumn}><h4>Company</h4><ul><li>About Us</li><li>Careers</li><li>Contact</li><li>Partners</li></ul></div>
          </div>
          <div className={styles.footerBottom}><span>© 2026 Tracker Intelligence. All rights reserved.</span><div className={styles.footerBottomLinks}><span>Privacy Policy</span><span>Terms of Service</span><span>Cookie Policy</span></div></div>
        </div>
      </footer>
    </div>
  );
}
