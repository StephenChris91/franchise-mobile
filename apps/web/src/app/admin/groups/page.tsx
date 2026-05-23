import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "../../../../auth";
import { getGroupsForAdmin } from "@/lib/admin";
import GroupsAdminClient from "@/components/admin/GroupsAdminClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Groups — Admin" };

export default async function AdminGroupsPage() {
  const session = await auth();
  if (session?.user?.role !== "admin" && session?.user?.role !== "pastor") notFound();

  const groups = await getGroupsForAdmin();

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Groups</h1>
        <p className="text-sm text-gray-500 mt-1">{groups.length} group{groups.length !== 1 ? "s" : ""}</p>
      </div>
      <GroupsAdminClient groups={groups} />
    </div>
  );
}
