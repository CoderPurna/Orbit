import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { meeting } from "@/db/schema/meetings";
import { eq, and, isNull } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const [targetMeeting] = await db
      .select()
      .from(meeting)
      .where(and(eq(meeting.id, id), isNull(meeting.deletedAt)));

    if (!targetMeeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const start = targetMeeting.scheduledStartAt || targetMeeting.createdAt;
    const end =
      targetMeeting.scheduledEndAt ||
      new Date(start.getTime() + 60 * 60 * 1000);

    const formatDate = (date: Date) =>
      date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Orbit//NONSGML Meeting Calendar//EN",
      "METHOD:REQUEST",
      "BEGIN:VEVENT",
      `UID:${targetMeeting.id}@orbit.app`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(start)}`,
      `DTEND:${formatDate(end)}`,
      `SUMMARY:${targetMeeting.title.replace(/\n/g, " ")}`,
      `DESCRIPTION:${(targetMeeting.description || "").replace(/\n/g, "\\n")}`,
      `URL;VALUE=URI:https://orbit.app/m/${targetMeeting.roomCode}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="meeting-${targetMeeting.roomCode}.ics"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate ICS file" },
      { status: 500 },
    );
  }
}
