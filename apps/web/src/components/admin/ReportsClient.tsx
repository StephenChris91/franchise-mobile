"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { EyeOff, Ban, X, Flag } from "lucide-react";
import { resolveReport } from "@/lib/actions/admin";
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";

interface Report {
  id: string;
  reason: string;
  notes: string;
  status: string;
  createdAt: Date;
  reportedPostId: string | null;
  reportedCommentId: string | null;
  reporterUsername: string;
  reporterName: string;
  postContent: string | null;
}

function getPostPreview(content: string | null): string {
  if (!content) return "(content deleted)";
  try {
    const parsed = JSON.parse(content);
    if (parsed.type === "doc") {
      return generateHTML(parsed, [StarterKit]).replace(/<[^>]+>/g, "").slice(0, 200);
    }
    if (parsed.type === "thread" && Array.isArray(parsed.segments)) {
      const first = parsed.segments[0];
      if (first?.type === "doc") return generateHTML(first, [StarterKit]).replace(/<[^>]+>/g, "").slice(0, 200);
      if (first?.type === "plain") return String(first.text ?? "").slice(0, 200);
    }
    return content.slice(0, 200);
  } catch {
    return content.slice(0, 200);
  }
}

function ReportRow({ report }: { report: Report }) {
  const [isPending, startTransition] = useTransition();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  function resolve(action: "hide_content" | "dismiss" | "hide_and_suspend") {
    startTransition(async () => {
      await resolveReport(report.id, action);
      setDismissed(true);
    });
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
              <Flag size={10} />
              {report.reason.replace("_", " ")}
            </span>
            <span className="text-xs text-gray-400">
              reported by @{report.reporterUsername} · {format(new Date(report.createdAt), "d MMM HH:mm")}
            </span>
          </div>

          {report.reportedPostId && (
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 mb-3">
              <p className="text-xs text-gray-500 mb-1">Post content:</p>
              <p className="text-sm text-gray-800 line-clamp-3">{getPostPreview(report.postContent)}</p>
            </div>
          )}
          {report.reportedCommentId && (
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 mb-3">
              <p className="text-xs text-gray-500">Comment reported</p>
            </div>
          )}

          {report.notes && (
            <p className="text-xs text-gray-500 italic mb-3">&ldquo;{report.notes}&rdquo;</p>
          )}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mt-2">
        <button
          disabled={isPending}
          onClick={() => resolve("hide_content")}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition disabled:opacity-50"
        >
          <EyeOff size={12} />
          Hide content
        </button>
        <button
          disabled={isPending}
          onClick={() => resolve("hide_and_suspend")}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-red-50 text-red-700 hover:bg-red-100 transition disabled:opacity-50"
        >
          <Ban size={12} />
          Hide + suspend user
        </button>
        <button
          disabled={isPending}
          onClick={() => resolve("dismiss")}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 transition disabled:opacity-50"
        >
          <X size={12} />
          Dismiss
        </button>
      </div>
    </div>
  );
}

export default function ReportsClient({ reports }: { reports: Report[] }) {
  if (reports.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
        <p className="text-gray-500">No pending reports</p>
        <p className="text-xs text-gray-400 mt-1">The community is behaving ✓</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((r) => (
        <ReportRow key={r.id} report={r} />
      ))}
    </div>
  );
}
