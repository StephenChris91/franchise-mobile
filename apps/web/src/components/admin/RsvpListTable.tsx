"use client";

import { format } from "date-fns";
import { Download } from "lucide-react";

interface RsvpRow {
  status: string;
  guestsCount: number;
  notes: string | null;
  createdAt: Date;
  userId: string;
  fullName: string;
  username: string;
  email: string | null;
  phone: string | null;
}

interface Props {
  rsvps: RsvpRow[];
  eventTitle: string;
}

function exportCsv(rsvps: RsvpRow[], title: string) {
  const header = ["Name", "Username", "Email", "Phone", "Status", "Guests", "RSVPd At"];
  const rows = rsvps.map((r) => [
    r.fullName,
    `@${r.username}`,
    r.email ?? "",
    r.phone ?? "",
    r.status,
    String(r.guestsCount),
    format(new Date(r.createdAt), "yyyy-MM-dd HH:mm"),
  ]);
  const csv = [header, ...rows].map((row) => row.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-rsvps.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const STATUS_COLORS: Record<string, string> = {
  going: "bg-green-100 text-green-700",
  interested: "bg-blue-100 text-blue-700",
  not_going: "bg-gray-100 text-gray-500",
};

export default function RsvpListTable({ rsvps, eventTitle }: Props) {
  const going = rsvps.filter((r) => r.status === "going").length;
  const interested = rsvps.filter((r) => r.status === "interested").length;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-700">RSVPs</h2>
          <p className="text-xs text-gray-400 mt-0.5">{going} going · {interested} interested</p>
        </div>
        {rsvps.length > 0 && (
          <button
            onClick={() => exportCsv(rsvps, eventTitle)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-2.5 py-1.5 transition"
          >
            <Download size={12} />
            CSV
          </button>
        )}
      </div>

      {rsvps.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-6">No RSVPs yet</p>
      ) : (
        <div className="space-y-2">
          {rsvps.map((r) => (
            <div key={r.userId} className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{r.fullName}</p>
                <p className="text-xs text-gray-400">{r.email}</p>
              </div>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[r.status] ?? "bg-gray-100 text-gray-500"}`}>
                {r.status.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
