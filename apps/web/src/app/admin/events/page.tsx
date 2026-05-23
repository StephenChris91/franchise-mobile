import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Plus, Pencil, Eye, EyeOff, Copy } from "lucide-react";
import { auth } from "../../../../auth";
import { getAllEventsAdmin } from "@/lib/events";
import { updateEvent, deleteEvent, duplicateEvent } from "@/lib/actions/events";
import DeleteEventButton from "@/components/admin/DeleteEventButton";
import DuplicateEventButton from "@/components/admin/DuplicateEventButton";
import TogglePublishButton from "@/components/admin/TogglePublishButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Events — Admin" };

export default async function AdminEventsPage() {
  const session = await auth();
  if (session?.user?.role !== "admin" && session?.user?.role !== "pastor") notFound();

  const events = await getAllEventsAdmin();
  const now = new Date();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-sm text-gray-500 mt-1">{events.length} event{events.length !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href="/admin/events/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#af601a] text-white text-sm font-semibold hover:bg-[#c47020] transition"
        >
          <Plus size={16} />
          New Event
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Event</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 hidden md:table-cell">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 hidden lg:table-cell">Location</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {events.map((event) => {
              const isPast = event.endsAt < now;
              return (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{event.title}</p>
                    <p className="text-xs text-gray-400 capitalize mt-0.5">{event.eventType}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-xs text-gray-600">{format(new Date(event.startsAt), "d MMM yyyy")}</p>
                    <p className="text-xs text-gray-400">{format(new Date(event.startsAt), "HH:mm")}</p>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <p className="text-xs text-gray-600 truncate max-w-[120px]">{event.location || "—"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium w-fit ${
                        event.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {event.isPublished ? "Published" : "Draft"}
                      </span>
                      {isPast && (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-gray-50 text-gray-400 w-fit">
                          Past
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/events/${event.id}/edit`}
                        className="p-1.5 rounded text-gray-400 hover:text-[#af601a] hover:bg-orange-50 transition"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </Link>

                      <TogglePublishButton id={event.id} isPublished={event.isPublished} />

                      {event.isPublished && (
                        <Link
                          href={`/events/${event.slug}`}
                          target="_blank"
                          className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                          title="View public page"
                        >
                          <Eye size={14} />
                        </Link>
                      )}

                      <DuplicateEventButton id={event.id} />
                      <DeleteEventButton id={event.id} title={event.title} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {events.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            <p>No events yet.</p>
            <Link href="/admin/events/new" className="text-[#af601a] hover:underline mt-1 inline-block">
              Create your first event →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
