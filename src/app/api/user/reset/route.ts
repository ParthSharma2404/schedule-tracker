import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Delete all events for the user
    await prisma.event.deleteMany({
      where: { userId: userId },
    });

    // Delete all emails for the user
    await prisma.email.deleteMany({
      where: { userId: userId },
    });

    // Reset the sync timestamp
    await prisma.user.update({
      where: { id: userId },
      data: { lastSyncedAt: null },
    });

    return NextResponse.json({ success: true, message: "Data reset successfully" });
  } catch (error: any) {
    console.error("Failed to reset user data:", error);
    return NextResponse.json({ error: "Failed to reset data" }, { status: 500 });
  }
}
