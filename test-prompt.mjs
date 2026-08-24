import 'dotenv/config';

async function test() {
  const { analyzeEmailForEvents } = await import("./src/lib/ai.ts");
  const subject = "Schedule for the Pre-placement talk of ACCENTURE OC.1630.2027.62629.";
  const sender = "Division of career services <placement@lpu.co.in>";
  const receivedAt = new Date("2026-08-22T10:00:00Z");
  const bodyText = `Dear Student, Congratulations! We are pleased to inform you that you have been shortlisted for the Pre-placement talk of ACCENTURE. We're excited to invite you to our virtual Pre-Placement Connect designed to open doors to your career journey at Accenture. Event Details Date: 24th August 2026 Time: 12:00 pm Join the Meeting: Click here to join.`;

  console.log("Analyzing...");
  const result = await analyzeEmailForEvents(subject, sender, bodyText, receivedAt);
  console.log(JSON.stringify(result, null, 2));
}

test().catch(console.error);
