import { NextResponse } from "next/server";
import { getEventBySlug } from "@/lib/events";

function formatIcsDate(d: Date): string {
  return d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://thefranchiselagos.com.ng";
  const uid = `${event.id}@thefranchiselagos.com.ng`;

  // Strip HTML from description if any
  const plainDesc = event.description
    ? event.description.replace(/<[^>]*>/g, "").trim()
    : "";

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Franchise Church//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTART:${formatIcsDate(new Date(event.startsAt))}`,
    `DTEND:${formatIcsDate(new Date(event.endsAt))}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    plainDesc ? `DESCRIPTION:${escapeIcsText(plainDesc.substring(0, 500))}` : null,
    `LOCATION:${escapeIcsText(event.location)}`,
    `URL:${appUrl}/events/${event.slug}`,
    "STATUS:CONFIRMED",
    `DTSTAMP:${formatIcsDate(new Date())}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter((l): l is string => l !== null)
    .join("\r\n");

  const filename = `${event.slug}.ics`;

  return new NextResponse(lines, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
