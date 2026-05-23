import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { auth } from "../../../../auth";
import { getAuditLog } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Audit Log — Admin" };

export default async function AdminAuditPage() {
  const session = await auth();
  if (session?.user?.role !== "pastor") notFound(); // Pastor only

  const entries = await getAuditLog(200);

  const ACTION_LABELS: Record<string, string> = {
    approve_member: "Approved member",
    reject_member: "Rejected member",
    suspend_member: "Suspended member",
    unsuspend_member: "Unsuspended member",
    change_role: "Changed role",
    report_hide_content: "Hid reported content",
    report_hide_and_suspend: "Hid content + suspended user",
    report_dismiss: "Dismissed report",
    post_announcement: "Posted announcement",
    create_event: "Created event",
    update_event: "Updated event",
    delete_event: "Deleted event",
    create_group: "Created group",
    update_group: "Updated group",
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-sm text-gray-500 mt-1">All admin actions · {entries.length} recent entries</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Admin</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Action</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Details</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {entries.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-900">{e.adminName}</p>
                  <p className="text-xs text-gray-400">@{e.adminUsername}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-700">
                    {ACTION_LABELS[e.actionType] ?? e.actionType.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {e.metadata && Object.keys(e.metadata).length > 0 && (
                    <p className="text-xs text-gray-500 max-w-xs truncate">
                      {JSON.stringify(e.metadata)}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-gray-400">
                    {format(new Date(e.createdAt), "d MMM yyyy HH:mm")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-sm">No audit entries yet</div>
        )}
      </div>
    </div>
  );
}
