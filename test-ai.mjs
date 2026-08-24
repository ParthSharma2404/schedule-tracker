import 'dotenv/config';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

try {
  const r = await groq.chat.completions.create({
    model: 'openai/gpt-oss-20b',
    messages: [{
      role: 'user',
      content: `You are an email parsing assistant. Extract event info from this email.
Subject: Exam Scheduled: Cognizant - 6
Sender: MARS <mars@teachgenie.ai>
Received: 2026-08-22T00:00:00Z
Body: Dear PARTH SHARMA, exam has been scheduled Cognizant - 6 for you. Reporting Date: 25 Aug 2026.

Return JSON: {"isEvent": bool, "title": string, "description": string, "type": "deadline"|"meeting"|"schedule", "startTime": "ISO-8601", "confidence": 0-1}`
    }],
    response_format: { type: 'json_object' },
  });

  console.log("SUCCESS! Response:");
  console.log(r.choices[0].message.content);
} catch (err) {
  console.error("ERROR:", err.message);
}

process.exit(0);
