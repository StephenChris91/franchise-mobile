import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "../../../../auth";
import { getPendingReports } from "@/lib/admin";
import ReportsClient from "@/components/admin/ReportsClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Reports — Admin" };

export default async function AdminReportsPage() {
  const session = await auth();
  if (session?.user?.role !== "admin" && session?.user?.role !== "pastor") notFound();

  const reports = await getPendingReports();

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Content Reports</h1>
        <p className="text-sm text-gray-500 mt-1">{reports.length} pending report{reports.length !== 1 ? "s" : ""}</p>
      </div>
      <ReportsClient reports={reports} />
    </div>
  );
}
