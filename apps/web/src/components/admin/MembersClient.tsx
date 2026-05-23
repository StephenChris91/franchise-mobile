"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { Check, X, Ban, Unlock, ChevronUp, ChevronDown, Search, ChevronRight } from "lucide-react";
import {
  approveMember,
  rejectMember,
  suspendMember,
  unsuspendMember,
  changeMemberRole,
} from "@/lib/actions/admin";

type Status = "pending" | "approved" | "rejected" | "suspended" | "all";

interface Member {
  userId: string;
  username: string;
  fullName: string;
  photoUrl: string | null;
  email: string | null;
  ministry: string;
  role: string;
  approvalStatus: string;
  rejectionReason: string | null;
  approvedAt: Date | null;
  createdAt: Date;
}

interface Props {
  members: Member[];
  currentStatus: Status;
}

const TABS: { value: Status; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "suspended", label: "Suspended" },
  { value: "all", label: "All" },
];

function RejectDialog({ userId, name, onClose }: { userId: string; name: string; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h3 className="font-semibold text-gray-900 mb-1">Reject {name}</h3>
        <p className="text-sm text-gray-500 mb-4">Provide a reason (sent to the member by email).</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Rejection reason…"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400 mb-4"
        />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition">
            Cancel
          </button>
          <button
            disabled={isPending || !reason.trim()}
            onClick={() => startTransition(async () => { await rejectMember(userId, reason); onClose(); })}
            className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
          >
            {isPending ? "Rejecting…" : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SuspendDialog({ userId, name, onClose }: { userId: string; name: string; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h3 className="font-semibold text-gray-900 mb-1">Suspend {name}</h3>
        <p className="text-sm text-gray-500 mb-4">The member won&apos;t be able to log in while suspended.</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder="Reason (internal only)…"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 mb-4"
        />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition">
            Cancel
          </button>
          <button
            disabled={isPending}
            onClick={() => startTransition(async () => { await suspendMember(userId, reason); onClose(); })}
            className="flex-1 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition disabled:opacity-50"
          >
            {isPending ? "Suspending…" : "Suspend"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MembersClient({ members, currentStatus }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [globalFilter, setGlobalFilter] = useState(searchParams.get("search") ?? "");
  const [rejectTarget, setRejectTarget] = useState<{ id: string; name: string } | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<{ id: string; name: string } | null>(null);
  const [, startTransition] = useTransition();

  function pushTab(status: Status) {
    router.push(`/admin/members?status=${status}`);
  }

  function handleSearch(q: string) {
    setGlobalFilter(q);
    const params = new URLSearchParams();
    params.set("status", currentStatus);
    if (q) params.set("search", q);
    router.push(`/admin/members?${params.toString()}`);
  }

  const columns: ColumnDef<Member>[] = [
    {
      id: "member",
      header: "Member",
      accessorFn: (r) => r.fullName,
      cell: ({ row }) => {
        const m = row.original;
        const initials = m.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
        return (
          <div className="flex items-center gap-2.5">
            {m.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.photoUrl} alt={m.fullName} className="w-8 h-8 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#af601a] to-[#e8913a] flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{m.fullName}</p>
              <p className="text-xs text-gray-400">@{m.username}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ getValue }) => <span className="text-xs text-gray-600">{String(getValue() ?? "—")}</span>,
    },
    {
      accessorKey: "ministry",
      header: "Ministry",
      cell: ({ getValue }) => (
        <span className="text-xs text-gray-600 capitalize">{String(getValue()).replace("_", " ")}</span>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const m = row.original;
        return (
          <select
            defaultValue={m.role}
            onChange={(e) => startTransition(() => void changeMemberRole(m.userId, e.target.value as "member" | "group_leader" | "admin" | "pastor"))}
            className="text-xs border border-gray-200 rounded px-1.5 py-0.5 bg-white capitalize focus:outline-none focus:ring-1 focus:ring-[#af601a]"
          >
            <option value="member">Member</option>
            <option value="group_leader">Group Leader</option>
            <option value="admin">Admin</option>
            <option value="pastor">Pastor</option>
          </select>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Joined",
      cell: ({ getValue }) => (
        <span className="text-xs text-gray-500">{format(new Date(getValue() as Date), "d MMM yyyy")}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const m = row.original;
        return (
          <div className="flex items-center gap-1 justify-end">
            {m.approvalStatus === "pending" && (
              <>
                <button
                  onClick={() => startTransition(() => void approveMember(m.userId))}
                  title="Approve"
                  className="p-1.5 rounded text-gray-400 hover:text-green-600 hover:bg-green-50 transition"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => setRejectTarget({ id: m.userId, name: m.fullName })}
                  title="Reject"
                  className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                >
                  <X size={14} />
                </button>
              </>
            )}
            {m.approvalStatus === "approved" && (
              <button
                onClick={() => setSuspendTarget({ id: m.userId, name: m.fullName })}
                title="Suspend"
                className="p-1.5 rounded text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition"
              >
                <Ban size={14} />
              </button>
            )}
            {m.approvalStatus === "suspended" && (
              <button
                onClick={() => startTransition(() => void unsuspendMember(m.userId))}
                title="Unsuspend"
                className="p-1.5 rounded text-gray-400 hover:text-green-600 hover:bg-green-50 transition"
              >
                <Unlock size={14} />
              </button>
            )}
            <Link
              href={`/social/members/${m.username}`}
              target="_blank"
              title="View profile"
              className="p-1.5 rounded text-gray-400 hover:text-gray-700 transition"
            >
              <ChevronRight size={14} />
            </Link>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: members,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: "includesString",
  });

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => pushTab(tab.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              currentStatus === tab.value
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={globalFilter}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search name, email, username…"
          className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#af601a]"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 cursor-pointer select-none"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === "asc" && <ChevronUp size={12} />}
                      {header.column.getIsSorted() === "desc" && <ChevronDown size={12} />}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-50">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {table.getRowModel().rows.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            No {currentStatus === "all" ? "" : currentStatus} members found
          </div>
        )}
      </div>

      {/* Dialogs */}
      {rejectTarget && (
        <RejectDialog
          userId={rejectTarget.id}
          name={rejectTarget.name}
          onClose={() => setRejectTarget(null)}
        />
      )}
      {suspendTarget && (
        <SuspendDialog
          userId={suspendTarget.id}
          name={suspendTarget.name}
          onClose={() => setSuspendTarget(null)}
        />
      )}
    </>
  );
}
