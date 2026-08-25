import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ExtractedEvent {
  isEvent: boolean;
  title?: string;
  description?: string;
  type?: 'deadline' | 'meeting' | 'schedule';
  startTime?: string; // ISO 8601 string
  endTime?: string;   // ISO 8601 string
  confidence?: number;
}

export async function analyzeEmailForEvents(
  subject: string, 
  sender: string, 
  bodyText: string, 
  receivedAt: Date
): Promise<ExtractedEvent | null> {
  const prompt = `
You are an intelligent email parsing assistant. Your job is to extract events, meetings, deadlines, and schedules from the provided email metadata and full body text.

Email Metadata:
- Subject: ${subject}
- Sender: ${sender}
- Received Date: ${receivedAt.toISOString()}

Email Body Content:
${bodyText}

Instructions:
Determine if this email announces a schedule, deadline, meeting, or selection process. 
Even if the exact date or time is NOT explicitly mentioned in the text (e.g., it might be in an attachment or implied), you MUST still extract it as an event.
If it is clearly just marketing garbage, set "isEvent" to false.
If it is a relevant event/schedule/deadline, set "isEvent" to true, and extract the following:
- "title": A short, clear title for the event (max 50 chars).
- "description": A comprehensive summary showcasing the main crux of the email, including any important context, instructions, or prerequisites for the event. Write in clear, complete sentences.
- "type": strictly one of: "deadline", "meeting", "schedule".
- "startTime": The start time of the event as a strict UTC ISO-8601 string (e.g. 2026-08-25T15:00:00Z). CRITICAL: You MUST thoroughly scan the Email Body for any mention of the event's actual date and time (e.g., "24th August", "tomorrow at 5pm"). If you find an event date in the body, you MUST use that date to generate the ISO string. DO NOT use the "Received Date" as the startTime unless there is absolutely zero mention of any future date/time in the email.
- "endTime": (Optional) The end time of the event as a strict UTC ISO-8601 string (e.g. 2026-08-25T16:00:00Z).
- "confidence": A number from 0.0 to 1.0 indicating your confidence in this extraction.

Return ONLY a valid JSON object matching this schema. Do not include markdown blocks or any other text.
`;

  let retries = 3;
  while (retries > 0) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const resultText = response.text;
      if (!resultText) return null;
      
      const parsed = JSON.parse(resultText) as ExtractedEvent;
      
      if (parsed.isEvent) {
        return parsed;
      }
      
      return null;
    } catch (error) {
      retries--;
      if (retries === 0) {
        console.error("Error analyzing email with Gemini (Retries exhausted):", error);
        return null;
      }
      // Exponential backoff: wait 1s, then 2s
      await new Promise(resolve => setTimeout(resolve, (3 - retries) * 1000));
    }
  }
  return null;
}
