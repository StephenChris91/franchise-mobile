import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { MapPin, Calendar, Users, ChevronRight } from "lucide-react";
import { getPublishedEvents } from "@/lib/events";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Events — Franchise Church",
  description: "Upcoming events at Franchise Church, Lagos.",
};

const TYPE_LABELS: Record<string, string> = {
  service: "Service",
  conference: "Conference",
  outreach: "Outreach",
  social: "Social",
  training: "Training",
  prayer: "Prayer",
  other: "Event",
};

const TYPE_COLORS: Record<string, string> = {
  service: "bg-amber-100 text-amber-800",
  conference: "bg-purple-100 text-purple-800",
  outreach: "bg-green-100 text-green-800",
  social: "bg-blue-100 text-blue-800",
  training: "bg-indigo-100 text-indigo-800",
  prayer: "bg-rose-100 text-rose-800",
  other: "bg-gray-100 text-gray-700",
};

export default async function EventsPage() {
  const allEvents = await getPublishedEvents();
  const now = new Date();

  const upcoming = allEvents.filter((e) => new Date(e.endsAt) >= now);
  const past = allEvents.filter((e) => new Date(e.endsAt) < now);

  return (
    <div className="min-h-screen bg-[#f5f3f0]">
      {/* Hero */}
      <div className="bg-[#1b1b1b] text-white">
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <p className="text-[#af601a] text-sm font-semibold uppercase tracking-widest mb-3">
            Franchise Church · Lagos
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Events</h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Join us for worship, community, and growth. All are welcome.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Upcoming */}
        {upcoming.length > 0 && (
          <section className="mb-14">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">
              Upcoming
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {upcoming.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Calendar size={28} className="text-[#af601a]" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 mb-1">
              No upcoming events
            </h2>
            <p className="text-gray-500 text-sm">Check back soon — we&apos;re planning something great.</p>
          </div>
        )}

        {/* Past */}
        {past.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">
              Past Events
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 opacity-70">
              {past.slice(0, 6).map((event) => (
                <EventCard key={event.id} event={event} past />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function EventCard({
  event,
  past = false,
}: {
  event: {
    id: string;
    slug: string;
    title: string;
    eventType: string;
    location: string;
    startsAt: Date;
    endsAt: Date;
    coverImageUrl: string | null;
    rsvpRequired: boolean;
    capacity: number | null;
  };
  past?: boolean;
}) {
  const dateStr = format(new Date(event.startsAt), "EEE d MMM");
  const timeStr = format(new Date(event.startsAt), "h:mm a");

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col"
    >
      {/* Cover image or placeholder */}
      <div className="h-40 bg-gradient-to-br from-[#1b1b1b] to-[#2a2a2a] relative overflow-hidden shrink-0">
        {event.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.coverImageUrl}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar size={32} className="text-[#af601a]" />
          </div>
        )}
        {past && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white text-xs font-semibold bg-black/50 px-2 py-0.5 rounded-full">
              Past
            </span>
          </div>
        )}
        <span
          className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${
            TYPE_COLORS[event.eventType] ?? TYPE_COLORS.other
          }`}
        >
          {TYPE_LABELS[event.eventType] ?? event.eventType}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-2 line-clamp-2 group-hover:text-[#af601a] transition-colors">
          {event.title}
        </h3>

        <div className="mt-auto space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar size={12} className="shrink-0" />
            <span>
              {dateStr} · {timeStr}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <MapPin size={12} className="shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
          {event.rsvpRequired && event.capacity && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Users size={12} className="shrink-0" />
              <span>Capacity: {event.capacity}</span>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#af601a] group-hover:gap-2 transition-all">
          {past ? "View details" : "View & RSVP"}
          <ChevronRight size={13} />
        </div>
      </div>
    </Link>
  );
}
