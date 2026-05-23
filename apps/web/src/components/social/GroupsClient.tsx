"use client";

import { useState, useTransition } from "react";
import { Users, CheckCircle } from "lucide-react";
import { joinGroup, leaveGroup } from "@/lib/actions/social";
import { cn } from "@/lib/utils";
import type { Group } from "../../../db/schema";

const TYPE_LABELS: Record<string, string> = {
  ministry: "Ministry",
  interest: "Interest",
  small_group: "Small Group",
  leadership: "Leadership",
};

interface Props {
  groups: Group[];
  joinedIds: string[];
  currentUserId: string;
}

export default function GroupsClient({ groups, joinedIds: initialJoinedIds, currentUserId }: Props) {
  const [joinedIds, setJoinedIds] = useState(new Set(initialJoinedIds));
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<string>("all");

  const filtered = filter === "all" ? groups : groups.filter((g) => g.groupType === filter);

  function toggle(group: Group) {
    const joined = joinedIds.has(group.id);
    setJoinedIds((s) => {
      const next = new Set(s);
      joined ? next.delete(group.id) : next.add(group.id);
      return next;
    });
    startTransition(async () => {
      if (joined) {
        await leaveGroup(group.slug).catch(() => {
          setJoinedIds((s) => { const next = new Set(s); next.add(group.id); return next; });
        });
      } else {
        await joinGroup(group.slug).catch(() => {
          setJoinedIds((s) => { const next = new Set(s); next.delete(group.id); return next; });
        });
      }
    });
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-4">
        {["all", "ministry", "small_group", "interest", "leadership"].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition",
              filter === t
                ? "bg-[#af601a] text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:border-[#af601a] hover:text-[#af601a]"
            )}
          >
            {t === "all" ? "All" : TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map((group) => {
          const isMember = joinedIds.has(group.id);
          return (
            <div key={group.id} className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition">
              {/* Cover */}
              <div
                className="h-24 bg-gradient-to-br from-[#af601a] to-[#e8913a] flex items-center justify-center"
                style={group.coverImageUrl ? { backgroundImage: `url(${group.coverImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
              >
                {!group.coverImageUrl && (
                  <span className="text-4xl font-black text-white/30">{group.name[0]}</span>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{group.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{TYPE_LABELS[group.groupType]}</p>
                  </div>
                  <button
                    onClick={() => toggle(group)}
                    disabled={isPending}
                    className={cn(
                      "shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition disabled:opacity-50",
                      isMember
                        ? "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600"
                        : "bg-[#af601a] text-white hover:bg-[#c47020]"
                    )}
                  >
                    {isMember ? (
                      <><CheckCircle size={12} /> Joined</>
                    ) : (
                      "Join"
                    )}
                  </button>
                </div>

                <p className="text-xs text-gray-500 mt-2 line-clamp-2">{group.description}</p>

                <div className="flex items-center gap-1 mt-3 text-xs text-gray-400">
                  <Users size={12} />
                  <span>{group.memberCount} member{group.memberCount !== 1 ? "s" : ""}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-10 text-gray-400 text-sm">No groups in this category yet.</div>
      )}
    </div>
  );
}
