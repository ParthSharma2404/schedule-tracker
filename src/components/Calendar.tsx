"use client";

import React, { useState } from "react";
import styles from "./Calendar.module.css";

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MAX_VISIBLE_EVENTS = 2;

export type CalendarEvent = {
  id: string;
  title: string;
  description: string;
  type: string;
  date: number;
  month: number;
  year: number;
  startTime: string;
  endTime: string | null;
  confidence: number;
  gmailMessageId: string | null;
  sourceSubject: string | null;
  sourceSender: string | null;
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function getTypeColor(type: string) {
  switch (type) {
    case "deadline": return { bg: "rgba(239, 68, 68, 0.15)", border: "#ef4444", text: "#fca5a5" };
    case "meeting": return { bg: "rgba(59, 130, 246, 0.15)", border: "#3b82f6", text: "#93c5fd" };
    default: return { bg: "rgba(234, 179, 8, 0.15)", border: "#eab308", text: "#fde047" };
  }
}

function getGmailLink(messageId: string) {
  return `https://mail.google.com/mail/u/0/#inbox/${messageId}`;
}

// ─── Event Detail Modal ──────────────────────────────────────
function EventModal({ event, onClose }: { event: CalendarEvent; onClose: () => void }) {
  const colors = getTypeColor(event.type);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalTypeBadge} style={{ backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }}>
            {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
          </div>
          <button className={styles.modalClose} onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Title */}
        <h2 className={styles.modalTitle}>{event.title}</h2>

        {/* Details */}
        <div className={styles.modalDetails}>
          <div className={styles.modalRow}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>{formatDate(event.startTime)}</span>
          </div>
          <div className={styles.modalRow}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>{formatTime(event.startTime)}{event.endTime ? ` — ${formatTime(event.endTime)}` : ""}</span>
          </div>
          {event.confidence && (
            <div className={styles.modalRow}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span>Confidence: {Math.round(event.confidence * 100)}%</span>
            </div>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <div className={styles.modalSection}>
            <h4 className={styles.modalSectionTitle}>Description</h4>
            <p className={styles.modalDescription}>{event.description}</p>
          </div>
        )}

        {/* Source Email */}
        {event.sourceSubject && (
          <div className={styles.modalSection}>
            <h4 className={styles.modalSectionTitle}>Source Email</h4>
            <div className={styles.modalSourceCard}>
              <div className={styles.modalSourceSubject}>{event.sourceSubject}</div>
              {event.sourceSender && <div className={styles.modalSourceSender}>{event.sourceSender}</div>}
            </div>
          </div>
        )}

        {/* Gmail Link */}
        {event.gmailMessageId && (
          <a
            href={getGmailLink(event.gmailMessageId)}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.modalGmailLink}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Open in Gmail
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Day Events List ("+N more" overflow) ────────────────────
function DayEventsModal({ events, date, onClose, onEventClick }: { 
  events: CalendarEvent[]; 
  date: number; 
  onClose: () => void; 
  onEventClick: (e: CalendarEvent) => void;
}) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.dayModalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Events on {date}th</h3>
          <button className={styles.modalClose} onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className={styles.dayModalList}>
          {events.map((evt) => {
            const colors = getTypeColor(evt.type);
            return (
              <div
                key={evt.id}
                className={styles.dayModalItem}
                style={{ borderLeftColor: colors.border }}
                onClick={() => { onClose(); onEventClick(evt); }}
              >
                <div className={styles.dayModalItemTitle}>{evt.title}</div>
                <div className={styles.dayModalItemTime}>{formatTime(evt.startTime)} · {evt.type}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main Calendar ───────────────────────────────────────────
export default function Calendar({ events = [] }: { events: CalendarEvent[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week">("month");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [dayOverflow, setDayOverflow] = useState<{ events: CalendarEvent[]; date: number } | null>(null);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const prevMonthDays = getDaysInMonth(currentYear, currentMonth - 1);
  const paddingDays = Array.from({ length: firstDay }).map((_, i) => prevMonthDays - firstDay + i + 1);
  const currentDays = Array.from({ length: daysInMonth }).map((_, i) => i + 1);
  const totalCells = paddingDays.length + currentDays.length;
  const nextMonthPadding = Array.from({ length: 42 - totalCells }).map((_, i) => i + 1);

  const prevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  return (
    <div className={styles.calendarContainer}>
      <header className={styles.calendarHeader}>
        <h2 className={styles.monthTitle}>{MONTHS[currentMonth]} {currentYear}</h2>
        <div className={styles.controls}>
          <div className={styles.viewSelector}>
            <button className={`${styles.viewBtn} ${view === 'month' ? styles.viewBtnActive : ''}`} onClick={() => setView('month')}>Month</button>
            <button className={`${styles.viewBtn} ${view === 'week' ? styles.viewBtnActive : ''}`} onClick={() => setView('week')}>Week</button>
          </div>
          <button className={styles.controlBtn} onClick={prevMonth}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button className={styles.controlBtn} onClick={nextMonth}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <button className={styles.todayBtn} onClick={goToday}>Today</button>
        </div>
      </header>

      <div className={styles.grid}>
        {DAYS.map(day => (
          <div key={day} className={styles.dayName}>{day}</div>
        ))}

        {/* Previous Month Padding */}
        {paddingDays.map(day => (
          <div key={`prev-${day}`} className={`${styles.cell} ${styles.cellInactive}`}>
            <div className={styles.dateNumber}>{day}</div>
          </div>
        ))}

        {/* Current Month Days */}
        {currentDays.map(day => {
          const actualToday = new Date();
          const isToday = day === actualToday.getDate() && currentMonth === actualToday.getMonth() && currentYear === actualToday.getFullYear();
          const dayEvents = events.filter(e => e.date === day && e.month === currentMonth && e.year === currentYear);
          const visibleEvents = dayEvents.slice(0, MAX_VISIBLE_EVENTS);
          const overflowCount = dayEvents.length - MAX_VISIBLE_EVENTS;

          return (
            <div key={`cur-${day}`} className={styles.cell}>
              <div className={`${styles.dateNumber} ${isToday ? styles.dateToday : ''}`}>{day}</div>
              <div className={styles.eventList}>
                {visibleEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className={`${styles.event} ${
                      evt.type === 'deadline' ? styles.eventDeadline :
                      evt.type === 'meeting' ? styles.eventMeeting :
                      styles.eventSchedule
                    }`}
                    title={evt.title}
                    onClick={(e) => { e.stopPropagation(); setSelectedEvent(evt); }}
                  >
                    {evt.title}
                  </div>
                ))}
                {overflowCount > 0 && (
                  <button
                    className={styles.moreBtn}
                    onClick={(e) => { e.stopPropagation(); setDayOverflow({ events: dayEvents, date: day }); }}
                  >
                    +{overflowCount} more
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Next Month Padding */}
        {nextMonthPadding.map(day => (
          <div key={`next-${day}`} className={`${styles.cell} ${styles.cellInactive}`}>
            <div className={styles.dateNumber}>{day}</div>
          </div>
        ))}
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}

      {/* Day Overflow Modal */}
      {dayOverflow && (
        <DayEventsModal
          events={dayOverflow.events}
          date={dayOverflow.date}
          onClose={() => setDayOverflow(null)}
          onEventClick={(e) => setSelectedEvent(e)}
        />
      )}
    </div>
  );
}
