import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "../../../../../../auth";
import { getEventById } from "@/lib/events";
import EventForm from "@/components/admin/EventForm";
import { getEventRsvpList } from "@/lib/events";
import RsvpListTable from "@/components/admin/RsvpListTable";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit Event — Admin" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditEventPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (session?.user?.role !== "admin" && session?.user?.role !== "pastor") notFound();

  const event = await getEventById(id);
  if (!event) notFound();

  const rsvps = await getEventRsvpList(id);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Event</h1>
        <p className="text-sm text-gray-500 mt-1">{event.title}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <EventForm event={event} />
        </div>

        <div>
          <RsvpListTable rsvps={rsvps} eventTitle={event.title} />
        </div>
      </div>
    </div>
  );
}
