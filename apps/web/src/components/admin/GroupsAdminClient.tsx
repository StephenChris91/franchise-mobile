"use client";

import { useState, useTransition } from "react";
import { Plus, Loader2, Users2 } from "lucide-react";
import { createGroup, updateGroup } from "@/lib/actions/admin";

interface Group {
  id: string;
  slug: string;
  name: string;
  description: string;
  groupType: string;
  visibility: string;
  memberCount: number;
  createdAt: Date;
}

interface Props {
  groups: Group[];
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function CreateGroupForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [groupType, setGroupType] = useState<"ministry" | "interest" | "small_group" | "leadership">("ministry");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function submit() {
    if (!name.trim()) { setError("Name is required"); return; }
    startTransition(async () => {
      try {
        await createGroup({ name: name.trim(), slug: slugify(name), description, groupType, visibility });
        onClose();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-800">Create New Group</h3>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Group name" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#af601a]" />
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[#af601a]" />
      <div className="grid grid-cols-2 gap-3">
        <select value={groupType} onChange={(e) => setGroupType(e.target.value as typeof groupType)} className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#af601a]">
          <option value="ministry">Ministry</option>
          <option value="interest">Interest</option>
          <option value="small_group">Small Group</option>
          <option value="leadership">Leadership</option>
        </select>
        <select value={visibility} onChange={(e) => setVisibility(e.target.value as typeof visibility)} className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#af601a]">
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition">Cancel</button>
        <button onClick={submit} disabled={isPending} className="flex-1 py-2 bg-[#af601a] text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-1">
          {isPending ? <><Loader2 size={12} className="animate-spin" /> Creating…</> : "Create Group"}
        </button>
      </div>
    </div>
  );
}

export default function GroupsAdminClient({ groups }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [, startTransition] = useTransition();

  return (
    <div>
      <div className="mb-4">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#af601a] text-white text-sm font-semibold hover:bg-[#c47020] transition"
        >
          <Plus size={16} />
          New Group
        </button>
      </div>

      {showCreate && <CreateGroupForm onClose={() => setShowCreate(false)} />}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Group</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 hidden md:table-cell">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 hidden lg:table-cell">Visibility</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Members</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {groups.map((g) => (
              <tr key={g.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#af601a]/10 flex items-center justify-center shrink-0">
                      <Users2 size={13} className="text-[#af601a]" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{g.name}</p>
                      <p className="text-xs text-gray-400">/{g.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-xs text-gray-600 capitalize">{g.groupType.replace("_", " ")}</span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${g.visibility === "public" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {g.visibility}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-semibold text-gray-900">{g.memberCount}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  {editingId === g.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        placeholder="Update description…"
                        className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#af601a] w-40"
                      />
                      <button
                        onClick={() => {
                          startTransition(() => void updateGroup(g.id, { description: editDesc }).then(() => setEditingId(null)));
                        }}
                        className="text-xs text-[#af601a] hover:underline"
                      >
                        Save
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-xs text-gray-400 hover:underline">Cancel</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingId(g.id); setEditDesc(g.description); }}
                      className="text-xs text-gray-500 hover:text-[#af601a] transition"
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {groups.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-sm">No groups yet</div>
        )}
      </div>
    </div>
  );
}
