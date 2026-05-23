import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { MapPin, Clock, Users, ExternalLink, Calendar, ArrowLeft } from "lucide-react";
import { auth } from "../../../../auth";
import { getEventBySlug, getUserRsvp, getEventRsvpCounts } from "@/lib/events";
import RsvpButton from "@/components/events/RsvpButton";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Event not found" };
  return {
    title: `${event.title} — Franchise Church`,
    description: `Join us for ${event.title} at Franchise Church, Lagos.`,
    openGraph: {
      images: event.coverImageUrl ? [event.coverImageUrl] : [],
    },
  };
}

const TYPE_LABELS: Record<string, string> = {
  service: "Service", conference: "Conference", outreach: "Outreach",
  social: "Social", training: "Training", prayer: "Prayer", other: "Event",
};

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;

  const [event, session] = await Promise.all([
    getEventBySlug(slug),
    auth(),
  ]);

  if (!event) notFound();

  const isApproved = session?.user?.approvalStatus === "approved";
  const userId = session?.user?.id;

  const [userRsvp, rsvpCounts] = await Promise.all([
    userId ? getUserRsvp(event.id, userId) : Promise.resolve(null),
    getEventRsvpCounts(event.id),
  ]);

  const startsAt = new Date(event.startsAt);
  const endsAt = new Date(event.endsAt);
  const isPast = endsAt < new Date();
  const isSameDay = format(startsAt, "yyyy-MM-dd") === format(endsAt, "yyyy-MM-dd");

  const dateStr = isSameDay
    ? format(startsAt, "EEEE, d MMMM yyyy")
    : `${format(startsAt, "d MMM")} – ${format(endsAt, "d MMM yyyy")}`;

  const timeStr = isSameDay
    ? `${format(startsAt, "h:mm a")} – ${format(endsAt, "h:mm a")}`
    : `${format(startsAt, "h:mm a")}`;

  const capacityLeft = event.capacity
    ? Math.max(0, event.capacity - rsvpCounts.going)
    : null;

  return (
    <div className="min-h-screen bg-[#f5f3f0]">
      {/* Cover */}
      <div className="relative h-64 md:h-80 bg-gradient-to-br from-[#1b1b1b] to-[#2a2a2a] overflow-hidden">
        {event.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.coverImageUrl}
            alt={event.title}
            className="w-full h-full object-cover opacity-70"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Back button */}
        <Link
          href="/events"
          className="absolute top-4 left-4 flex items-center gap-1.5 text-white/80 text-sm hover:text-white transition bg-black/30 backdrop-blur-sm rounded-lg px-3 py-1.5"
        >
          <ArrowLeft size={14} />
          All events
        </Link>

        {/* Type badge */}
        <div className="absolute bottom-4 left-4">
          <span className="text-xs font-bold bg-[#af601a] text-white px-2.5 py-1 rounded-full">
            {TYPE_LABELS[event.eventType] ?? event.eventType}
          </span>
        </div>

        {/* ICS download */}
        <a
          href={`/api/events/${event.slug}/ics`}
          className="absolute bottom-4 right-4 flex items-center gap-1.5 text-white/80 text-xs hover:text-white transition bg-black/30 backdrop-blur-sm rounded-lg px-3 py-1.5"
        >
          <Calendar size={13} />
          Add to Calendar
        </a>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
          {/* Left: details */}
          <div>
            {isPast && (
              <div className="inline-block bg-gray-200 text-gray-600 text-xs font-semibold px-2.5 py-1 rounded-full mb-3">
                Past event
              </div>
            )}

            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 leading-tight">
              {event.title}
            </h1>

            {/* Info pills */}
            <div className="space-y-3 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#af601a]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock size={16} className="text-[#af601a]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{dateStr}</p>
                  <p className="text-sm text-gray-500">{timeStr}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#af601a]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin size={16} className="text-[#af601a]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{event.location}</p>
                  {event.locationUrl && (
                    <a
                      href={event.locationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#af601a] hover:underline flex items-center gap-1 mt-0.5"
                    >
                      View on map <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>

              {event.rsvpRequired && (
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#af601a]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Users size={16} className="text-[#af601a]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {rsvpCounts.going} going · {rsvpCounts.interested} interested
                    </p>
                    {capacityLeft !== null && (
                      <p className="text-xs text-gray-500">
                        {capacityLeft === 0
                          ? "Event is at capacity"
                          : `${capacityLeft} of ${event.capacity} spots remaining`}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {event.description && (
              <div className="prose prose-sm max-w-none text-gray-700">
                <h2 className="text-base font-semibold text-gray-900 mb-2">About this event</h2>
                <div
                  className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap"
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{ __html: event.description }}
                />
              </div>
            )}
          </div>

          {/* Right: RSVP card */}
          <div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sticky top-6">
              {isPast ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">This event has ended.</p>
                  <Link
                    href="/events"
                    className="mt-3 inline-block text-sm font-semibold text-[#af601a] hover:underline"
                  >
                    See upcoming events →
                  </Link>
                </div>
              ) : event.rsvpRequired ? (
                <>
                  <h2 className="text-sm font-bold text-gray-900 mb-4">RSVP</h2>
                  {capacityLeft === 0 && userRsvp?.status !== "going" ? (
                    <p className="text-sm text-red-600 font-medium">
                      This event is at full capacity.
                    </p>
                  ) : (
                    <RsvpButton
                      eventId={event.id}
                      initialStatus={
                        (userRsvp?.status as "going" | "interested" | "not_going" | null) ?? null
                      }
                      isApproved={isApproved}
                    />
                  )}
                </>
              ) : (
                <div className="text-center py-2">
                  <div className="w-12 h-12 bg-[#af601a]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users size={20} className="text-[#af601a]" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">Open to all</p>
                  <p className="text-xs text-gray-500">No RSVP required. Just show up!</p>
                </div>
              )}

              {!isPast && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <a
                    href={`/api/events/${event.slug}/ics`}
                    className="flex items-center justify-center gap-2 w-full py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition"
                  >
                    <Calendar size={14} />
                    Add to Calendar
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
