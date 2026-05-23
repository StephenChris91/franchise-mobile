import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "../../../../../auth";
import EventForm from "@/components/admin/EventForm";

export const metadata: Metadata = { title: "New Event — Admin" };

export default async function NewEventPage() {
  const session = await auth();
  if (session?.user?.role !== "admin" && session?.user?.role !== "pastor") notFound();

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create Event</h1>
      </div>
      <EventForm />
    </div>
  );
}
