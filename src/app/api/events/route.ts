import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await req.json();
    const { title, description, type, startTime, endTime, sourceEmailId } = body;

    if (!title || !type || !startTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : null;

    if (isNaN(start.getTime())) {
      return NextResponse.json({ error: "Invalid start time" }, { status: 400 });
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        type,
        startTime: start,
        endTime: end,
        userId: userId,
        sourceEmailId: sourceEmailId || null,
        confidence: 1.0, // Manually added, so confidence is 1.0
      }
    });
    
    // If it came from an email, we should clear the processingError so it disappears from the failed list
    if (sourceEmailId) {
       await prisma.email.update({
         where: { id: sourceEmailId },
         data: { processingError: null } // Cleared because it's been manually handled
       });
    }

    return NextResponse.json({ success: true, event });
  } catch (error: any) {
    console.error("Create event error:", error);
    return NextResponse.json({ error: error.message || "Failed to create event" }, { status: 500 });
  }
}
