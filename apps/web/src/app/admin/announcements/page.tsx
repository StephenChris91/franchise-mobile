import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "../../../../auth";
import AnnouncementComposer from "@/components/admin/AnnouncementComposer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Announcements — Admin" };

export default async function AdminAnnouncementsPage() {
  const session = await auth();
  if (session?.user?.role !== "admin" && session?.user?.role !== "pastor") notFound();

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Post Announcement</h1>
        <p className="text-sm text-gray-500 mt-1">
          Announcements appear in the Community Feed with a pin badge and are visible to all approved members.
        </p>
      </div>
      <div className="max-w-2xl">
        <AnnouncementComposer />
      </div>
    </div>
  );
}
