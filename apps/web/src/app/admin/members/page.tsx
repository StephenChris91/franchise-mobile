import type { Metadata } from "next";
import { getMembersForAdmin } from "@/lib/admin";
import { auth } from "../../../../auth";
import { notFound } from "next/navigation";
import MembersClient from "@/components/admin/MembersClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Members — Admin" };

type Status = "pending" | "approved" | "rejected" | "suspended" | "all";

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== "admin" && session?.user?.role !== "pastor") notFound();

  const { status = "pending", search } = await searchParams;
  const safeStatus = ["pending", "approved", "rejected", "suspended", "all"].includes(status)
    ? (status as Status)
    : "pending";

  const members = await getMembersForAdmin({ status: safeStatus, search });

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Members</h1>
        <p className="text-sm text-gray-500 mt-1">{members.length} members · {safeStatus} view</p>
      </div>
      <MembersClient members={members} currentStatus={safeStatus} />
    </div>
  );
}
