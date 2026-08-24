"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddEventForm({ email }: { email: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: email?.subject || "",
    type: "schedule",
    date: new Date().toISOString().split('T')[0],
    time: "12:00",
    description: `From: ${email?.sender || ""}\n\n${email?.bodySnippet || ""}`,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Combine date and time into ISO string
      const startTime = new Date(`${formData.date}T${formData.time}:00`).toISOString();

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          type: formData.type,
          startTime,
          description: formData.description,
          sourceEmailId: email?.id || null
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create event");

      router.push("/calendar");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #333',
    backgroundColor: '#1e1e24',
    color: '#fff',
    fontSize: '0.9rem',
    marginTop: '6px'
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {error && (
        <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      <div>
        <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Title</label>
        <input 
          type="text" 
          value={formData.title} 
          onChange={e => setFormData({ ...formData, title: e.target.value })}
          required
          style={inputStyle}
          placeholder="Event Title"
        />
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Type</label>
          <select 
            value={formData.type} 
            onChange={e => setFormData({ ...formData, type: e.target.value })}
            style={inputStyle}
          >
            <option value="schedule">Schedule</option>
            <option value="meeting">Meeting</option>
            <option value="deadline">Deadline</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Date</label>
          <input 
            type="date" 
            value={formData.date} 
            onChange={e => setFormData({ ...formData, date: e.target.value })}
            required
            style={inputStyle}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Time</label>
          <input 
            type="time" 
            value={formData.time} 
            onChange={e => setFormData({ ...formData, time: e.target.value })}
            required
            style={inputStyle}
          />
        </div>
      </div>

      <div>
        <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Description / Notes</label>
        <textarea 
          value={formData.description} 
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          rows={5}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <button 
          type="submit" 
          disabled={loading}
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: 'var(--color-primary)',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Saving...' : 'Add Event to Calendar'}
        </button>
        <button 
          type="button"
          onClick={() => router.back()}
          style={{
            padding: '12px 24px',
            backgroundColor: 'transparent',
            color: 'var(--text-primary)',
            border: '1px solid #333',
            borderRadius: '8px',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
