"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Member {
  userId: string;
  username: string;
  fullName: string;
  photoUrl?: string | null;
  ministry: string;
  bio?: string | null;
}

interface Props {
  members: Member[];
  currentUserId: string;
}

export default function MembersClient({ members, currentUserId }: Props) {
  const [search, setSearch] = useState("");

  const filtered = search
    ? members.filter(
        (m) =>
          m.fullName.toLowerCase().includes(search.toLowerCase()) ||
          m.username.toLowerCase().includes(search.toLowerCase()) ||
          m.ministry.toLowerCase().includes(search.toLowerCase())
      )
    : members;

  return (
    <div>
      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or ministry…"
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#af601a]"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map((m) => (
          <a
            key={m.userId}
            href={`/social/members/${m.username}`}
            className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition"
          >
            {m.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.photoUrl} alt={m.fullName} className="w-12 h-12 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#af601a] to-[#e8913a] flex items-center justify-center text-base font-bold text-white shrink-0">
                {m.fullName[0]}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">
                {m.fullName}
                {m.userId === currentUserId && (
                  <span className="ml-1.5 text-[10px] text-[#af601a] font-normal">(you)</span>
                )}
              </p>
              <p className="text-xs text-gray-400 capitalize mt-0.5">{m.ministry.replace("_", " ")}</p>
              {m.bio && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{m.bio}</p>}
            </div>
          </a>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-10 text-gray-400 text-sm">
          No members found matching &ldquo;{search}&rdquo;
        </div>
      )}
    </div>
  );
}
